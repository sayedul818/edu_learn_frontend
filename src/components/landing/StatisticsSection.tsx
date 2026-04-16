import { motion } from "framer-motion";
import { Users, UserCog, BookOpen, FileText } from "lucide-react";

const stats = [
  { icon: Users, value: "১০,০০০+", label: "শিক্ষার্থী" },
  { icon: UserCog, value: "৫০০+", label: "শিক্ষক" },
  { icon: BookOpen, value: "৫০,০০০+", label: "প্রশ্ন" },
  { icon: FileText, value: "৫,০০০+", label: "পরীক্ষা" },
];

const StatisticsSection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-6 text-center shadow-card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl font-display font-extrabold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;