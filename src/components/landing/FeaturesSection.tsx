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
    title: "Smart Question Bank",
    description: "Thousands of MCQs and written questions organized by subject, chapter, and difficulty level with detailed explanations.",
  },
  {
    icon: Clock,
    title: "Timed Mock Exams",
    description: "Realistic exam simulations with countdown timers, auto-submit, negative marking, and randomized questions.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track your progress with detailed performance graphs, weak subject detection, and score trends over time.",
  },
  {
    icon: Trophy,
    title: "Leaderboard & Rankings",
    description: "Compete with peers through daily, weekly, and monthly rankings. Stay motivated and push your limits.",
  },
  {
    icon: Brain,
    title: "Adaptive Learning",
    description: "Questions adapt to your skill level. Focus on areas where you need improvement the most.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Practice anywhere, anytime. Fully responsive platform optimized for phones, tablets, and desktops.",
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
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">
            Everything You Need to Excel
          </h2>
          <p className="text-muted-foreground text-lg">
            A complete digital ecosystem that replaces guide books, coaching centers, and printed test papers.
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
              className="group p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
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
