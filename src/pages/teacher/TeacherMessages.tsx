import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import MessageActionsMenu from "@/components/chat/MessageActionsMenu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { messagesAPI, teacherAPI } from "@/services/api";
import { uploadFileToCloudinary } from "@/services/cloudinary";
import {
  ChevronLeft,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Phone,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  Video,
  VolumeX,
} from "lucide-react";

type ConversationItem = {
  _id: string;
  type?: "direct" | "group";
  displayName?: string;
  title?: string;
  course?: { _id: string; title: string } | null;
  peer?: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeenLabel?: string;
  } | null;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  othersTyping?: boolean;
  muted?: boolean;
};

type Attachment = {
  name: string;
  url: string;
  mimeType: string;
  size: number;
  type: string;
};

type MessageItem = {
  _id?: string;
  localId?: string;
  senderId: any;
  text?: string;
  attachments?: Attachment[];
  status?: "sent" | "delivered" | "seen";
  createdAt: string;
  editedAt?: string | null;
};

const dayLabel = (value: string) => {
  const now = new Date();
  const date = new Date(value);
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString();
};

const formatTime = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatConversationTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return formatTime(value);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString();
};

const getSenderId = (sender: any) => String(sender?._id || sender || "");

const TeacherMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const meId = String(user?.id || "");

  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [activeConversation, setActiveConversation] = useState<any>(null);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<Attachment[]>([]);
  const [messageText, setMessageText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [composerMode, setComposerMode] = useState<null | { type: "reply" | "forward" | "edit"; message: MessageItem }>(null);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [newChatStudentId, setNewChatStudentId] = useState<string>("none");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const typingStopTimer = useRef<any>(null);
  const isTypingSentRef = useRef(false);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const groupedMessages = useMemo(() => {
    const groups: Array<{ label: string; messages: MessageItem[] }> = [];
    messages.forEach((message) => {
      const label = dayLabel(message.createdAt);
      const existing = groups.find((group) => group.label === label);
      if (existing) existing.messages.push(message);
      else groups.push({ label, messages: [message] });
    });
    return groups;
  }, [messages]);

  const activeSummary = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.find((conversation) => conversation._id === activeConversationId) || null;
  }, [activeConversationId, conversations]);

  const activeOthersTyping = useMemo(() => {
    if (activeSummary?.othersTyping) return true;
    const participants = Array.isArray(activeConversation?.participants) ? activeConversation.participants : [];
    return participants.some((participant: any) => {
      if (String(participant?.userId) === meId) return false;
      if (!participant?.isTyping) return false;
      const ts = participant?.typingUpdatedAt ? new Date(participant.typingUpdatedAt).getTime() : NaN;
      return Number.isFinite(ts) && Date.now() - ts < 20000;
    });
  }, [activeConversation, activeSummary?.othersTyping, meId]);

  const latestOwnMessageStatus = useMemo(() => {
    const latestOwn = [...messages].reverse().find((message) => getSenderId(message.senderId) === meId);
    return latestOwn?.status || "sent";
  }, [messages, meId]);

  const loadConversations = async (query = search, keepSelected = true) => {
    try {
      if (!keepSelected) setLoadingConversations(true);
      const res = await messagesAPI.listConversations(query ? { search: query } : undefined);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setConversations(rows);
      if (!activeConversationId && rows.length > 0) {
        setActiveConversationId(String(rows[0]._id));
      }
    } catch (error: any) {
      toast({ title: "Failed to load conversations", description: error?.message, variant: "destructive" });
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await teacherAPI.getStudents();
      setStudents(Array.isArray(res?.data) ? res.data : []);
    } catch (error: any) {
      toast({ title: "Failed to load students", description: error?.message, variant: "destructive" });
    }
  };

  const loadMessages = async (conversationId: string, silent = false) => {
    if (!conversationId) return;
    if (!silent) setLoadingMessages(true);

    try {
      const res = await messagesAPI.getMessages(conversationId, { limit: 200 });
      const payload = res?.data || {};
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
      setSharedFiles(Array.isArray(payload?.sharedFiles) ? payload.sharedFiles : []);
      setActiveConversation(payload?.conversation || null);

      try {
        await messagesAPI.markRead(conversationId);
      } catch {
        // Keep chat usable even if read-receipt update fails.
      }
    } catch (error: any) {
      toast({ title: "Failed to load messages", description: error?.message, variant: "destructive" });
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations("", false);
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadConversations(search, true);
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    loadMessages(activeConversationId, false);

    const timer = setInterval(() => {
      loadMessages(activeConversationId, true);
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeOthersTyping]);

  const onTypingChange = async (next: string) => {
    setMessageText(next);
    if (!activeConversationId) return;

    if (!isTypingSentRef.current && next.trim().length > 0) {
      isTypingSentRef.current = true;
      try {
        await messagesAPI.setTyping(activeConversationId, true);
      } catch {
        // ignore typing network errors
      }
    }

    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(async () => {
      if (!activeConversationId) return;
      isTypingSentRef.current = false;
      try {
        await messagesAPI.setTyping(activeConversationId, false);
      } catch {
        // ignore typing network errors
      }
    }, 1200);
  };

  const handleCreateConversation = async () => {
    if (!newChatStudentId || newChatStudentId === "none") return;
    try {
      const res = await messagesAPI.createConversation({ studentId: newChatStudentId });
      const created = res?.data;
      if (created?._id) setActiveConversationId(String(created._id));
      setNewChatStudentId("none");
      await loadConversations(search, true);
    } catch (error: any) {
      toast({ title: "Failed to start chat", description: error?.message, variant: "destructive" });
    }
  };

  const handleUploadAttachments = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const list = Array.from(files);
      const uploaded = await Promise.all(
        list.map(async (file) => {
          const url = await uploadFileToCloudinary(file);
          const mimeType = file.type || "";
          const type = mimeType.startsWith("image/")
            ? "image"
            : mimeType.includes("pdf")
              ? "pdf"
              : mimeType.includes("word") || mimeType.includes("officedocument")
                ? "doc"
                : "file";
          return {
            name: file.name,
            url,
            mimeType,
            size: file.size,
            type,
          };
        })
      );
      setPendingAttachments((prev) => [...prev, ...uploaded]);
    } catch (error: any) {
      toast({ title: "Attachment upload failed", description: error?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text && pendingAttachments.length === 0) return;

    if (composerMode?.type === "edit" && composerMode.message._id) {
      if (!activeConversationId) return;
      try {
        const res = await messagesAPI.editMessage(activeConversationId, composerMode.message._id, { text });
        const saved = res?.data;
        setMessages((prev) => prev.map((msg) => (msg._id === saved?._id ? { ...msg, ...saved } : msg)));
        clearComposerMode();
        setMessageText("");
        await loadMessages(activeConversationId, true);
      } catch (error: any) {
        toast({ title: "Failed to edit message", description: error?.message, variant: "destructive" });
      }
      return;
    }

    let conversationId = activeConversationId;
    if (!conversationId && newChatStudentId && newChatStudentId !== "none") {
      try {
        const created = await messagesAPI.createConversation({ studentId: newChatStudentId });
        conversationId = String(created?.data?._id || "");
        setActiveConversationId(conversationId);
      } catch (error: any) {
        toast({ title: "Failed to start conversation", description: error?.message, variant: "destructive" });
        return;
      }
    }

    if (!conversationId) {
      toast({ title: "Select a conversation", description: "Pick a student or existing chat first." });
      return;
    }

    setSending(true);
    const localId = `local-${Date.now()}`;
    const optimistic: MessageItem = {
      localId,
      senderId: { _id: meId, name: user?.name || "Teacher", avatar: user?.avatar || "" },
      text,
      attachments: pendingAttachments,
      status: "sent",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessageText("");
    setPendingAttachments([]);
    setComposerMode(null);
    isTypingSentRef.current = false;
    try {
      await messagesAPI.setTyping(conversationId, false);
    } catch {
      // ignore
    }

    try {
      const res = await messagesAPI.sendMessage(conversationId, { text, attachments: optimistic.attachments || [] });
      const saved = res?.data;
      setMessages((prev) => prev.map((msg) => (msg.localId === localId ? saved : msg)));
      await Promise.all([loadConversations(search, true), loadMessages(conversationId, true)]);
    } catch (error: any) {
      setMessages((prev) => prev.filter((msg) => msg.localId !== localId));
      toast({ title: "Failed to send message", description: error?.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const toggleMute = async () => {
    if (!activeConversationId) return;
    try {
      const current = Boolean(activeSummary?.muted);
      await messagesAPI.setMute(activeConversationId, !current);
      await loadConversations(search, true);
    } catch (error: any) {
      toast({ title: "Failed to update mute", description: error?.message, variant: "destructive" });
    }
  };

  const clearComposerMode = () => {
    setComposerMode(null);
  };

  const getMessageAuthorName = (message: MessageItem) => {
    const sender = message.senderId || {};
    return String(sender.name || sender.displayName || sender.fullName || (getSenderId(sender) === meId ? user?.name || "You" : "Participant"));
  };

  const handleReply = (message: MessageItem) => {
    setComposerMode({ type: "reply", message });
    setMessageText((prev) => prev || `Reply to ${getMessageAuthorName(message)}: `);
  };

  const handleForward = (message: MessageItem) => {
    setComposerMode({ type: "forward", message });
    const snippet = (message.text || message.attachments?.[0]?.name || "message").slice(0, 80);
    setMessageText((prev) => prev || `Forwarded from ${getMessageAuthorName(message)}: ${snippet}`);
  };

  const handleEdit = (message: MessageItem) => {
    if (!message._id) return;
    setComposerMode({ type: "edit", message });
    setMessageText(message.text || "");
  };

  const handleDeleteMessage = async (message: MessageItem, scope: "me" | "everyone") => {
    if (!activeConversationId || !message._id) return;
    try {
      await messagesAPI.deleteMessage(activeConversationId, message._id, scope);
      if (scope === "everyone") {
        await loadMessages(activeConversationId, true);
        await loadConversations(search, true);
      } else {
        setMessages((prev) => prev.filter((item) => (item._id || item.localId) !== message._id));
      }
      if (composerMode?.message?._id === message._id) {
        clearComposerMode();
        setMessageText("");
      }
    } catch (error: any) {
      toast({ title: "Failed to delete message", description: error?.message, variant: "destructive" });
    }
  };

  const statusIcon = (status: string) => {
    if (status === "seen") return <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMobileView("chat");
  };

  const conversationList = (
    <Card className="h-full min-h-0 overflow-hidden border-border bg-card shadow-[0_18px_45px_-30px_rgba(0,0,0,0.35)]">
      <CardContent className="flex h-full min-h-0 flex-col p-0">
        <div className="border-b border-border px-4 pb-3 pt-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Messages</h1>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                loadConversations(event.target.value, true);
              }}
              placeholder="Search"
              className="h-11 rounded-full border-border bg-muted pl-9 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Select value={newChatStudentId} onValueChange={setNewChatStudentId}>
              <SelectTrigger className="h-10 rounded-full border-border bg-background">
                <SelectValue placeholder="New chat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select student</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student._id} value={String(student._id)}>{student.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-10 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90" onClick={handleCreateConversation}>
              <Plus className="mr-1 h-4 w-4" /> Start
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/40 p-2 dark:bg-zinc-900/50">
          {loadingConversations ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet</div>
          ) : (
            <div className="space-y-1.5">
              {conversations.map((conversation) => {
                const active = conversation._id === activeConversationId;
                return (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => selectConversation(conversation._id)}
                    className={`w-full rounded-2xl px-3 py-2 text-left transition-all ${active ? "bg-card shadow-sm ring-1 ring-border" : "hover:bg-muted/70"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5">
                        <Avatar className="h-11 w-11 border border-border">
                          <AvatarImage src={conversation.peer?.avatar || ""} alt={conversation.displayName || conversation.peer?.name || "Conversation"} />
                          <AvatarFallback>{(conversation.displayName || conversation.peer?.name || "C").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background ${conversation.peer?.isOnline ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[15px] font-bold text-foreground">{conversation.displayName || conversation.peer?.name || "Conversation"}</p>
                          <span className="text-[11px] text-muted-foreground">{formatConversationTime(conversation.lastMessageAt)}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {conversation.othersTyping
                            ? `${conversation.displayName || conversation.peer?.name || "Participant"} is typing...`
                            : conversation.lastMessagePreview || "No messages yet"}
                        </p>
                      </div>

                      {Number(conversation.unreadCount || 0) > 0 ? (
                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white">{conversation.unreadCount}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const chatPanel = (
    <Card className="h-full min-h-0 overflow-hidden border-border bg-card shadow-[0_18px_45px_-30px_rgba(0,0,0,0.35)]">
      <CardContent className="flex h-full min-h-0 flex-col p-0">
        {activeConversationId && activeSummary ? (
          <>
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full lg:hidden" onClick={() => setMobileView("list")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={activeSummary.peer?.avatar || ""} alt={activeSummary.displayName || activeSummary.peer?.name || "Conversation"} />
                  <AvatarFallback>{(activeSummary.displayName || activeSummary.peer?.name || "C").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-foreground">{activeSummary.displayName || activeSummary.peer?.name || "Conversation"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {activeSummary.othersTyping
                      ? `${activeSummary.displayName || activeSummary.peer?.name || "Participant"} is typing...`
                      : activeSummary.peer?.lastSeenLabel || "Offline"}
                    {activeSummary.course?.title ? ` � ${activeSummary.course.title}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground" onClick={toggleMute} title="Mute conversation">
                  <VolumeX className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 px-3 py-4 md:px-4 dark:bg-zinc-900/70">
              {loadingMessages ? (
                <div className="space-y-2">
                  <Skeleton className="ml-auto h-11 w-2/3 rounded-2xl" />
                  <Skeleton className="h-11 w-2/3 rounded-2xl" />
                  <Skeleton className="ml-auto h-11 w-2/3 rounded-2xl" />
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedMessages.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <div className="flex justify-center">
                        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{group.label}</span>
                      </div>

                      {group.messages.map((message) => {
                        const mine = getSenderId(message.senderId) === meId;
                        return (
                          <div key={message._id || message.localId} className={`group relative flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`relative max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card text-card-foreground"}`}>
                              <MessageActionsMenu
                                isMine={mine}
                                onReply={() => handleReply(message)}
                                onForward={() => handleForward(message)}
                                onEdit={() => handleEdit(message)}
                                onDeleteForMe={() => handleDeleteMessage(message, "me")}
                                onDeleteForEveryone={() => handleDeleteMessage(message, "everyone")}
                              />

                              {message.text ? <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p> : null}

                              {(message.attachments || []).length > 0 ? (
                                <div className="mt-2 space-y-1.5">
                                  {(message.attachments || []).map((attachment, index) => (
                                    <a
                                      key={`${attachment.url}-${index}`}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-xs ${mine ? "border-primary-foreground/20" : "border-border"}`}
                                    >
                                      {attachment.type === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                      <span className="truncate">{attachment.name || "Attachment"}</span>
                                    </a>
                                  ))}
                                </div>
                              ) : null}

                              <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                <span>{formatTime(message.createdAt)}</span>
                                {mine ? statusIcon(message.status || "sent") : null}
                                {message.editedAt ? <span className="text-[9px] italic">edited</span> : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {activeOthersTyping ? (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
                        {activeSummary.displayName || activeSummary.peer?.name || "Participant"} is typing...
                      </div>
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-border bg-card px-3 pb-3 pt-2 md:px-4">
              {composerMode ? (
                <div className="mb-2 flex items-center justify-between rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <span>
                    {composerMode.type === "edit"
                      ? `Editing message from ${getMessageAuthorName(composerMode.message)}`
                      : composerMode.type === "reply"
                        ? `Replying to ${getMessageAuthorName(composerMode.message)}`
                        : `Forwarding from ${getMessageAuthorName(composerMode.message)}`}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 rounded-full px-2 text-xs" onClick={() => { clearComposerMode(); setMessageText(""); }}>
                    Cancel
                  </Button>
                </div>
              ) : null}

              {pendingAttachments.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {pendingAttachments.map((attachment, index) => (
                    <button
                      key={`${attachment.url}-${index}`}
                      type="button"
                      onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== index))}
                      className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {attachment.name} �
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <input
                  ref={inputFileRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(event) => {
                    handleUploadAttachments(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />

                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border" onClick={() => inputFileRef.current?.click()} disabled={uploading}>
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Input
                  value={messageText}
                  placeholder={composerMode?.type === "edit" ? "Edit message..." : "Type here..."}
                  className="h-10 rounded-full border-border bg-muted"
                  onChange={(event) => onTypingChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                />

                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border" onClick={() => setMessageText((prev) => `${prev}${prev ? " " : ""}??`)}>
                  <Smile className="h-4 w-4" />
                </Button>

                <Button className="h-9 rounded-full bg-primary px-3 text-primary-foreground hover:bg-primary/90" onClick={handleSend} disabled={sending || uploading}>
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{uploading ? "Uploading attachment..." : `${sharedFiles.length} shared files`}</span>
                <span className="flex items-center gap-1">
                  {statusIcon(latestOwnMessageStatus)}
                  {latestOwnMessageStatus === "seen" ? "Seen" : latestOwnMessageStatus === "delivered" ? "Delivered" : "Sent"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 rounded-full bg-muted p-4">
              <SendHorizontal className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Select a conversation to start messaging</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose a student from the list and start chatting.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[680px] rounded-3xl bg-muted/30 p-2 md:p-4 overflow-hidden dark:bg-zinc-950">
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className={`${mobileView === "chat" ? "hidden lg:block" : "block"} min-h-0`}>
          {conversationList}
        </div>
        <div className={`${mobileView === "list" ? "hidden lg:block" : "block"} min-h-0`}>
          {chatPanel}
        </div>
      </div>
    </div>
  );
};

export default TeacherMessages;
