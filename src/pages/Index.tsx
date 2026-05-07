import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
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
    id: 1,
    title: "জব রেডি AI Powered Complete Web Development + DSA",
    shortDesc: "Beginner থেকে advanced পর্যন্ত guided roadmap with live projects.",
    text: "Beginner থেকে advanced পর্যন্ত guided roadmap with real-world projects এবং live mentorship।",
    price: "৳৫,৯৯৯",
    oldPrice: "৳১১,৯৯৮",
    image: courseSSC,
    accent: "#3b82f6",
    level: "Beginner to Advanced",
    duration: "6 months",
    students: "৪.৫k+ students",
    rating: 4.8,
    modules: 24,
    projects: 8,
    stats: [
      { label: "সম্পন্ন করেছেন", value: "২৮৫০+" },
      { label: "গড় রেটিং", value: "৪.৮/৫" },
      { label: "জব প্লেসমেন্ট", value: "৮৫%" },
    ],
    features: [
      "HTML, CSS, JavaScript - Foundation থেকে Advanced",
      "React.js - Hooks, Context, Performance",
      "Node.js + Express - RESTful APIs",
      "MongoDB - Database Design & Optimization",
      "DSA - 100+ Problem Solutions",
      "Git & Deployment - AWS, Vercel",
      "8 Real-World Projects",
      "Live Code Reviews & Mentorship",
      "Career Guidance & Resume Building",
    ],
  },
  {
    id: 2,
    title: "Data Science & Analytics with Gen AI",
    shortDesc: "Project-based learning with live mentor support এবং real dataset.",
    text: "Python, ML, AI এর সাথে real business projects এবং industry expert mentorship।",
    price: "৳৬,৯৯৯",
    oldPrice: "৳१२,४९৯",
    image: courseHSC,
    accent: "#f59e0b",
    level: "Intermediate to Advanced",
    duration: "5 months",
    students: "২.৮k+ students",
    rating: 4.9,
    modules: 20,
    projects: 6,
    stats: [
      { label: "সম্পন্ন করেছেন", value: "১৯৫০+" },
      { label: "গড় রেটিং", value: "৪.৯/৫" },
      { label: "ক্যারিয়ার শিফট", value: "৭২%" },
    ],
    features: [
      "Python প্রোগ্রামিং - Pandas, NumPy, Scikit-learn",
      "Machine Learning - Supervised & Unsupervised",
      "Deep Learning - TensorFlow & PyTorch",
      "Generative AI - Prompt Engineering & LLMs",
      "Data Visualization - Tableau & Power BI",
      "Big Data Processing - Spark",
      "6 Industry Projects",
      "Portfolio Building",
      "Live Kaggle Competitions",
    ],
  },
  {
    id: 3,
    title: "এসএমএমসি এবং এইচএমসি পরীক্ষার প্রস্তুতি প্যাকেজ",
    shortDesc: "সম্পূর্ণ প্র্যাকটিস ফ্লো সহ পরীক্ষা প্রস্তুতি।",
    text: "SSC এবং HSC এর জন্য complete practice workflow with analytics এবং personalized guidance।",
    price: "৳৩,৪৯৯",
    oldPrice: "৳৬,৯৯৯",
    image: courseAdmission,
    accent: "#ef4444",
    level: "SSC/HSC দ্বাদশ",
    duration: "3-6 months",
    students: "৫.২k+ students",
    rating: 4.7,
    modules: 45,
    projects: 0,
    stats: [
      { label: "সাকসেস রেট", value: "৯২%" },
      { label: "গড় স্কোর বৃদ্ধি", value: "২২ পয়েন্ট" },
      { label: "সক্রিয় শিক্ষার্থী", value: "৫.২k+" },
    ],
    features: [
      "সকল বিষয় - বাংলা, ইংরেজি, গণিত, বিজ্ঞান",
      "সম্পূর্ণ সিলেবাস কভারেজ",
      "১০,০০০+ প্র্যাকটিস প্রশ্ন",
      "মাসিক মডেল পরীক্ষা",
      "বিস্তারিত সমাধান ভিডিও",
      "টপিক-ওয়াইজ দুর্বলতা বিশ্লেষণ",
      "পার্সোনালাইজড স্টাডি প্ল্যান",
      "দ্রুত সংশোধন গাইড",
    ],
  },
  {
    id: 4,
    title: "Cloud DevOps & Kubernetes Mastery",
    shortDesc: "AWS, Docker, Kubernetes এবং CI/CD pipeline মাস্টারি।",
    text: "DevOps এর সম্পূর্ণ ইকোসিস্টেম - cloud deployment থেকে automated pipelines পর্যন্ত।",
    price: "৳৫,৪৯৯",
    oldPrice: "৳১০,৯৯৯",
    image: courseSSC,
    accent: "#10b981",
    level: "Intermediate to Advanced",
    duration: "4 months",
    students: "১.৯k+ students",
    rating: 4.6,
    modules: 18,
    projects: 5,
    stats: [
      { label: "সম্পন্ন করেছেন", value: "১,২০০+" },
      { label: "গড় রেটিং", value: "৪.৬/৫" },
      { label: "ক্লাউড সার্টিফিকেশন", value: "৬৮%" },
    ],
    features: [
      "AWS মাস্টারি - EC2, S3, RDS, Lambda",
      "Docker - Containerization ও ইমেজ অপটিমাইজেশন",
      "Kubernetes - Orchestration ও স্কেলিং",
      "CI/CD পাইপলাইন - Jenkins, GitLab CI",
      "Infrastructure as Code - Terraform",
      "মনিটরিং ও লগিং - Prometheus, ELK",
      "5 Production Projects",
      "AWS Solution Architect প্রস্তুতি",
    ],
  },
  {
    id: 5,
    title: "মোবাইল অ্যাপ ডেভেলপমেন্ট - React Native & Flutter",
    shortDesc: "iOS এবং Android উভয় প্ল্যাটফর্মে নেটিভ অ্যাপ তৈরি।",
    text: "Cross-platform মোবাইল ডেভেলপমেন্ট সম্পূর্ণ বাস্তব প্রকল্প সহ।",
    price: "৳৫,৭৯৯",
    oldPrice: "৳११,৫৯৮",
    image: courseHSC,
    accent: "#8b5cf6",
    level: "Intermediate to Advanced",
    duration: "5 months",
    students: "২.১k+ students",
    rating: 4.7,
    modules: 22,
    projects: 7,
    stats: [
      { label: "সম্পন্ন করেছেন", value: "১,৫৫০+" },
      { label: "গড় রেটিং", value: "৪.७/५" },
      { label: "অ্যাপ প্রকাশিত", value: "৮৪%" },
    ],
    features: [
      "React Native - JavaScript থেকে Native",
      "Flutter - Dart প্রোগ্রামিং",
      "UI/UX ডিজাইন নীতিমালা",
      "Native APIs - ক্যামেরা, লোকেশন, সেন্সর",
      "Firebase ইন্টিগ্রেশন",
      "App Store & Google Play ডিপ্লয়মেন্ট",
      "7 Real-World Apps",
      "Monetization কৌশল",
      "App Performance অপটিমাইজেশন",
    ],
  },
  {
    id: 6,
    title: "সিস্টেম ডিজাইন এবং মাইক্রোসার্ভিসেস আর্কিটেকচার",
    shortDesc: "স্কেলেবল, হাই-পারফরম্যান্স সিস্টেম ডিজাইন করুন।",
    text: "Large-scale সিস্টেম ডিজাইনের নীতিমালা এবং ব্যবহারিক ইমপ্লিমেন্টেশন।",
    price: "৳৬,৯৯৯",
    oldPrice: "৳१३,৯९८",
    image: courseAdmission,
    accent: "#ec4899",
    level: "Advanced",
    duration: "5 months",
    students: "১.৪k+ students",
    rating: 4.9,
    modules: 20,
    projects: 4,
    stats: [
      { label: "সম্পন্ন করেছেন", value: "८००+" },
      { label: "গড় রেটিং", value: "४.९/५" },
      { label: "FAANG প্রস্তুত", value: "79%" },
    ],
    features: [
      "স্কেলেবিলিটি - Horizontal & Vertical",
      "ডাটাবেজ ডিজাইন - SQL, NoSQL, Caching",
      "মাইক্রোসার্ভিসেস আর্কিটেকচার",
      "API ডিজাইন - REST, GraphQL, gRPC",
      "মেসেজিং সিস্টেম - Kafka, RabbitMQ",
      "লোড ব্যালান্সিং এবং ডিস্ট্রিবিউটেড সিস্টেম",
      "4 System Design Case Studies",
      "FAANG ইন্টারভিউ প্রস্তুতি",
      "লাইভ আর্কিটেকচার রিভিউ সেশন",
    ],
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

const SectionTag = ({ text }: { text: string }) => {
  const { theme } = useTheme();
  return (
    <span className={`inline-flex rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm transition-colors duration-300 ${
      theme === "dark"
        ? "border-border/70 bg-card/70 text-muted-foreground"
        : "border-black/20 bg-black/10 text-black/70"
    }`}>
      {text}
    </span>
  );
};

const ReviewCard = ({ item }: { item: (typeof communityReviews)[number] }) => {
  const { theme } = useTheme();
  const initials = item.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className={`w-[21rem] shrink-0 rounded-2xl border p-5 md:w-[26rem] md:p-6 transition-colors duration-300 ${
      theme === "dark"
        ? "border-white/10 bg-[linear-gradient(180deg,#160909,#0c0c0f)] text-white"
        : "border-black/10 bg-white text-black"
    }`}>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5f3bd5] text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-base font-semibold leading-tight md:text-lg">{item.name}</p>
          <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-black/60"}`}>{item.role}</p>
        </div>
      </div>

      <div className={`my-4 h-px w-full ${theme === "dark" ? "bg-white/15" : "bg-black/15"}`} />

      <div className={`flex items-center gap-2 text-sm ${theme === "dark" ? "text-white/75" : "text-black/75"}`}>
        <span className="font-semibold">{item.rating.toFixed(1)}</span>
        <div className="flex items-center gap-1 text-[#f7bc3d]">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-4 w-4 fill-current" />
          ))}
        </div>
      </div>

      <p className={`mt-3 text-lg leading-[1.35] tracking-[-0.01em] md:text-xl ${
        theme === "dark" ? "text-white/90" : "text-black/90"
      }`}>{item.text}</p>
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
  const { theme } = useTheme();
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
            className={`flex h-16 min-w-[11rem] items-center justify-center rounded-xl border px-6 py-3 md:h-20 md:min-w-[14rem] transition-colors duration-300 ${
              theme === "dark"
                ? "border-white/10 bg-white/[0.02]"
                : "border-black/10 bg-black/5"
            }`}
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

