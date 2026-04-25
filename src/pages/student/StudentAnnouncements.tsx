import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarClock, ExternalLink, Heart, Megaphone, MessageSquare, Paperclip, Pin, Search, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { coursesAPI } from "@/services/api";
import { useStudentCourse } from "@/contexts/StudentCourseContext";

type AnnouncementAttachment = {
  name?: string;
  url?: string;
  type?: string;
  size?: number;
};

type AnnouncementRow = {
  _id: string;
  title?: string;
  message?: string;
  body?: string;
  priority?: "normal" | "important" | "urgent";
  isPinned?: boolean;
  status?: "draft" | "published" | "scheduled";
  createdAt?: string;
  updatedAt?: string;
  attachments?: AnnouncementAttachment[];
  likedBy?: string[];
  seenBy?: string[];
  comments?: any[];
  courseId: string;
  courseTitle: string;
  teacherName?: string;
  teacherAvatar?: string;
};

type CourseAnnouncementPayload = {
  courseId: string;
  courseTitle: string;
  announcements: AnnouncementRow[];
};

type ViewFilter = "all" | "unread" | "pinned" | "important";

type SortType = "newest" | "oldest" | "updated";

const getRelativeTime = (value?: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const now = Date.now();
  const diff = now - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return date.toLocaleDateString();
};

