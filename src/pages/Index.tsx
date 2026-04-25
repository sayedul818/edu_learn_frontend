import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BrainCircuit,
  Clock3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Flame,
  Headset,
  Layers3,
  LineChart,
  MessageCircleMore,
  PlayCircle,
  Star,
  Target,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ChatbotWidget from "@/components/landing/ChatbotWidget";
import { Button } from "@/components/ui/button";
import courseSSC from "@/assets/course-ssc.svg";
import courseHSC from "@/assets/course-hsc.svg";
import courseAdmission from "@/assets/course-admission.svg";

const partnerLogos = [
  { name: "bKash", src: "https://logo.clearbit.com/bkash.com" },
  { name: "Nagad", src: "https://logo.clearbit.com/nagad.com.bd" },
  { name: "Amazon", src: "https://logo.clearbit.com/amazon.com" },
  { name: "Walmart", src: "https://logo.clearbit.com/walmart.com" },
  { name: "TCS", src: "https://logo.clearbit.com/tcs.com" },
  { name: "Razorpay", src: "https://logo.clearbit.com/razorpay.com" },
  { name: "Stripe", src: "https://logo.clearbit.com/stripe.com" },
  { name: "Mastercard", src: "https://logo.clearbit.com/mastercard.com" },
];

const featureCards = [
  {
    icon: BookOpen,
    title: "প্রশ্ন ব্যাংক",
    description: "ক্লাস, বিষয়, অধ্যায়, টপিক অনুযায়ী সাজানো অনুশীলন।",
  },
  {
    icon: ClipboardList,
    title: "অনলাইন পরীক্ষা",
    description: "কাউন্টডাউন, অটো সাবমিট, রিয়েল এক্সাম অনুভূতি।",
  },
  {
    icon: LineChart,
    title: "রেজাল্ট অ্যানালিটিক্স",
    description: "স্কোর ট্রেন্ড, দুর্বলতা, accuracy সব এক স্ক্রিনে।",
  },
  {
    icon: BrainCircuit,
    title: "টপিকভিত্তিক প্র্যাকটিস",
    description: "দুর্বল অধ্যায়ে ফোকাস করে দ্রুত অগ্রগতি।",
  },
  {
    icon: Trophy,
    title: "লিডারবোর্ড",
    description: "দৈনিক, সাপ্তাহিক, মাসিক র‍্যাঙ্কে প্রতিযোগিতা।",
  },
  {
    icon: MessageCircleMore,
    title: "AI সহকারী প্রিভিউ",
    description: "প্রতিদিন কী পড়বেন তার দ্রুত সাজেশন।",
  },
];

const courses = [
  {
    title: "জব রেডি AI Powered Complete Web Development + DSA",
    text: "Beginner থেকে advanced পর্যন্ত guided roadmap.",
    price: "৳৫,৯৯৯",
    oldPrice: "৳১১,৯৯৮",
    image: courseSSC,
    accent: "hsl(var(--foreground))",
  },
  {
    title: "Data Science & Analytics with Gen AI",
    text: "Project-based learning with live mentor support.",
    price: "৳৬,৯৯৯",
    oldPrice: "৳১২,৪৯৯",
    image: courseHSC,
    accent: "hsl(var(--muted-foreground))",
  },
  {
    title: "প্রিমিয়াম পরীক্ষার প্রস্তুতি ব্যাচ",
    text: "SSC, HSC, admission এর জন্য full practice workflow.",
    price: "৳৩,৪৯৯",
    oldPrice: "৳৬,৯৯৯",
    image: courseAdmission,
    accent: "hsl(var(--foreground))",
  },
];

const comparisonPoints = [
  {
    ours: "কম খরচে প্রিমিয়াম প্রস্তুতি",
    others: "উচ্চ ফি, কম real outcome",
  },
  {
    ours: "Project-based এবং skill-first learning",
    others: "Theory-heavy শেখার ধরন",
  },
  {
    ours: "নিয়মিত updated প্রশ্ন ও exam flow",
    others: "Static syllabus ও পুরনো practice",
  },
  {
    ours: "Live challenge, streak, leaderboard motivation",
    others: "Competitive ecosystem নেই",
  },
  {
    ours: "Analytics-driven personalized improvement",
    others: "Weakness tracking প্রায় নেই",
  },
];

