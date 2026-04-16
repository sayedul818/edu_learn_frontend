import { motion } from "framer-motion";
import { BookOpen, Star, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const courses = [
  { title: "SSC বাংলা", badge: "জনপ্রিয়", desc: "ব্যাকশুদ্ধি, ব্যাকরণ, রচনাসহ পূর্ণ প্রস্তুতি" },
  { title: "HSC ইংরেজি", badge: "নতুন", desc: "CQ, fill in the blanks, sentence correction" },
  { title: "ভর্তি প্রস্তুতি", badge: "টপ রেটেড", desc: "স্মার্ট প্র্যাকটিস, লাইভ টেস্ট, র‍্যাঙ্ক ট্র্যাকিং" },
];

const CoursesSection = () => {
  return (
    <section id="courses" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">কোর্স</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">জনপ্রিয় কোর্সসমূহ</h2>
          <p className="text-muted-foreground text-lg">নিজের লক্ষ্যের সাথে মিলিয়ে কোর্স বেছে নিন এবং নিয়মিত এগিয়ে যান।</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {courses.map((course, index) => (
            <motion.div
              key={course.title}
              className="rounded-3xl border border-border bg-card p-7 shadow-card-hover relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-glow">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Star className="h-3.5 w-3.5" /> {course.badge}
                </span>
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{course.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{course.desc}</p>
              <Button className="w-full" asChild>
                <Link to="/signup">এখনই ভর্তি হন</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;