import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  BarChart3,
  Trophy,
  Brain,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "প্রশ্ন ব্যাংক (MCQ ও CQ)",
    description: "বিষয়, অধ্যায় ও কঠিনতার ভিত্তিতে সাজানো হাজারো প্রশ্ন, বিস্তারিত ব্যাখ্যাসহ।",
  },
  {
    icon: Clock,
    title: "লাইভ পরীক্ষা",
    description: "কাউন্টডাউন, অটো-সাবমিট, নেগেটিভ মার্কিং এবং র‌্যান্ডম প্রশ্নসহ বাস্তব অভিজ্ঞতা।",
  },
  {
    icon: BarChart3,
    title: "প্রগ্রেস ট্র্যাকিং",
    description: "গ্রাফ, দুর্বলতা শনাক্তকরণ এবং স্কোর ট্রেন্ড দিয়ে অগ্রগতি সহজে দেখুন।",
  },
  {
    icon: Trophy,
    title: "লিডারবোর্ড",
    description: "দৈনিক, সাপ্তাহিক এবং মাসিক র‌্যাঙ্কিংয়ে অন্যদের সাথে প্রতিযোগিতা করুন।",
  },
  {
    icon: Brain,
    title: "একাধিক কোর্স",
    description: "SSC, HSC, ভর্তি পরীক্ষা এবং চাকরির প্রস্তুতির জন্য আলাদা কোর্স।",
  },
  {
    icon: Smartphone,
    title: "শিক্ষক ড্যাশবোর্ড",
    description: "প্রশ্ন তৈরি, পরীক্ষা ব্যবস্থাপনা এবং ছাত্রদের অগ্রগতি বিশ্লেষণ একসাথে।",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="pt-10 pb-20 md:pt-14 md:pb-28">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">বৈশিষ্ট্য</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">
            পরীক্ষায় এগিয়ে যেতে যা দরকার সবই
          </h2>
          <p className="text-muted-foreground text-lg">
            বই, কোচিং আর আলাদা টেস্ট পেপারের বিকল্প একটি সম্পূর্ণ ডিজিটাল ইকোসিস্টেম।
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