const impactCards = [
  {
    title: "Campus Workshop",
    text: "Live problem solving with mentor-led guidance.",
    tone: "from-[#141414] via-[#202020] to-[#111111]",
    height: "h-[26rem]",
  },
  {
    title: "Exam Simulation Room",
    text: "Real timer, pressure handling, and performance feedback.",
    tone: "from-[#1a0e0a] via-[#2a150d] to-[#130d0b]",
    height: "h-[22rem]",
  },
  {
    title: "Meet-Up Sessions",
    text: "Career discussions, peer networking, and mentor reviews.",
    tone: "from-[#10161f] via-[#1a2838] to-[#0f1824]",
    height: "h-[26rem]",
  },
  {
    title: "Community Wins",
    text: "Team-based growth with public milestones and recognitions.",
    tone: "from-[#0f1216] via-[#1b232d] to-[#0e1218]",
    height: "h-[22rem]",
  },
];

const faq = [
  {
    q: "আমি কি ফ্রি তে শুরু করতে পারি?",
    a: "হ্যাঁ। আপনি ফ্রি একাউন্ট দিয়ে প্রশ্ন প্র্যাকটিস এবং ডেমো পরীক্ষা শুরু করতে পারবেন।",
  },
  {
    q: "শিক্ষকদের জন্য কী কী থাকবে?",
    a: "প্রশ্ন তৈরি, পরীক্ষা সেট, ব্যাচ ম্যানেজমেন্ট, এবং পারফরম্যান্স ট্র্যাকিং থাকবে।",
  },
  {
    q: "রেজাল্ট এনালাইসিস কতটা ডিটেইলড?",
    a: "টপিকওয়াইজ accuracy, সময় ব্যবস্থাপনা, এবং progression trend রিপোর্ট পাবেন।",
  },
  {
    q: "মোবাইলে কি ভালোভাবে চলবে?",
    a: "হ্যাঁ, পুরো অভিজ্ঞতা মোবাইল-first responsive layout দিয়ে তৈরি।",
  },
];

const stats = [
  { label: "শিক্ষার্থী", value: 10000, suffix: "+" },
  { label: "প্রশ্ন", value: 50000, suffix: "+" },
  { label: "পরীক্ষা", value: 5000, suffix: "+" },
  { label: "সাফল্য", value: 98, suffix: "%" },
];

const reviewerNames = [
  "Md. Rahim Uddin",
  "Ayesha Akter",
  "Mohammad Karim Hossain",
  "Nusrat Jahan",
  "Md. Tanvir Ahmed",
  "Sumaiya Islam",
  "Mohammad Imran Hossain",
  "Tania Sultana",
  "Md. Mehedi Hasan",
  "Fatema Begum",
  "Mohammad Rashed Khan",
  "Priya Das",
  "Md. Shakib Al Hasan",
  "Sadia Afrin",
  "Mohammad Arif Hossain",
  "Jannat Ara",
  "Md. Faisal Ahmed",
  "Oishi Akter",
  "Mohammad Farhan Rahman",
];

const reviewerRoles = [
  "SSC Candidate",
  "HSC Candidate",
  "Admission Aspirant",
  "Web Development Learner",
  "Competitive Exam Student",
];

const reviewMessages = [
  "লাইভ ক্লাস আর প্র্যাকটিস সেটের কারণে আমার প্রস্তুতি অনেক দ্রুত হয়েছে।",
  "টপিকওয়াইজ প্রশ্ন আর মক পরীক্ষার flow একদম production-level মনে হয়েছে।",
  "স্ট্রিক সিস্টেম আর leaderboard আমাকে consistency maintain করতে সাহায্য করেছে।",
  "AI সাজেশন feature দিয়ে daily plan follow করা আমার জন্য অনেক সহজ হয়েছে।",
  "Exam countdown ও result analytics section আমার confidence বাড়িয়েছে।",
  "এক প্ল্যাটফর্মে প্রশ্ন, পরীক্ষা, রিপোর্ট - সব পাওয়ায় পড়াশোনা streamlined হয়েছে।",
];

