import { motion } from "framer-motion";
import { UserPlus, FileQuestion, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "কোর্সে যোগ দিন",
    description: "ছাত্র বা শিক্ষক হিসেবে সাইন আপ করুন এবং পছন্দের কোর্স নির্বাচন করুন।",
  },
  {
    icon: FileQuestion,
    step: "02",
    title: "প্রশ্ন প্র্যাকটিস করুন",
    description: "MCQ, CQ এবং বিষয়ভিত্তিক প্রশ্ন ব্যাংক থেকে নিয়মিত অনুশীলন করুন।",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "পরীক্ষায় অংশগ্রহণ করুন",
    description: "লাইভ পরীক্ষায় অংশ নিন, নিজের ফলাফল দেখুন এবং র‌্যাঙ্কিং বাড়ান।",
  },
];

const teacherSteps = [
  {
    icon: UserPlus,
    step: "01",
    title: "কোর্স তৈরি করুন",
    description: "নিজের ব্যাচ বা বিষয় অনুযায়ী নতুন কোর্স চালু করুন।",
  },
  {
    icon: FileQuestion,
    step: "02",
    title: "প্রশ্ন যুক্ত করুন",
    description: "MCQ, CQ, sentence correction, fill blanks সবকিছু একসাথে যুক্ত করুন।",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "পারফরম্যান্স বিশ্লেষণ করুন",
    description: "ছাত্রদের দুর্বলতা, স্কোর ট্রেন্ড এবং পরীক্ষার ফল সহজে বিশ্লেষণ করুন।",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-20 md:py-28 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.02),transparent)]">
      <motion.div
        className="absolute -top-12 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1], y: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{ scale: [1, 1.1, 1], x: [0, -12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary uppercase tracking-[0.22em] backdrop-blur-sm">
            কিভাবে কাজ করে
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight leading-tight text-foreground">
            ছাত্র ও শিক্ষক, <span className="text-gradient">দুই অভিজ্ঞতা</span><span className="inline-block ml-2 md:ml-4">এক প্ল্যাটফর্মে</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            স্মার্ট অনবোর্ডিং, দ্রুত প্র্যাকটিস, লাইভ পরীক্ষা এবং পারফরম্যান্স ট্র্যাকিং—সবকিছু এমনভাবে সাজানো যাতে শেখা স্বাভাবিক আর আকর্ষণীয় লাগে।
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 max-w-7xl mx-auto items-stretch">
          <motion.div
            className="relative overflow-hidden rounded-[2rem] border border-border bg-card/80 p-7 md:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm"
            initial={{ opacity: 0, y: 24, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ perspective: 1200 }}
            whileHover={{ y: -4 }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),transparent_45%,rgba(16,185,129,0.08))]" />
            <div className="relative flex items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">শিক্ষার্থীদের জন্য</p>
                <h3 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-tight text-foreground">স্টাডি থেকে স্কোর, এক ঝলকে</h3>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-xs text-muted-foreground shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> লাইভ প্রোগ্রেস
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  className="group relative min-w-[220px] flex-1 snap-start overflow-hidden rounded-[1.5rem] border border-border bg-background/80 p-5 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:min-w-0"
                  initial={{ opacity: 0, y: 26, rotateX: 10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.12 }}
                  whileHover={{ y: -8, rotateX: -6, rotateY: 5, scale: 1.02 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative inline-flex mb-5">
                    <motion.div
                      className="h-18 w-18 rounded-[1.25rem] bg-[linear-gradient(145deg,#2563eb_0%,#4f46e5_45%,#06b6d4_100%)] flex items-center justify-center shadow-[0_18px_30px_rgba(37,99,235,0.28)]"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <step.icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <span className="absolute -top-3 -right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white shadow-lg">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-[1.35rem] font-display font-black tracking-tight mb-2 text-foreground">
                    {step.title}
                  </h3>
                  <p className="mx-auto max-w-[16rem] text-sm leading-7 text-muted-foreground">
                    {step.description}
                  </p>
                  <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#06b6d4,#22c55e)]"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.15 + index * 0.08 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative overflow-hidden rounded-[2rem] border border-border bg-slate-950 p-7 md:p-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.30)]"
            initial={{ opacity: 0, y: 24, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08 }}
            style={{ perspective: 1200 }}
            whileHover={{ y: -4 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.20),transparent_28%)]" />
            <div className="relative flex items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/90">শিক্ষকদের জন্য</p>
                <h3 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-tight text-white">ম্যানেজ, বিশ্লেষণ, উন্নতি</h3>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> Smart Teacher Mode
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
              {teacherSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  className="group relative min-w-[220px] flex-1 snap-start overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center backdrop-blur-md md:min-w-0"
                  initial={{ opacity: 0, y: 26, rotateX: 10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.12 }}
                  whileHover={{ y: -8, rotateX: -6, rotateY: -5, scale: 1.02 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative inline-flex mb-5">
                    <motion.div
                      className="h-18 w-18 rounded-[1.25rem] bg-[linear-gradient(145deg,#22c55e_0%,#06b6d4_55%,#2563eb_100%)] flex items-center justify-center shadow-[0_18px_30px_rgba(34,197,94,0.24)]"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4.5 + index, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <step.icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <span className="absolute -top-3 -right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400 text-[11px] font-bold text-slate-950 shadow-lg">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-[1.35rem] font-display font-black tracking-tight mb-2 text-white">
                    {step.title}
                  </h3>
                  <p className="mx-auto max-w-[16rem] text-sm leading-7 text-white/72">
                    {step.description}
                  </p>
                  <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#06b6d4,#60a5fa)]"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.15 + index * 0.08 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
