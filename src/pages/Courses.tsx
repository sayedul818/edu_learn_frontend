import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowRight,
  Clock3,
  CheckCircle2,
  Star,
  Users,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ChatbotWidget from "@/components/landing/ChatbotWidget";
import { Button } from "@/components/ui/button";
import courseSSC from "@/assets/course-ssc.svg";
import courseHSC from "@/assets/course-hsc.svg";
import courseAdmission from "@/assets/course-admission.svg";

const courses = [
  {
    id: 1,
    title: "জব রেডি AI Powered Complete Web Development + DSA",
    shortDesc: "Web dev + DSA",
    text: "Beginner থেকে advanced পর্যন্ত guided roadmap। Live projects এবং mentor support।",
    price: "৳5,999",
    oldPrice: "৳11,998",
    image: courseSSC,
    accent: "#3b82f6",
    duration: "6 মাস",
    students: "2,350",
    rating: 4.8,
    level: "Intermediate",
    modules: 24,
    projects: 8,
    stats: [
      { label: "Modules", value: "24" },
      { label: "Projects", value: "8" },
      { label: "Learning Hours", value: "240+" },
    ],
    features: [
      "Live project-based learning",
      "1-on-1 mentor guidance",
      "Job placement assistance",
      "Interview preparation",
      "Certificate included",
    ],
  },
  {
    id: 2,
    title: "Data Science & Analytics with Gen AI",
    shortDesc: "Data Science",
    text: "Real-world data projects, machine learning, এবং AI integration সহ practical workflow।",
    price: "৳6,999",
    oldPrice: "৳12,499",
    image: courseHSC,
    accent: "#8b5cf6",
    duration: "5 মাস",
    students: "1,000",
    rating: 4.7,
    level: "Intermediate",
    modules: 20,
    projects: 6,
    stats: [
      { label: "Modules", value: "20" },
      { label: "Projects", value: "6" },
      { label: "Learning Hours", value: "200+" },
    ],
    features: [
      "Real dataset analysis",
      "ML algorithms mastery",
      "Gen AI integration",
      "Portfolio building",
      "Career mentoring",
    ],
  },
  {
    id: 3,
    title: "প্রিমিয়াম পরীক্ষার প্রস্তুতি ব্যাচ",
    shortDesc: "SSC/HSC Prep",
    text: "SSC, HSC, admission এর জন্য comprehensive practice workflow এবং live guidance।",
    price: "৳3,499",
    oldPrice: "৳6,999",
    image: courseAdmission,
    accent: "#ec4899",
    duration: "8 মাস",
    students: "5,200",
    rating: 4.9,
    level: "Beginner",
    modules: 32,
    projects: 0,
    stats: [
      { label: "Topics", value: "250+" },
      { label: "Mock Tests", value: "50+" },
      { label: "Subjects", value: "সব" },
    ],
    features: [
      "Topic-wise practice",
      "Mock exams with timer",
      "Performance analytics",
      "Live doubt sessions",
      "Success guarantee",
    ],
  },
  {
    id: 4,
    title: "Advanced Cloud & DevOps Mastery",
    shortDesc: "Cloud DevOps",
    text: "AWS, Docker, Kubernetes, এবং CI/CD pipeline hands-on mastery।",
    price: "৳7,499",
    oldPrice: "৳10,000",
    image: courseSSC,
    accent: "#10b981",
    duration: "4 মাস",
    students: "900",
    rating: 4.6,
    level: "Advanced",
    modules: 18,
    projects: 5,
    stats: [
      { label: "Modules", value: "18" },
      { label: "Lab Projects", value: "5" },
      { label: "Certifications", value: "3" },
    ],
    features: [
      "AWS & Azure certified",
      "Production-ready setups",
      "Real infrastructure labs",
      "DevOps best practices",
      "24/7 lab access",
    ],
  },
  {
    id: 5,
    title: "Mobile App Development - React Native & Flutter",
    shortDesc: "Mobile Apps",
    text: "iOS এবং Android উভয় প্ল্যাটফর্মে native-quality apps তৈরি করুন।",
    price: "৳6,200",
    oldPrice: "৳11,000",
    image: courseHSC,
    accent: "#f59e0b",
    duration: "5.5 মাস",
    students: "1,700",
    rating: 4.8,
    level: "Intermediate",
    modules: 22,
    projects: 7,
    stats: [
      { label: "Modules", value: "22" },
      { label: "App Projects", value: "7" },
      { label: "Learning Hours", value: "220+" },
    ],
    features: [
      "React Native & Flutter",
      "State management mastery",
      "App store deployment",
      "Performance optimization",
      "Live app launches",
    ],
  },
  {
    id: 6,
    title: "Full-Stack System Design & Architecture",
    shortDesc: "System Design",
    text: "Scalable systems design, microservices, এবং enterprise architecture patterns।",
    price: "৳0,000",
    oldPrice: "৳12,000",
    image: courseAdmission,
    accent: "#ef4444",
    duration: "3 মাস",
    students: "600",
    rating: 4.7,
    level: "Advanced",
    modules: 16,
    projects: 4,
    stats: [
      { label: "Modules", value: "16" },
      { label: "Design Cases", value: "20+" },
      { label: "Interview Prep", value: "Complete" },
    ],
    features: [
      "FAANG-level design",
      "Real-world case studies",
      "Interview guidance",
      "Architecture patterns",
      "Scalability strategies",
    ],
  },
];