const communityReviews = reviewerNames.map((name, index) => ({
  name,
  role: reviewerRoles[index % reviewerRoles.length],
  rating: Number((4.5 + ((index % 5) * 0.1)).toFixed(1)),
  text: reviewMessages[index % reviewMessages.length],
}));

const CountUp = ({ value, suffix }: { value: number; suffix: string }) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [current, setCurrent] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const start = performance.now();
    const duration = 1400;

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCurrent(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, value]);

  return (
    <span ref={ref}>
      {current.toLocaleString()}
      {suffix}
    </span>
  );
};

const SectionTag = ({ text }: { text: string }) => (
  <span className="inline-flex rounded-full border border-border/70 bg-card/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-sm">
    {text}
  </span>
);

const ReviewCard = ({ item }: { item: (typeof communityReviews)[number] }) => {
  const initials = item.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className="w-[21rem] shrink-0 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#160909,#0c0c0f)] p-5 text-white md:w-[26rem] md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5f3bd5] text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-base font-semibold leading-tight md:text-lg">{item.name}</p>
          <p className="text-sm text-white/60">{item.role}</p>
        </div>
      </div>

      <div className="my-4 h-px w-full bg-white/15" />

      <div className="flex items-center gap-2 text-sm text-white/75">
        <span className="font-semibold">{item.rating.toFixed(1)}</span>
        <div className="flex items-center gap-1 text-[#f7bc3d]">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-4 w-4 fill-current" />
          ))}
        </div>
      </div>

      <p className="mt-3 text-lg leading-[1.35] tracking-[-0.01em] text-white/90 md:text-xl">{item.text}</p>
    </article>
  );
};

