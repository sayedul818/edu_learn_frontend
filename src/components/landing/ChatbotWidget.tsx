import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, Send, MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = {
  role: "assistant" | "user";
  text: string;
};

const quickReplies = [
  "কীভাবে শুরু করব?",
  "MCQ আর CQ এর পার্থক্য কী?",
  "শিক্ষকের জন্য কী সুবিধা আছে?",
  "ফ্রি তে ব্যবহার করা যাবে?",
];

const cannedResponses: Record<string, string> = {
  "কীভাবে শুরু করব?": "শুরু করতে Sign Up করুন, তারপর আপনার কোর্স বা ব্যাচ নির্বাচন করুন। ছাত্র হলে প্রশ্ন ব্যাংক ও লাইভ এক্সাম, শিক্ষক হলে কোর্স ও প্রশ্ন তৈরি মডিউল পাবেন।",
  "MCQ আর CQ এর পার্থক্য কী?": "MCQ দ্রুত অনুশীলনের জন্য, আর CQ গঠনমূলক উত্তর ও ব্যাখ্যা লেখার জন্য। ExamPathshala-তে দুটোই একসাথে আছে।",
  "শিক্ষকের জন্য কী সুবিধা আছে?": "শিক্ষকরা প্রশ্ন তৈরি, কোর্স ম্যানেজ, পরীক্ষার ফল বিশ্লেষণ এবং ছাত্রদের প্রগ্রেস ট্র্যাক করতে পারেন।",
  "ফ্রি তে ব্যবহার করা যাবে?": "হ্যাঁ, শুরুতে ফ্রি অনুশীলন ও ডেমো ফিচার ব্যবহার করা যাবে। পরে দরকার হলে আরও অ্যাডভান্সড ফিচার যোগ করা যায়।",
};

const fallbackResponses = [
  "আপনি চাইলে আমি ছাত্র, শিক্ষক, কোর্স, বা পরীক্ষার যেকোনো বিষয়ে গাইড করতে পারি।",
  "প্রশ্ন ব্যাংক, লাইভ পরীক্ষা, আর ড্যাশবোর্ড নিয়ে জানতে চাইলে বলুন।",
  "আপনার লক্ষ্য SSC, HSC, নাকি ভর্তি প্রস্তুতি? আমি সেই অনুযায়ী সাহায্য করব।",
];

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "হ্যালো! আমি LearnSmart Prep সহকারী। ছাত্র, শিক্ষক, কোর্স, বা পরীক্ষার যেকোনো প্রশ্ন করুন।",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  const pushAssistantReply = (text: string) => {
    setMessages((prev) => [...prev, { role: "assistant", text }]);
  };

  const handleSend = (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    window.setTimeout(() => {
      const exact = cannedResponses[text];
      if (exact) {
        pushAssistantReply(exact);
        return;
      }

      const matched = quickReplies.find((reply) => text.includes(reply.replace("?", "")) || reply.includes(text));
      if (matched) {
        pushAssistantReply(cannedResponses[matched]);
        return;
      }

      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      pushAssistantReply(`${fallback} আপনি চাইলে এখানে লিখতে পারেন: “SSC কোর্স”, “লাইভ পরীক্ষা”, “teacher dashboard”`);
    }, 450);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          type="button"
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-3 text-foreground shadow-[0_18px_46px_rgba(0,0,0,0.25)] backdrop-blur-md transition-transform hover:-translate-y-1 sm:bottom-5 sm:right-5 sm:gap-3 sm:px-4"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-muted/60 text-foreground shadow-md sm:h-10 sm:w-10">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="hidden sm:block text-left leading-tight">
            <span className="block text-sm font-semibold">AI সহকারী</span>
            <span className="block text-xs text-muted-foreground">প্রশ্ন করুন, দ্রুত উত্তর নিন</span>
          </span>
          <MessageCircleMore className="h-4 w-4 text-muted-foreground" />
        </motion.button>
      </DialogTrigger>

      <DialogContent className="!flex !h-[calc(100vh-1rem)] !w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] !flex-col overflow-hidden border-border/70 bg-card p-0 text-foreground shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:!h-auto sm:!w-[94vw] sm:!max-w-[460px] sm:!rounded-2xl sm:!max-h-[85vh]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--foreground)/0.06),transparent_30%),radial-gradient(circle_at_bottom_left,hsl(var(--muted-foreground)/0.1),transparent_24%)]" />

        <DialogHeader className="relative border-b border-border/70 px-4 py-4 text-left sm:px-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-muted/60 text-foreground shadow-md sm:h-9 sm:w-9">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
                LearnSmart Prep Assistant
              </DialogTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">Bangla-first help for students and teachers</p>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-2 scroll-smooth overscroll-contain">
            <div className="space-y-3 pr-1">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.text.slice(0, 10)}`}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                      message.role === "user"
                        ? "border border-border/70 bg-muted/55 text-foreground backdrop-blur"
                        : "border border-border/70 bg-card/80 text-foreground/90 backdrop-blur",
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleSend(reply)}
                className="rounded-full border border-border/70 bg-card/70 px-3 py-2 text-[11px] text-foreground/90 transition-colors hover:bg-muted/45 sm:py-1.5 sm:text-xs"
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="mt-3 flex shrink-0 items-end gap-2 rounded-2xl border border-border/70 bg-card/70 p-2 sm:mt-4 sm:items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="আপনার প্রশ্ন লিখুন..."
              className="h-11 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-10"
            />
            <Button
              type="button"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl border border-border/70 bg-muted/65 text-foreground shadow-md hover:bg-muted/85 sm:h-10 sm:w-10"
              onClick={() => handleSend(input)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotWidget;