import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Trophy, Brain, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-10 md:pt-36 md:pb-14 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.015),transparent)]" />
      <motion.div
        className="absolute -z-10 top-20 left-10 h-72 w-72 rounded-full bg-emerald-500/6 blur-3xl"
        animate={{ y: [0, 12, 0], x: [0, 6, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -z-10 bottom-10 right-6 h-80 w-80 rounded-full bg-cyan-400/6 blur-3xl"
        animate={{ y: [0, -10, 0], x: [0, -6, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6 backdrop-blur-sm shadow-sm">
              <Sparkles className="h-4 w-4" /> স্মার্ট লার্নিং, লাইভ পরীক্ষা, লিডারবোর্ড
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-5xl xl:text-[4.25rem] font-display font-bold tracking-[-0.06em] leading-[1.02] mb-6 xl:whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            স্মার্ট লার্নিং দিয়ে পরীক্ষায়{" "}
            <span className="text-gradient">এগিয়ে থাকুন</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            MCQ ও CQ প্র্যাকটিস করুন, লাইভ এক্সাম দিন, নিজের প্রগ্রেস ট্র্যাক করুন এবং লিডারবোর্ডে প্রতিযোগিতা করুন।
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
          >
            {[
              { icon: BookOpen, label: "প্রশ্ন ব্যাংক" },
              { icon: Brain, label: "CQ/MCQ প্রস্তুতি" },
              { icon: Trophy, label: "লিডারবোর্ড" },
              { icon: Users, label: "শিক্ষক ড্যাশবোর্ড" },
            ].map((tag) => (
              <div key={tag.label} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm shadow-sm backdrop-blur-md text-foreground/90">
                <tag.icon className="h-4 w-4 text-primary" />
                <span>{tag.label}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <Link to="/signup">
                🚀 শুরু করুন <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
              <Link to="/signup?role=teacher">
                👨‍🏫 শিক্ষক হিসেবে যোগ দিন <Play className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            ✓ কোনো কার্ড দরকার নেই &nbsp; ✓ ৫০,০০০+ প্রশ্ন &nbsp; ✓ লাইভ ফলাফল
          </motion.p>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