const StudentAnnouncements = () => {
  const { toast } = useToast();
  const { selectedCourseId, selectedCourse } = useStudentCourse();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CourseAnnouncementPayload[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [sortBy, setSortBy] = useState<SortType>("newest");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await coursesAPI.listMyAnnouncements();
        setRows(Array.isArray(response?.data) ? response.data : []);
      } catch (error: any) {
        toast({
          title: "Failed to load announcements",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  const flattened = useMemo(() => {
    const scopedRows = selectedCourseId
      ? rows.filter((courseRow) => String(courseRow.courseId) === String(selectedCourseId))
      : rows;
    return scopedRows.flatMap((courseRow) =>
      (courseRow.announcements || []).map((announcement) => ({
        ...announcement,
        courseId: courseRow.courseId,
        courseTitle: courseRow.courseTitle,
      }))
    );
  }, [rows, selectedCourseId]);

  const metrics = useMemo(() => {
    const all = flattened.length;
    const unread = flattened.filter((item) => !(item.seenBy || []).length).length;
    const pinned = flattened.filter((item) => Boolean(item.isPinned)).length;
    const important = flattened.filter((item) => item.priority === "important" || item.priority === "urgent").length;
    return { all, unread, pinned, important };
  }, [flattened]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const matchByFilter = (item: AnnouncementRow) => {
      if (filter === "all") return true;
      if (filter === "unread") return !(item.seenBy || []).length;
      if (filter === "pinned") return Boolean(item.isPinned);
      return item.priority === "important" || item.priority === "urgent";
    };

    return flattened.filter((item) => {
      const text = `${item.title || ""} ${item.message || item.body || ""} ${item.courseTitle || ""} ${item.teacherName || ""}`.toLowerCase();
      const matchesSearch = !q || text.includes(q);
      return matchesSearch && matchByFilter(item);
    });
  }, [filter, flattened, search]);

  const sorted = useMemo(() => {
    const score = (item: AnnouncementRow) => {
      const source = sortBy === "updated" ? item.updatedAt || item.createdAt : item.createdAt;
      const date = source ? new Date(source) : null;
      const ts = date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
      return ts;
    };

    const list = [...filtered];
    list.sort((a, b) => {
      const pinWeight = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
      if (pinWeight !== 0) return pinWeight;
      const priorityWeight = (b.priority === "urgent" ? 2 : b.priority === "important" ? 1 : 0) - (a.priority === "urgent" ? 2 : a.priority === "important" ? 1 : 0);
      if (priorityWeight !== 0) return priorityWeight;
      if (sortBy === "oldest") return score(a) - score(b);
      return score(b) - score(a);
    });

    return list;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [page, sorted]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const markSeen = async (courseId: string, announcementId: string) => {
    setRows((previous) =>
      previous.map((courseRow) => {
        if (courseRow.courseId !== courseId) return courseRow;
        return {
          ...courseRow,
          announcements: (courseRow.announcements || []).map((item) =>
            item._id === announcementId && !(item.seenBy || []).length
              ? { ...item, seenBy: ["me"] }
              : item
          ),
        };
      })
    );

    try {
      await coursesAPI.markMyAnnouncementSeen(courseId, announcementId);
    } catch {
      // Keep optimistic seen state for smoother student UX.
    }
  };

  const toggleLike = async (courseId: string, announcementId: string) => {
    let nextLiked = false;

    setRows((previous) =>
      previous.map((courseRow) => {
        if (courseRow.courseId !== courseId) return courseRow;
        return {
          ...courseRow,
          announcements: (courseRow.announcements || []).map((item) => {
            if (item._id !== announcementId) return item;
            const liked = (item.likedBy || []).length > 0;
            nextLiked = !liked;
            return { ...item, likedBy: nextLiked ? ["me"] : [] };
          }),
        };
      })
    );

    try {
      await coursesAPI.toggleMyAnnouncementLike(courseId, announcementId);
    } catch {
      toast({
        title: "Could not update reaction",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/60 p-5 shadow-lg md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Live Classroom Updates</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">{selectedCourse ? `Announcements for ${selectedCourse.courseTitle}` : "Stay updated with teacher notices, course alerts, and important reminders."}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { key: "all", label: "All", value: metrics.all, icon: Bell },
          { key: "unread", label: "Unread", value: metrics.unread, icon: Sparkles },
          { key: "pinned", label: "Pinned", value: metrics.pinned, icon: Pin },
          { key: "important", label: "Important", value: metrics.important, icon: CalendarClock },
        ].map((tile) => {
          const Icon = tile.icon;
          const active = filter === tile.key;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => setFilter(tile.key as ViewFilter)}
              className={`rounded-xl border p-3 text-left shadow-sm transition-shadow hover:shadow-md ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}
              style={{ boxShadow: "rgba(0, 0, 0, 0.12) 0px 6px 16px" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{tile.label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-1 text-xl font-semibold">{tile.value}</p>
            </button>
          );
        })}
      </div>

      <Card className="border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/80">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              placeholder="Search by title, message, teacher, or course..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Sort:</span>
            {[
              { key: "newest", label: "Newest" },
              { key: "oldest", label: "Oldest" },
              { key: "updated", label: "Recently Updated" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSortBy(option.key as SortType)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${sortBy === option.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Loading announcements...</CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No announcements found for the selected view.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginated.map((announcement) => {
            const message = announcement.message || announcement.body || "No message body provided.";
            const isUnread = !(announcement.seenBy || []).length;
            const isLiked = (announcement.likedBy || []).length > 0;
            const likesCount = (announcement.likedBy || []).length;
            const commentsCount = (announcement.comments || []).length;
            const hasAttachments = (announcement.attachments || []).length > 0;

            return (
              <Card
                key={`${announcement.courseId}-${announcement._id}`}
                className={`border transition-shadow hover:shadow-lg ${isUnread ? "border-primary/40 bg-primary/5" : "border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/80"}`}
                onClick={() => markSeen(announcement.courseId, announcement._id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{announcement.title || "Course Announcement"}</CardTitle>
                        {announcement.isPinned ? <Badge variant="secondary"><Pin className="mr-1 h-3 w-3" />Pinned</Badge> : null}
                        {(announcement.priority === "important" || announcement.priority === "urgent") ? (
                          <Badge variant="destructive">{announcement.priority}</Badge>
                        ) : null}
                        {isUnread ? <Badge variant="outline">New</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {announcement.teacherName || "Teacher"} • {announcement.courseTitle} • {getRelativeTime(announcement.createdAt)}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt ? `Updated ${getRelativeTime(announcement.updatedAt)}` : ""}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{message}</p>

                  {hasAttachments ? (
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>Attachments</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(announcement.attachments || []).map((file, index) => (
                          <Button key={`${announcement._id}-att-${index}`} asChild size="sm" variant="outline">
                            <a href={file.url || "#"} target="_blank" rel="noreferrer" onClick={(event) => { if (!file.url) event.preventDefault(); }}>
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> {file.name || "Attachment"}
                            </a>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {(announcement.seenBy || []).length} seen</span>
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {commentsCount} comments</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isLiked ? "default" : "outline"}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleLike(announcement.courseId, announcement._id);
                      }}
                    >
                      <Heart className="mr-1.5 h-3.5 w-3.5" /> {isLiked ? "Liked" : "Like"} ({likesCount})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((previous) => Math.max(1, previous - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;