const CourseDetailModal = ({ course, onClose }: { course: typeof courses[0] | null; onClose: () => void }) => {
  if (!course) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/15 bg-gradient-to-br from-[#0f0f13] via-[#0a0a0f] to-[#050507] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
        >
          <span className="text-lg font-semibold text-white/80">✕</span>
        </button>

        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          {/* Left: Course Image Section */}
          <div className="space-y-4">
            <div
              className="relative h-72 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br"
              style={{
                backgroundImage: `linear-gradient(135deg, ${course.accent}20 0%, ${course.accent}05 100%)`,
              }}
            >
              <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
              {/* Level Badge */}
              <div
                className="absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md border"
                style={{
                  backgroundColor: `${course.accent}30`,
                  borderColor: `${course.accent}60`,
                  color: course.accent,
                }}
              >
                {course.level}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {course.stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm"
                >
                  <p className="text-xs text-white/60">{stat.label}</p>
                  <p className="mt-1.5 text-sm font-display font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Course Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl border px-4 py-3 backdrop-blur-sm"
                style={{
                  borderColor: `${course.accent}40`,
                  backgroundColor: `${course.accent}10`,
                }}
              >
                <p className="text-xs text-white/60">📚 Modules</p>
                <p className="mt-1 text-xl font-display font-bold" style={{ color: course.accent }}>
                  {course.modules}
                </p>
              </div>
              <div
                className="rounded-xl border px-4 py-3 backdrop-blur-sm"
                style={{
                  borderColor: `${course.accent}40`,
                  backgroundColor: `${course.accent}10`,
                }}
              >
                <p className="text-xs text-white/60">🎯 Projects</p>
                <p className="mt-1 text-xl font-display font-bold" style={{ color: course.accent }}>
                  {course.projects}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Content Section */}
          <div className="flex flex-col justify-between space-y-6">
            {/* Title and Description */}
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-white leading-tight">{course.title}</h2>
              <p className="mt-3 text-sm text-white/75 leading-relaxed">{course.text}</p>

              {/* Star Rating and Duration */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4"
                        fill={i < Math.floor(course.rating) ? course.accent : "none"}
                        stroke={course.accent}
                        strokeWidth={i < Math.floor(course.rating) ? 0 : 1.5}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-white">{course.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock3 className="h-4 w-4" />
                  {course.duration}
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div>
              <h4 className="text-sm font-display font-bold text-white mb-3">✨ কোর্স বৈশিষ্ট্যসমূহ</h4>
              <ul className="space-y-2">
                {course.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-white/80">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: course.accent }}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-white/10 via-white/20 to-white/10" />

            {/* Price and CTA */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-white/60">বিশেষ মূল্য</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-display font-black" style={{ color: course.accent }}>
                    {course.price}
                  </p>
                  <p className="text-sm text-white/40 line-through">{course.oldPrice}</p>
                </div>
              </div>
              <Button
                className="h-12 rounded-xl px-8 text-base font-semibold text-white transition-all duration-200 hover:shadow-lg"
                style={{ backgroundColor: course.accent }}
              >
                এখনই কোর্স নিন
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Index = () => {
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${
      theme === "dark" ? "home-glass-vibe bg-background text-foreground" : "bg-[#f5f5f7] text-black"
    }`}>
      <Navbar />

      <main className="pt-20">
        <section className="relative overflow-hidden pb-24 pt-16 md:pt-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_34%),radial-gradient(circle_at_top_right,hsl(var(--foreground)/0.06),transparent_28%)]" />
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <SectionTag text="ExamPathshala" />
              <h1 className="mt-6 text-4xl font-display font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl md:text-6xl">
                শিখুন, প্র্যাকটিস করুন, সফল হন -
                <span className={`block ${theme === "dark" ? "text-foreground/90" : "text-black/90"}`}>সব এক প্ল্যাটফর্মে</span>
              </h1>
              <p className={`mx-auto mt-6 max-w-2xl text-base leading-8 md:text-lg ${
                theme === "dark" ? "text-white/70" : "text-black/70"
              }`}>
                ExamPathshala আপনার complete academic workflow. প্রশ্ন ব্যাংক,
                অনলাইন পরীক্ষা, রেজাল্ট analytics, leaderboard, এবং teacher tools
                একই ecosystem এ।
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  variant="glass"
                  className={`h-12 px-7 text-base font-semibold ${
                    theme === "dark"
                      ? "border-white/25 bg-white/12 text-foreground hover:bg-white/20"
                      : "border-black/15 bg-black/5 text-black hover:bg-black/10"
                  }`}
                  asChild
                >
                  <Link to="/signup">
                    ফ্রি প্র্যাকটিস শুরু করুন <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="glass"
                  className={`h-12 px-7 text-base ${
                    theme === "dark"
                      ? "border-white/25 bg-white/12 text-foreground hover:bg-white/20"
                      : "border-black/15 bg-black/5 text-black hover:bg-black/10"
                  }`}
                  asChild
                >
                  <a href="#preview">
                    ডেমো দেখুন <PlayCircle className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <motion.div
              id="preview"
              className={`mx-auto mt-12 max-w-5xl rounded-3xl border p-4 shadow-[0_35px_90px_rgba(0,0,0,0.55)] transition-colors duration-300 ${
                theme === "dark"
                  ? "border-white/10 bg-[#0b0b0f]"
                  : "border-black/10 bg-white"
              }`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
            >
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className={`rounded-2xl border p-4 transition-colors duration-300 ${
                  theme === "dark"
                    ? "border-white/10 bg-[#111115]"
                    : "border-black/10 bg-white/50"
                }`}>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Dashboard Preview</p>
                  <h3 className="mt-2 text-2xl font-display font-black">Smart Performance Board</h3>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      ["Streak", "12 দিন"],
                      ["Accuracy", "91%"],
                      ["Rank", "#12"],
                    ].map(([k, v]) => (
                      <div key={k} className={`rounded-xl border p-3 transition-colors duration-300 ${
                        theme === "dark"
                          ? "border-white/10 bg-black/30"
                          : "border-black/10 bg-black/5"
                      }`}>
                        <p className="text-xs text-white/55">{k}</p>
                        <p className="mt-1 text-lg font-bold">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-4 h-36 rounded-xl border p-3 transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]"
                      : "border-black/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.01))]"
                  }`}>
                    <div className="flex h-full items-end gap-2">
                      {[28, 44, 38, 66, 58, 74, 90].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-t-lg bg-gradient-to-t from-foreground/70 to-muted-foreground/65"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 1.2, delay: i * 0.08, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className={`rounded-2xl border p-4 transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-white/10 bg-[#111115]"
                      : "border-black/10 bg-white/50"
                  }`}>
                    <p className={`text-xs uppercase tracking-[0.22em] ${
                      theme === "dark" ? "text-white/55" : "text-black/55"
                    }`}>AI সাজেশন</p>
                    <div className={`mt-3 rounded-xl border p-3 text-sm transition-colors duration-300 ${
                      theme === "dark"
                        ? "border-white/10 bg-black/35 text-white/80"
                        : "border-black/10 bg-black/5 text-black/80"
                    }`}>
                      আজ ২০টি গণিত MCQ প্র্যাকটিস করুন।
                    </div>
                    <div className={`mt-2 rounded-xl border p-3 text-sm transition-colors duration-300 ${
                      theme === "dark"
                        ? "border-border/70 bg-muted/35 text-foreground/80"
                        : "border-black/20 bg-black/5 text-black/80"
                    }`}>
                      দুর্বল অধ্যায়: ত্রিকোণমিতি, রসায়ন সমীকরণ
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-4 transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-white/10 bg-[#111115]"
                      : "border-black/10 bg-white/50"
                  }`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs uppercase tracking-[0.22em] ${
                        theme === "dark" ? "text-white/55" : "text-black/55"
                      }`}>Exam Countdown</p>
                      <CalendarClock className={`h-4 w-4 ${
                        theme === "dark" ? "text-muted-foreground" : "text-black/40"
                      }`} />
                    </div>
                    <p className="mt-2 text-2xl font-display font-black">02:45:18</p>
                    <p className={`mt-1 text-xs ${
                      theme === "dark" ? "text-white/55" : "text-black/55"
                    }`}>Physics Weekly Mock শুরু হতে বাকি</p>
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
              <p className={`mx-auto mt-3 max-w-2xl ${
                theme === "dark" ? "text-white/65" : "text-black/65"
              }`}>আপনার web workflow ধরে রেখে practice থেকে analysis পর্যন্ত complete flow।</p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={`group rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-2 ${
                    theme === "dark"
                      ? "border-white/10 bg-[#0d0d11] hover:border-white/25"
                      : "border-black/10 bg-white/50 hover:border-black/25"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.85, delay: index * 0.1, ease: "easeInOut" }}
                  whileHover={{ transition: { duration: 0.3 } }}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 ${
                    theme === "dark"
                      ? "bg-muted/45 text-foreground/80"
                      : "bg-black/10 text-black/80"
                  }`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-display font-bold">{feature.title}</h3>
                  <p className={`mt-2 text-sm leading-7 ${
                    theme === "dark" ? "text-white/65" : "text-black/65"
                  }`}>{feature.description}</p>
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

            <div className={`mx-auto mt-10 max-w-xl rounded-full border p-1 transition-colors duration-300 ${
              theme === "dark"
                ? "border-white/15 bg-[#0d0d11]"
                : "border-black/15 bg-white/50"
            }`}>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setMode("student")}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md transition ${
                    mode === "student"
                      ? theme === "dark"
                        ? "border-white/20 bg-white/15 text-white"
                        : "border-black/20 bg-black/15 text-black"
                      : theme === "dark"
                      ? "border-transparent text-white/70 hover:bg-white/8"
                      : "border-transparent text-black/70 hover:bg-black/8"
                  }`}
                >
                  👨‍🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => setMode("teacher")}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md transition ${
                    mode === "teacher"
                      ? theme === "dark"
                        ? "border-white/20 bg-white/15 text-white"
                        : "border-black/20 bg-black/15 text-black"
                      : theme === "dark"
                      ? "border-transparent text-white/70 hover:bg-white/8"
                      : "border-transparent text-black/70 hover:bg-black/8"
                  }`}
                >
                  👨‍🏫 Teacher
                </button>
              </div>
            </div>

            <motion.div
              key={mode}
              className="mt-8 grid gap-5 lg:grid-cols-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: "easeInOut" }}
            >
              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                theme === "dark"
                  ? "border-white/10 bg-[#0d0d11]"
                  : "border-black/10 bg-white/50"
              }`}>
                <h3 className="text-2xl font-display font-black">{mode === "student" ? "প্র্যাকটিস, পরীক্ষা, ট্র্যাক" : "তৈরি, ম্যানেজ, মনিটর"}</h3>
                <ul className={`mt-4 space-y-3 text-sm ${
                  theme === "dark" ? "text-white/75" : "text-black/75"
                }`}>
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
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 ${
                        theme === "dark" ? "text-muted-foreground" : "text-black/40"
                      }`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                theme === "dark"
                  ? "border-white/10 bg-[#0d0d11]"
                  : "border-black/10 bg-white/50"
              }`}>
                <p className={`text-xs uppercase tracking-[0.2em] ${
                  theme === "dark" ? "text-white/45" : "text-black/45"
                }`}>Quick metrics</p>
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
                    <div key={k} className={`rounded-xl border p-3 text-center transition-colors duration-300 ${
                      theme === "dark"
                        ? "border-white/10 bg-black/30"
                        : "border-black/10 bg-black/5"
                    }`}>
                      <p className={`text-xs ${
                        theme === "dark" ? "text-white/50" : "text-black/50"
                      }`}>{k}</p>
                      <p className="mt-1 text-xl font-display font-black">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="courses" className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <span className="inline-flex rounded-full border border-border/70 bg-card/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Premium Courses
              </span>
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl md:text-5xl">বিশেষভাবে ডিজাইন করা কোর্স</h2>
              <p className={`mx-auto mt-3 max-w-2xl ${
                theme === "dark" ? "text-white/65" : "text-black/65"
              }`}>আপনার ক্যারিয়ারের লক্ষ্য অর্জনের জন্য বিশেষজ্ঞ-তৈরি কোর্স প্রোগ্রাম।</p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 3).map((course, index) => (
                <motion.div
                  key={course.id}
                  className={`group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 ${
                    theme === "dark"
                      ? "border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent hover:border-white/30 hover:from-white/[0.12] hover:via-white/[0.06]"
                      : "border-black/10 bg-gradient-to-br from-black/[0.05] via-black/[0.02] to-transparent hover:border-black/30 hover:from-black/[0.08] hover:via-black/[0.04]"
                  }`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.8, delay: index * 0.12, ease: "easeInOut" }}
                  whileHover={{ y: -12, boxShadow: "0 25px 50px rgba(0,0,0,0.35)", transition: { duration: 0.4 } }}
                >
                  {/* Gradient accent corner */}
                  <div
                    className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl opacity-20 transition-opacity duration-300 group-hover:opacity-40"
                    style={{ backgroundColor: course.accent }}
                  />

                  {/* Course Image */}
                  <div className={`relative mb-5 h-48 overflow-hidden rounded-xl border bg-gradient-to-br from-white/5 to-transparent transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-white/10"
                      : "border-black/10"
                  }`}>
                    <img
                      src={course.image}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Level Badge */}
                    <div
                      className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white backdrop-blur-md border"
                      style={{
                        backgroundColor: `${course.accent}20`,
                        borderColor: `${course.accent}50`,
                        color: course.accent,
                      }}
                    >
                      {course.level}
                    </div>
                  </div>

                  <div className="relative z-10 space-y-3">
                    {/* Title and Description */}
                    <div>
                      <h3 className={`line-clamp-2 text-base font-display font-bold leading-tight ${
                        theme === "dark" ? "text-white" : "text-black"
                      }`}>{course.title}</h3>
                      <p className={`mt-2 line-clamp-2 text-xs ${
                        theme === "dark" ? "text-white/65" : "text-black/65"
                      }`}>{course.shortDesc}</p>
                    </div>

                    {/* Duration and Students */}
                    <div className={`flex items-center gap-3 text-xs ${
                      theme === "dark" ? "text-white/70" : "text-black/70"
                    }`}>
                      <div className="flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{course.duration}</span>
                      </div>
                      <span className="text-white/30">•</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{course.students}</span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5"
                            fill={i < Math.floor(course.rating) ? course.accent : "none"}
                            stroke={course.accent}
                            strokeWidth={i < Math.floor(course.rating) ? 0 : 2}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                        {course.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 py-3">
                      {course.stats.slice(0, 3).map((stat, idx) => (
                        <div key={idx} className={`rounded-lg border p-2 text-center transition-colors duration-300 ${
                          theme === "dark"
                            ? "border-white/10 bg-white/5"
                            : "border-black/10 bg-black/5"
                        }`}>
                          <p className={`text-[10px] ${
                            theme === "dark" ? "text-white/50" : "text-black/50"
                          }`}>{stat.label}</p>
                          <p className={`mt-0.5 text-xs font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className={`h-px bg-gradient-to-r transition-colors duration-300 ${
                      theme === "dark"
                        ? "from-white/10 via-white/20 to-white/10"
                        : "from-black/10 via-black/20 to-black/10"
                    }`} />

                    {/* Footer: Price and Button */}
                    <div className="flex items-center justify-between gap-3 pt-3">
                      <div>
                        <p className={`text-xs ${
                          theme === "dark" ? "text-white/50" : "text-black/50"
                        }`}>মূল্য</p>
                        <div className="mt-0.5 flex items-baseline gap-2">
                          <p className="text-lg font-display font-black" style={{ color: course.accent }}>
                            {course.price}
                          </p>
                          <p className={`text-xs line-through ${theme === "dark" ? "text-white/35" : "text-black/35"}`}>
                            {course.oldPrice}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 border"
                        style={{
                          backgroundColor: `${course.accent}20`,
                          borderColor: course.accent,
                          color: course.accent,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = course.accent;
                          e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = `${course.accent}20`;
                          e.currentTarget.style.color = course.accent;
                        }}
                      >
                        <span>বিস্তারিত</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link to="/courses">
                <Button className="h-12 px-8 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  সমস্ত কোর্স দেখুন <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {selectedCourse && <CourseDetailModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />}
        </AnimatePresence>

        <section className={`border-y py-20 md:py-24 transition-colors duration-300 ${
          theme === "dark"
            ? "border-white/10 bg-[#050505]"
            : "border-black/10 bg-white"
        }`}>
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full border border-border/70 bg-card/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Comparison
              </span>
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl md:text-5xl">
                ExamPathshala কে আলাদা করে তোলে যেসব কারণে
              </h2>
            </div>

            <div className={`mx-auto mt-12 grid max-w-6xl gap-5 rounded-3xl border p-4 md:grid-cols-2 md:p-6 transition-colors duration-300 ${
              theme === "dark"
                ? "border-white/10 bg-[#070707]"
                : "border-black/10 bg-white/50"
            }`}>
              <motion.div
                className={`rounded-2xl border p-5 transition-colors duration-300 ${
                  theme === "dark"
                    ? "border-[#38d45f]/45 bg-[linear-gradient(180deg,#071108,#080909)]"
                    : "border-[#38d45f]/30 bg-[linear-gradient(180deg,rgba(56,212,95,0.08),rgba(8,9,9,0.05))]"
                }`}
                initial={{ opacity: 0, x: -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.95, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#38d45f]/40 bg-[#38d45f]/10">
                    <Target className="h-5 w-5 text-[#49de70]" />
                  </div>
                  <h3 className={`text-2xl font-display font-bold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}>ExamPathshala</h3>
                </div>

                <div className="mt-6 space-y-3">
                  {comparisonPoints.map((point, index) => (
                    <motion.div
                      key={point.ours}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors duration-300 ${
                        theme === "dark"
                          ? "border-[#38d45f]/25 bg-black/25"
                          : "border-[#38d45f]/20 bg-[#38d45f]/10"
                      }`}
                      initial={{ opacity: 0, y: 18, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.75, delay: index * 0.09, ease: "easeInOut" }}
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#4cdf73]" />
                      <p className={`text-sm md:text-base ${
                        theme === "dark" ? "text-white/90" : "text-black/90"
                      }`}>{point.ours}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className={`rounded-2xl border p-5 transition-colors duration-300 ${
                  theme === "dark"
                    ? "border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)/0.92),hsl(var(--muted)/0.3))]"
                    : "border-black/20 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.03))]"
                }`}
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.95, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-border/70 bg-muted/35"
                      : "border-black/20 bg-black/5"
                  }`}>
                    <Layers3 className={`h-5 w-5 ${
                      theme === "dark" ? "text-muted-foreground" : "text-black/40"
                    }`} />
                  </div>
                  <h3 className={`text-2xl font-display font-bold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}>Others</h3>
                </div>

                <div className="mt-6 space-y-3">
                  {comparisonPoints.map((point, index) => (
                    <motion.div
                      key={point.others}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors duration-300 ${
                        theme === "dark"
                          ? "border-border/70 bg-black/25"
                          : "border-black/20 bg-white/50"
                      }`}
                      initial={{ opacity: 0, y: 18, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.75, delay: index * 0.09, ease: "easeInOut" }}
                    >
                      <XCircle className={`mt-0.5 h-5 w-5 shrink-0 ${
                        theme === "dark" ? "text-muted-foreground" : "text-black/40"
                      }`} />
                      <p className={`text-sm md:text-base ${
                        theme === "dark" ? "text-white/90" : "text-black/90"
                      }`}>{point.others}</p>
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
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b p-5 ${card.height} transition-colors duration-300 ${
                      theme === "dark"
                        ? "border-white/15"
                        : "border-black/15"
                    } ${card.tone}`}
                    initial={{ opacity: 0, y: 28, rotateY: index % 2 === 0 ? -10 : 10 }}
                    whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.95, delay: index * 0.1, ease: "easeInOut" }}
                    whileHover={{ y: -6, rotateX: 2, rotateY: index % 2 === 0 ? -3 : 3, transition: { duration: 0.4 } }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />

                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div className="flex justify-end">
                        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 ${
                          theme === "dark"
                            ? "bg-black/70"
                            : "bg-black/20"
                        }`}>
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>

                      <div>
                        <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-300 ${
                          theme === "dark"
                            ? "border-border/70 bg-card/80 text-foreground"
                            : "border-black/20 bg-black/10 text-black"
                        }`}>
                          ExamPathshala Event
                        </p>
                        <h3 className="mt-3 text-2xl font-display font-black leading-tight">{card.title}</h3>
                        <p className={`mt-2 text-sm leading-7 ${
                          theme === "dark" ? "text-white/85" : "text-black/85"
                        }`}>{card.text}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={`border-y py-10 md:py-12 transition-colors duration-300 ${
          theme === "dark"
            ? "border-white/10 bg-[#050505]"
            : "border-black/10 bg-white"
        }`}>
          <div className="container mx-auto px-4">
            <p className={`mb-6 text-center text-xs uppercase tracking-[0.3em] ${
              theme === "dark" ? "text-white/35" : "text-black/35"
            }`}>Payment & Hiring Partners</p>
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
                <div key={stat.label} className={`rounded-2xl border p-6 text-center transition-colors duration-300 ${
                  theme === "dark"
                    ? "border-white/10 bg-[#0d0d11]"
                    : "border-black/10 bg-white/50"
                }`}>
                  <p className={`text-3xl font-display font-black ${
                    theme === "dark" ? "text-foreground" : "text-black"
                  }`}>
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className={`mt-2 text-sm ${
                    theme === "dark" ? "text-white/70" : "text-black/70"
                  }`}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`overflow-hidden py-20 md:py-24 transition-colors duration-300 ${
          theme === "dark"
            ? "bg-[#030303] text-white"
            : "bg-[#f5f5f7] text-black"
        }`}>
          <div className="container mx-auto px-4">
            <div className="text-center">
              <span className={`inline-flex rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                theme === "dark"
                  ? "border-border/70 bg-card/80 text-foreground"
                  : "border-black/20 bg-black/10 text-black"
              }`}>Community</span>
              <h2 className={`mt-4 text-3xl font-display font-black sm:text-4xl ${
                theme === "dark" ? "text-white" : "text-black"
              }`}>They came. They cooked. They got placed.</h2>
              <p className={`mx-auto mt-3 max-w-2xl text-sm md:text-base ${
                theme === "dark" ? "text-white/60" : "text-black/60"
              }`}>উপরের সারি ডান দিক থেকে বামে এবং নিচের সারি বাম দিক থেকে ডানে ক্রমাগত চলবে।</p>
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
              <SectionTag text="Why ExamPathshala" />
              <h2 className="mt-4 text-3xl font-display font-black sm:text-4xl">What sets ExamPathshala apart</h2>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                theme === "dark"
                  ? "border-border/70 bg-[#0d0d11]"
                  : "border-black/20 bg-white/50"
              }`}>
                <h3 className="text-xl font-display font-bold text-foreground">যা পাবেন</h3>
                <ul className={`mt-4 space-y-2 text-sm ${
                  theme === "dark" ? "text-white/75" : "text-black/75"
                }`}>
                  {["AI study suggestions", "Mock exam workflow", "Topic-wise analytics", "Leaderboard + streak system", "Teacher management tools"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 ${
                        theme === "dark" ? "text-muted-foreground" : "text-black/40"
                      }`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                theme === "dark"
                  ? "border-white/10 bg-[#0d0d11]"
                  : "border-black/10 bg-white/50"
              }`}>
                <h3 className="text-xl font-display font-bold">প্রস্তুতির ফল</h3>
                <ul className={`mt-4 space-y-2 text-sm ${
                  theme === "dark" ? "text-white/75" : "text-black/75"
                }`}>
                  {["Consistency through streak", "Stronger exam confidence", "Faster revision cycles", "Role-based dashboards", "Better result visibility"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Star className={`mt-0.5 h-4 w-4 ${
                        theme === "dark" ? "text-muted-foreground" : "text-black/40"
                      }`} />
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
                <details key={item.q} className={`group rounded-xl border p-4 transition-colors duration-300 ${
                  theme === "dark"
                    ? "border-white/10 bg-[#0d0d11]"
                    : "border-black/10 bg-white/50"
                }`}>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                    {item.q}
                    <ChevronDown className={`h-4 w-4 transition group-open:rotate-180 ${
                      theme === "dark" ? "text-white/60" : "text-black/60"
                    }`} />
                  </summary>
                  <p className={`mt-3 text-sm leading-7 ${
                    theme === "dark" ? "text-white/70" : "text-black/70"
                  }`}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className={`overflow-hidden rounded-3xl border p-8 md:p-12 transition-colors duration-300 ${
              theme === "dark"
                ? "border-border/70 bg-[linear-gradient(135deg,hsl(var(--card)/0.92),#0d0d11_55%,hsl(var(--muted)/0.45))]"
                : "border-black/20 bg-white"
            }`}>
              <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <SectionTag text="Final CTA" />
                  <h2 className={`mt-4 text-3xl font-display font-black sm:text-4xl md:text-5xl ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}>
                    আজই আপনার প্রস্তুতি শুরু করুন
                  </h2>
                  <p className={`mt-4 ${
                    theme === "dark" ? "text-white/70" : "text-black/70"
                  }`}>
                    আপনার সফলতার যাত্রা এখান থেকেই শুরু। এক প্ল্যাটফর্মে learning,
                    practice, exam, analytics - সবকিছু।
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="glass"
                      className={`h-12 px-7 text-base font-semibold ${
                        theme === "dark"
                          ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                          : "border-black/15 bg-black/5 text-black hover:bg-black/10"
                      }`}
                      asChild
                    >
                      <Link to="/signup">
                        <Flame className="mr-2 h-4 w-4" /> ফ্রি প্র্যাকটিস শুরু করুন
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className={`h-12 px-7 text-base ${
                        theme === "dark"
                          ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                          : "border-black/20 bg-black/5 text-black hover:bg-black/10"
                      }`}
                      asChild
                    >
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
