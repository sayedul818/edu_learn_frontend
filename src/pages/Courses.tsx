import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    price: "৳৫,৯৯৯",
    oldPrice: "৳११,९९८",
    image: courseSSC,
    accent: "#3b82f6",
    duration: "६ মাস",
    students: "२,३५०",
    rating: 4.8,
    level: "Intermediate",
    modules: 24,
    projects: 8,
    stats: [
      { label: "Modules", value: "24" },
      { label: "Projects", value: "८" },
      { label: "Learning Hours", value: "२४०+" },
    ],
    features: [
      "Live project-based learning",
      "१-on-१ mentor guidance",
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
    price: "৳६,९९९",
    oldPrice: "৳१२,४९९",
    image: courseHSC,
    accent: "#8b5cf6",
    duration: "५ মাস",
    students: "१,०००",
    rating: 4.7,
    level: "Intermediate",
    modules: 20,
    projects: 6,
    stats: [
      { label: "Modules", value: "२०" },
      { label: "Projects", value: "६" },
      { label: "Learning Hours", value: "२००+" },
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
    price: "৳३,४९९",
    oldPrice: "৳६,९९९",
    image: courseAdmission,
    accent: "#ec4899",
    duration: "८ মাস",
    students: "५,२००",
    rating: 4.9,
    level: "Beginner",
    modules: 32,
    projects: 0,
    stats: [
      { label: "Topics", value: "२५०+" },
      { label: "Mock Tests", value: "५०+" },
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
    price: "৳७,४९९",
    oldPrice: "৳१०,०००",
    image: courseSSC,
    accent: "#10b981",
    duration: "४ মাস",
    students: "९००",
    rating: 4.6,
    level: "Advanced",
    modules: 18,
    projects: 5,
    stats: [
      { label: "Modules", value: "१८" },
      { label: "Lab Projects", value: "५" },
      { label: "Certifications", value: "३" },
    ],
    features: [
      "AWS & Azure certified",
      "Production-ready setups",
      "Real infrastructure labs",
      "DevOps best practices",
      "२४/७ lab access",
    ],
  },
  {
    id: 5,
    title: "Mobile App Development - React Native & Flutter",
    shortDesc: "Mobile Apps",
    text: "iOS এবং Android উভয় প্ল্যাটফর্মে native-quality apps তৈরি করুন।",
    price: "৳६,२००",
    oldPrice: "৳११,०००",
    image: courseHSC,
    accent: "#f59e0b",
    duration: "५.५ মাস",
    students: "१,७००",
    rating: 4.8,
    level: "Intermediate",
    modules: 22,
    projects: 7,
    stats: [
      { label: "Modules", value: "२२" },
      { label: "App Projects", value: "७" },
      { label: "Learning Hours", value: "२२०+" },
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
    price: "৳०,०००",
    oldPrice: "৳१२,०००",
    image: courseAdmission,
    accent: "#ef4444",
    duration: "३ মাস",
    students: "६००",
    rating: 4.7,
    level: "Advanced",
    modules: 16,
    projects: 4,
    stats: [
      { label: "Modules", value: "१६" },
      { label: "Design Cases", value: "२०+" },
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
  if (!course) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0a0e] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
        >
          ✕
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="h-80 overflow-hidden rounded-2xl border border-white/10">
              <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-2 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                {course.level}
              </div>
              <h2 className="mt-2 text-3xl font-display font-black text-white">{course.title}</h2>
              <p className="mt-3 text-white/70">{course.text}</p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {course.stats.map((stat, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-xs text-white/60">{stat.label}</p>
                    <p className="mt-1 text-xl font-display font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-white">📚 কোর্স বৈশিষ্ট্য:</h4>
                <ul className="mt-3 space-y-2">
                  {course.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-white/75">
                      <CheckCircle2 className="h-4 w-4" style={{ color: course.accent }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">মূল্য</p>
                  <p className="text-3xl font-display font-black" style={{ color: course.accent }}>
                    {course.price}
                  </p>
                  <p className="mt-1 text-sm text-white/40 line-through">{course.oldPrice}</p>
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex rounded-full border border-border/70 bg-card/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                সমস্ত প্রিমিয়াম কোর্স
              </span>
              <h1 className="mt-4 text-4xl font-display font-black sm:text-5xl md:text-6xl">আপনার লক্ষ্য অর্জনের পথ</h1>
              <p className="mx-auto mt-3 max-w-3xl text-lg text-white/65">
                আমাদের ৬টি বিশেষভাবে ডিজাইন করা কোর্স থেকে বেছে নিন এবং আপনার ক্যারিয়ারকে নতুন উচ্চতায় নিয়ে যান।
              </p>
            </motion.div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:from-white/[0.12] hover:via-white/[0.06]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
              >
                {/* Gradient accent corner */}
                <div
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl opacity-20 transition-opacity duration-300 group-hover:opacity-40"
                  style={{ backgroundColor: course.accent }}
                />

                {/* Course Image */}
                <div className="relative mb-5 h-48 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
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
                    <h3 className="line-clamp-2 text-base font-display font-bold text-white leading-tight">{course.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs text-white/65">{course.shortDesc}</p>
                  </div>

                  {/* Duration and Students */}
                  <div className="flex items-center gap-3 text-xs text-white/70">
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
                    <span className="text-xs font-semibold text-white">{course.rating.toFixed(1)}</span>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 py-3">
                    {course.stats.slice(0, 3).map((stat, idx) => (
                      <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                        <p className="text-[10px] text-white/50">{stat.label}</p>
                        <p className="mt-0.5 text-xs font-bold text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-white/10 via-white/20 to-white/10" />

                  {/* Footer: Price and Button */}
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <div>
                      <p className="text-xs text-white/50">মূল্য</p>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <p className="text-lg font-display font-black" style={{ color: course.accent }}>
                          {course.price}
                        </p>
                        <p className="text-xs text-white/35 line-through">{course.oldPrice}</p>
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
