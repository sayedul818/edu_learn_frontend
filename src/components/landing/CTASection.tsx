import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          className="relative max-w-4xl mx-auto rounded-3xl bg-hero-gradient p-10 md:p-16 text-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              আজই আপনার শেখার যাত্রা শুরু করুন
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8">
              এখনই যোগ দিন, MCQ ও CQ প্র্যাকটিস করুন, নিজের অগ্রগতি দেখুন, এবং শিক্ষক হিসেবে ক্লাস ম্যানেজ করুন।
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" className="text-base px-8 h-12 font-semibold" asChild>
                <Link to="/signup">
                  🎯 শিক্ষার্থী হিসেবে যোগ দিন <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12 font-semibold border-white/40 text-primary-foreground hover:bg-white/10" asChild>
                <Link to="/signup?role=teacher">
                  👨‍🏫 শিক্ষক হিসেবে যোগ দিন
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
