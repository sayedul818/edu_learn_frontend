import { motion } from "framer-motion";
import { UserPlus, FileQuestion, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description: "Sign up in seconds as a student or teacher. Choose your exam category and get started immediately.",
  },
  {
    icon: FileQuestion,
    step: "02",
    title: "Practice & Take Exams",
    description: "Access thousands of questions, take timed mock exams, and get instant results with detailed explanations.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Track & Improve",
    description: "Monitor your progress with smart analytics, identify weak areas, and climb the leaderboard rankings.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">
            Start Learning in 3 Easy Steps
          </h2>
          <p className="text-muted-foreground text-lg">
            Getting started is simple. No complicated setup, no payment required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              className="relative text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="relative inline-flex mb-6">
                <div className="h-16 w-16 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-glow">
                  <step.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  {step.step}
                </span>
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
