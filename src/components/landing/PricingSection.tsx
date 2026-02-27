import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "০",
    period: "Forever",
    description: "Perfect for getting started",
    features: [
      "500+ practice questions",
      "3 mock exams per month",
      "Basic analytics",
      "Leaderboard access",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "৳299",
    period: "/month",
    description: "For serious exam preparation",
    features: [
      "Unlimited question bank",
      "Unlimited mock exams",
      "Advanced analytics & insights",
      "Weak area detection",
      "Detailed explanations",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Institution",
    price: "৳999",
    period: "/month",
    description: "For coaching centers & schools",
    features: [
      "Everything in Pro",
      "Teacher dashboard",
      "Batch management",
      "Student performance reports",
      "Custom branding",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative p-8 rounded-2xl border ${
                plan.popular
                  ? "bg-card border-primary shadow-card-hover scale-[1.02]"
                  : "bg-card border-border shadow-card"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-hero-gradient text-primary-foreground text-xs font-semibold">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-display font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-display font-extrabold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