const ReviewMarqueeRow = ({
  items,
  reverse,
  duration,
}: {
  items: (typeof communityReviews)[number][];
  reverse?: boolean;
  duration: number;
}) => {
  const loopItems = [...items, ...items];

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
      <motion.div
        className="flex w-max gap-5 will-change-transform md:gap-7"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
      >
        {loopItems.map((item, index) => (
          <ReviewCard key={`${item.name}-${index}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
};

const PartnerLogoMarqueeRow = ({ reverse, duration }: { reverse?: boolean; duration: number }) => {
  const loopLogos = [...partnerLogos, ...partnerLogos];

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <motion.div
        className="flex w-max items-center gap-8 will-change-transform md:gap-14"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
      >
        {loopLogos.map((logo, index) => (
          <div
            key={`${logo.name}-${index}`}
            className="flex h-16 min-w-[11rem] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 md:h-20 md:min-w-[14rem]"
          >
            <img
              src={logo.src}
              alt={logo.name}
              loading="lazy"
              decoding="async"
              className="h-8 w-auto max-w-[8.5rem] object-contain opacity-75 grayscale transition-opacity duration-300 hover:opacity-100 md:h-10 md:max-w-[10.5rem]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <span className="sr-only">{logo.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const Index = () => {
  const [mode, setMode] = useState<"student" | "teacher">("student");

  return (
    <div className="home-glass-vibe min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />

      <main className="pt-20">
        <section className="relative overflow-hidden pb-24 pt-16 md:pt-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_34%),radial-gradient(circle_at_top_right,hsl(var(--foreground)/0.06),transparent_28%)]" />
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <SectionTag text="LearnSmart Prep" />
              <h1 className="mt-6 text-4xl font-display font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl md:text-6xl">
                শিখুন, প্র্যাকটিস করুন, সফল হন -
                <span className="block text-foreground/90">সব এক প্ল্যাটফর্মে</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
                LearnSmart Prep আপনার complete academic workflow. প্রশ্ন ব্যাংক,
                অনলাইন পরীক্ষা, রেজাল্ট analytics, leaderboard, এবং teacher tools
                একই ecosystem এ।
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="glass" className="h-12 px-7 text-base font-semibold" asChild>
                  <Link to="/signup">
                    ফ্রি প্র্যাকটিস শুরু করুন <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="glass" className="h-12 px-7 text-base" asChild>
                  <a href="#preview">
                    ডেমো দেখুন <PlayCircle className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <motion.div
              id="preview"
              className="mx-auto mt-12 max-w-5xl rounded-3xl border border-white/10 bg-[#0b0b0f] p-4 shadow-[0_35px_90px_rgba(0,0,0,0.55)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, ease: "easeOut" }}
            >
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-white/10 bg-[#111115] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Dashboard Preview</p>
                  <h3 className="mt-2 text-2xl font-display font-black">Smart Performance Board</h3>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      ["Streak", "12 দিন"],
                      ["Accuracy", "91%"],
                      ["Rank", "#12"],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <p className="text-xs text-white/55">{k}</p>
                        <p className="mt-1 text-lg font-bold">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-36 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-3">
                    <div className="flex h-full items-end gap-2">
                      {[28, 44, 38, 66, 58, 74, 90].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-t-lg bg-gradient-to-t from-foreground/70 to-muted-foreground/65"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.05, delay: i * 0.06, ease: "easeOut" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-[#111115] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/55">AI সাজেশন</p>
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-white/80">
                      আজ ২০টি গণিত MCQ প্র্যাকটিস করুন।
                    </div>
                    <div className="mt-2 rounded-xl border border-border/70 bg-muted/35 p-3 text-sm text-foreground/80">
                      দুর্বল অধ্যায়: ত্রিকোণমিতি, রসায়ন সমীকরণ
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#111115] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/55">Exam Countdown</p>
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-2xl font-display font-black">02:45:18</p>
                    <p className="mt-1 text-xs text-white/55">Physics Weekly Mock শুরু হতে বাকি</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <SectionTag text="Features" />
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl">যা আপনাকে এগিয়ে রাখবে</h2>
              <p className="mx-auto mt-3 max-w-2xl text-white/65">আপনার web workflow ধরে রেখে practice থেকে analysis পর্যন্ত complete flow।</p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group rounded-2xl border border-white/10 bg-[#0d0d11] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/25"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.06, ease: "easeOut" }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/45 text-foreground/80">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-display font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/65">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="audience" className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <SectionTag text="Student + Teacher" />
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl">দুই role, এক seamless অভিজ্ঞতা</h2>
            </div>

            <div className="mx-auto mt-10 max-w-xl rounded-full border border-white/15 bg-[#0d0d11] p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setMode("student")}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md transition ${mode === "student" ? "border-white/20 bg-white/15 text-white" : "border-transparent text-white/70 hover:bg-white/8"}`}
                >
                  👨‍🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => setMode("teacher")}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md transition ${mode === "teacher" ? "border-white/20 bg-white/15 text-white" : "border-transparent text-white/70 hover:bg-white/8"}`}
                >
                  👨‍🏫 Teacher
                </button>
              </div>
            </div>

            <motion.div
              key={mode}
              className="mt-8 grid gap-5 lg:grid-cols-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-6">
                <h3 className="text-2xl font-display font-black">{mode === "student" ? "প্র্যাকটিস, পরীক্ষা, ট্র্যাক" : "তৈরি, ম্যানেজ, মনিটর"}</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/75">
                  {(mode === "student"
                    ? [
                        "টপিকভিত্তিক প্রশ্ন অনুশীলন",
                        "লাইভ/মক পরীক্ষা অংশগ্রহণ",
                        "স্কোর ও দুর্বলতার রিপোর্ট",
                      ]
                    : [
                        "প্রশ্ন ও পরীক্ষা তৈরি",
                        "ব্যাচ ভিত্তিক ম্যানেজমেন্ট",
                        "স্টুডেন্ট পারফরম্যান্স ট্র্যাকিং",
                      ]).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Quick metrics</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {(mode === "student"
                    ? [
                        ["Practice", "240"],
                        ["Accuracy", "91%"],
                        ["Rank", "#12"],
                      ]
                    : [
                        ["Questions", "1.8k"],
                        ["Students", "460"],
                        ["Exams", "180"],
                      ]).map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                      <p className="text-xs text-white/50">{k}</p>
                      <p className="mt-1 text-xl font-display font-black">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="courses" className="bg-[#ece7e2] py-20 text-[#111]">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <span className="inline-flex rounded-full border border-border/70 bg-card/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">Courses</span>
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl">Not sure কোন কোর্স নেবেন? We are here to help.</h2>
            </div>

            <div className="mt-10 space-y-8 [perspective:1400px]">
              {courses.map((course, index) => (
                <motion.article
                  key={course.title}
                  className="sticky top-20 overflow-hidden rounded-[1.75rem] border border-black/10 bg-white text-[#0f1115] shadow-[0_22px_60px_rgba(14,16,20,0.14)] md:top-24 md:p-6 dark:border-[#121212] dark:bg-[#050505] dark:text-white dark:shadow-[0_30px_90px_rgba(0,0,0,0.4)]"
                  initial={{ opacity: 0, y: 28, rotateX: 8, rotateY: index % 2 === 0 ? -9 : 9, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: index * 0.12 }}
                  whileHover={{ y: -4, rotateY: index % 2 === 0 ? 1.8 : -1.8 }}
                  style={{ transformStyle: "preserve-3d", zIndex: index + 1 }}
                >
                  <div className="grid items-stretch gap-6 lg:grid-cols-[1.02fr_1.18fr]">
                    <div>
                      <div className="h-full overflow-hidden rounded-2xl border border-black/10 bg-[radial-gradient(circle_at_top,rgba(240,90,40,0.12),transparent_55%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_45%)]">
                        <img
                          src={course.image}
                          alt={`${course.title} preview`}
                          loading="lazy"
                          className="h-full min-h-[15rem] w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div>
                        <h3 className="text-3xl font-display font-black leading-tight md:text-5xl">{course.title}</h3>
                        <p className="mt-4 max-w-2xl text-sm text-[#334155] md:text-base dark:text-white/70">{course.text}</p>

                        <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/35 p-3">
                            <Clock3 className="h-4 w-4 text-muted-foreground" />
                            <span>200+ Hours</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/35 p-3">
                            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                            <span>Yes Certified</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/35 p-3">
                            <Headset className="h-4 w-4 text-muted-foreground" />
                            <span>24/7 Support</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-sm text-[#475569] dark:text-white/60">Price</p>
                          <p className="text-4xl font-display font-black" style={{ color: course.accent }}>{course.price}</p>
                          <p className="text-sm text-[#64748b] line-through dark:text-white/45">{course.oldPrice}</p>
                        </div>

                        <Button variant="glass" className="h-11 rounded-xl px-6 text-base font-semibold">
                          Check Course <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#050505] py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full border border-border/70 bg-card/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Comparison
              </span>
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl md:text-5xl">
                LearnSmart কে আলাদা করে তোলে যেসব কারণে
              </h2>
            </div>

            <div className="mx-auto mt-12 grid max-w-6xl gap-5 rounded-3xl border border-white/10 bg-[#070707] p-4 md:grid-cols-2 md:p-6">
              <motion.div
                className="rounded-2xl border border-[#38d45f]/45 bg-[linear-gradient(180deg,#071108,#080909)] p-5"
                initial={{ opacity: 0, x: -26 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#38d45f]/40 bg-[#38d45f]/10">
                    <Target className="h-5 w-5 text-[#49de70]" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white">LearnSmart Prep</h3>
                </div>

                <div className="mt-6 space-y-3">
                  {comparisonPoints.map((point, index) => (
                    <motion.div
                      key={point.ours}
                      className="flex items-start gap-3 rounded-xl border border-[#38d45f]/25 bg-black/25 p-3"
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.6, delay: index * 0.06, ease: "easeOut" }}
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#4cdf73]" />
                      <p className="text-sm text-white/90 md:text-base">{point.ours}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)/0.92),hsl(var(--muted)/0.3))] p-5"
                initial={{ opacity: 0, x: 26 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-muted/35">
                    <Layers3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white">Others</h3>
                </div>

                <div className="mt-6 space-y-3">
                  {comparisonPoints.map((point, index) => (
                    <motion.div
                      key={point.others}
                      className="flex items-start gap-3 rounded-xl border border-border/70 bg-black/25 p-3"
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.6, delay: index * 0.06, ease: "easeOut" }}
                    >
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <p className="text-sm text-white/90 md:text-base">{point.others}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full border border-border/70 bg-card/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Impact
              </span>
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl md:text-5xl">
                দ্রুত এবং স্মার্টভাবে শেখার real experience
              </h2>
            </div>

            <div className="mt-12 [perspective:1100px]">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {impactCards.map((card, index) => (
                  <motion.article
                    key={card.title}
                    className={`group relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b ${card.tone} p-5 ${card.height}`}
                    initial={{ opacity: 0, y: 20, rotateY: index % 2 === 0 ? -8 : 8 }}
                    whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: index * 0.06, ease: "easeOut" }}
                    whileHover={{ y: -4, rotateX: 1.2, rotateY: index % 2 === 0 ? -2 : 2 }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />

                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div className="flex justify-end">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/70">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>

                      <div>
                        <p className="inline-flex rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-semibold text-foreground">
                          LearnSmart Event
                        </p>
                        <h3 className="mt-3 text-2xl font-display font-black leading-tight">{card.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-white/85">{card.text}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#050505] py-10 md:py-12">
          <div className="container mx-auto px-4">
            <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-white/35">Payment & Hiring Partners</p>
            <div className="space-y-5">
              <PartnerLogoMarqueeRow duration={56} />
              <PartnerLogoMarqueeRow reverse duration={62} />
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <SectionTag text="Trusted" />
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl">সংখ্যায় প্রমাণিত বিশ্বাস</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-[#0d0d11] p-6 text-center">
                  <p className="text-3xl font-display font-black text-foreground">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#030303] py-20 text-white md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <span className="inline-flex rounded-full border border-border/70 bg-card/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">Community</span>
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl">They came. They cooked. They got placed.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60 md:text-base">উপরের সারি ডান দিক থেকে বামে এবং নিচের সারি বাম দিক থেকে ডানে ক্রমাগত চলবে।</p>
            </div>

            <div className="mt-12 space-y-6">
              <ReviewMarqueeRow items={communityReviews} duration={94} />
              <ReviewMarqueeRow items={communityReviews.slice().reverse()} reverse duration={102} />
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <SectionTag text="Why LearnSmart" />
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl">What sets LearnSmart apart</h2>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-[#0d0d11] p-6">
                <h3 className="text-xl font-display font-bold text-foreground">যা পাবেন</h3>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {["AI study suggestions", "Mock exam workflow", "Topic-wise analytics", "Leaderboard + streak system", "Teacher management tools"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-6">
                <h3 className="text-xl font-display font-bold">প্রস্তুতির ফল</h3>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {["Consistency through streak", "Stronger exam confidence", "Faster revision cycles", "Role-based dashboards", "Better result visibility"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Star className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <SectionTag text="FAQ" />
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl">Frequently asked questions</h2>
            </div>
            <div className="mx-auto mt-10 max-w-4xl space-y-3">
              {faq.map((item) => (
                <details key={item.q} className="group rounded-xl border border-white/10 bg-[#0d0d11] p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                    {item.q}
                    <ChevronDown className="h-4 w-4 text-white/60 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-white/70">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-[linear-gradient(135deg,hsl(var(--card)/0.92),#0d0d11_55%,hsl(var(--muted)/0.45))] p-8 md:p-12">
              <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <SectionTag text="Final CTA" />
                  <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl md:text-5xl">
                    আজই আপনার প্রস্তুতি শুরু করুন
                  </h2>
                  <p className="mt-4 text-white/70">
                    আপনার সফলতার যাত্রা এখান থেকেই শুরু। এক প্ল্যাটফর্মে learning,
                    practice, exam, analytics - সবকিছু।
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button variant="glass" className="h-12 px-7 text-base font-semibold" asChild>
                      <Link to="/signup">
                        <Flame className="mr-2 h-4 w-4" /> ফ্রি প্র্যাকটিস শুরু করুন
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-12 border-white/20 bg-white/5 px-7 text-base text-white hover:bg-white/10" asChild>
                      <Link to="/signup?role=teacher">
                        শিক্ষক হিসেবে যোগ দিন <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Daily streak", "12 days"],
                    ["Live ranking", "#12"],
                    ["Exam timer", "02:45:18"],
                    ["Success rate", "98%"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs text-white/55">{k}</p>
                      <p className="mt-1 text-lg font-display font-black">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default Index;
