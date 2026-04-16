import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "রাহিম আহমেদ",
    role: "এসএসসি শিক্ষার্থী, ঢাকা",
    content: "এই প্ল্যাটফর্ম ব্যবহার করে আমার পরীক্ষার রেজাল্ট অনেক উন্নতি হয়েছে! প্রশ্ন ব্যাংক আর প্রগ্রেস ট্র্যাকিং অসাধারণ।",
    rating: 5,
  },
  {
    name: "ফাতেমা আক্তার",
    role: "এইচএসসি পরীক্ষার্থী",
    content: "শিক্ষার্থীদের পারফরম্যান্স ট্র্যাক করা এখন অনেক সহজ! লাইভ পরীক্ষা আর র‌্যাঙ্কিং আমাকে খুব অনুপ্রাণিত করেছে।",
    rating: 5,
  },
  {
    name: "প্রফেসর করিম হাসান",
    role: "শিক্ষক",
    content: "শিক্ষক ড্যাশবোর্ডটি খুবই কার্যকর। প্রশ্ন তৈরি, পরীক্ষা নেওয়া, এবং পারফরম্যান্স বিশ্লেষণ সব এক জায়গায়।",
    rating: 5,
  },
  {
    name: "নাদিয়া ইসলাম",
    role: "ভর্তি প্রস্তুতি",
    content: "রেজাল্ট, চ্যালেঞ্জ আর লিডারবোর্ড—সবকিছু একসাথে থাকায় প্রস্তুতি অনেক বেশি মজার ও নিয়মিত হয়েছে।",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">মতামত</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">
            শিক্ষার্থী ও শিক্ষকদের পছন্দের প্ল্যাটফর্ম
          </h2>
          <p className="text-muted-foreground text-lg">
            হাজারো শিক্ষার্থী ও শিক্ষক ইতিমধ্যেই ExamPathshala ব্যবহার করছেন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="p-6 rounded-2xl bg-card border border-border shadow-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground/90 text-sm leading-relaxed mb-4">"{testimonial.content}"</p>
              <div>
                <p className="font-display font-semibold text-sm">{testimonial.name}</p>
                <p className="text-muted-foreground text-xs">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