const CourseDetailModal = ({ course, onClose }: { course: typeof courses[0] | null; onClose: () => void }) => {
  const { theme } = useTheme();

  if (!course) return null;

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
        theme === "dark" ? "bg-black/60" : "bg-black/25"
      }`}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border p-8 shadow-2xl transition-colors duration-300 ${
          theme === "dark"
            ? "border-white/10 bg-[#0a0a0e] text-white"
            : "border-black/10 bg-white text-black"
        }`}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button
          onClick={onClose}
          className={`absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300 ${
            theme === "dark"
              ? "border-white/20 text-white hover:bg-white/10"
              : "border-black/15 text-black hover:bg-black/10"
          }`}
        >
          ✕
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className={`h-80 overflow-hidden rounded-2xl border transition-colors duration-300 ${
              theme === "dark" ? "border-white/10" : "border-black/10"
            }`}>
              <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className={`mb-2 inline-block rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-300 ${
                theme === "dark"
                  ? "border-white/20 bg-white/10 text-white/80"
                  : "border-black/15 bg-black/5 text-black/70"
              }`}>
                {course.level}
              </div>
              <h2 className={`mt-2 text-3xl font-display font-black ${theme === "dark" ? "text-white" : "text-black"}`}>
                {course.title}
              </h2>
              <p className={`mt-3 ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>{course.text}</p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {course.stats.map((stat, idx) => (
                  <div key={idx} className={`rounded-xl border p-3 text-center transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-white/10 bg-white/5"
                      : "border-black/10 bg-black/5"
                  }`}>
                    <p className={`text-xs ${theme === "dark" ? "text-white/60" : "text-black/55"}`}>{stat.label}</p>
                    <p className={`mt-1 text-xl font-display font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>📚 কোর্স বৈশিষ্ট্য:</h4>
                <ul className="mt-3 space-y-2">
                  {course.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-center gap-2 text-sm ${theme === "dark" ? "text-white/75" : "text-black/75"}`}>
                      <CheckCircle2 className="h-4 w-4" style={{ color: course.accent }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={`mt-6 border-t pt-6 transition-colors duration-300 ${theme === "dark" ? "border-white/10" : "border-black/10"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-black/60"}`}>মূল্য</p>
                  <p className="text-3xl font-display font-black" style={{ color: course.accent }}>
                    {course.price}
                  </p>
                  <p className={`mt-1 text-sm line-through ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
                    {course.oldPrice}
                  </p>
                </div>
                <Button className="h-12 rounded-xl px-6 text-base font-semibold" style={{ backgroundColor: course.accent }}>
                  এখনই কোর্স নিন
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Courses() {
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const { theme } = useTheme();
  const cardTextClass = "font-bangla antialiased tracking-normal";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark" ? "bg-background text-foreground" : "bg-[#f5f5f7] text-black"
    }`}>
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <span className={`inline-flex rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                theme === "dark"
                  ? "border-border/70 bg-card/70 text-muted-foreground"
                  : "border-black/20 bg-black/10 text-black/70"
              }`}>
                সমস্ত প্রিমিয়াম কোর্স
              </span>
              <h1 className="mt-4 text-4xl font-display font-black sm:text-5xl md:text-6xl">আপনার লক্ষ্য অর্জনের পথ</h1>
              <p className={`mx-auto mt-3 max-w-3xl text-lg ${
                theme === "dark" ? "text-white/65" : "text-black/65"
              }`}>
                আমাদের 6টি বিশেষভাবে ডিজাইন করা কোর্স থেকে বেছে নিন এবং আপনার ক্যারিয়ারকে নতুন উচ্চতায় নিয়ে যান।
              </p>
            </motion.div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
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
                transition={{ duration: 0.85, delay: index * 0.12, ease: "easeInOut" }}
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
                    <h3 className={`line-clamp-2 text-base font-display font-bold leading-snug ${cardTextClass} ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}>{course.title}</h3>
                    <p className={`mt-2 line-clamp-2 text-xs leading-6 ${cardTextClass} ${
                      theme === "dark" ? "text-white/65" : "text-black/65"
                    }`}>{course.shortDesc}</p>
                  </div>

                  {/* Duration and Students */}
                  <div className={`flex items-center gap-3 text-xs ${cardTextClass} ${
                    theme === "dark" ? "text-white/70" : "text-black/70"
                  }`}>
                    <div className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{course.duration}</span>
                    </div>
                    <span className={theme === "dark" ? "text-white/30" : "text-black/30"}>•</span>
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
                    <span className={`text-xs font-semibold ${cardTextClass} ${theme === "dark" ? "text-white" : "text-black"}`}>
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
                        <p className={`text-[10px] ${cardTextClass} ${
                          theme === "dark" ? "text-white/50" : "text-black/50"
                        }`}>{stat.label}</p>
                        <p className={`mt-0.5 text-xs font-bold ${cardTextClass} ${theme === "dark" ? "text-white" : "text-black"}`}>
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
                      <p className={`text-xs ${cardTextClass} ${
                        theme === "dark" ? "text-white/50" : "text-black/50"
                      }`}>মূল্য</p>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <p className={`text-lg font-display font-black ${cardTextClass}`} style={{ color: course.accent }}>
                          {course.price}
                        </p>
                        <p className={`text-xs line-through ${cardTextClass} ${theme === "dark" ? "text-white/35" : "text-black/35"}`}>
                          {course.oldPrice}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 border ${cardTextClass}`}
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
        </div>
      </main>

      <AnimatePresence>
        {selectedCourse && <CourseDetailModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />}
      </AnimatePresence>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
