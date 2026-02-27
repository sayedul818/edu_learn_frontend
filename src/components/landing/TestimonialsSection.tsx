import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rahim Ahmed",
    role: "SSC Student, Dhaka",
    content: "ExamPro helped me score A+ in my SSC exams. The question bank is incredibly well-organized and the analytics showed me exactly where I needed to improve.",
    rating: 5,
  },
  {
    name: "Fatima Akter",
    role: "HSC Candidate",
    content: "The timed mock exams feel exactly like the real thing. I was so well-prepared that the actual exam felt easy. Best platform for exam prep!",
    rating: 5,
  },
  {
    name: "Prof. Karim Hassan",
    role: "Physics Teacher",
    content: "As a teacher, this platform saves me hours of work. I can create exams, track student performance, and identify weak students — all in one place.",
    rating: 5,
  },
  {
    name: "Nadia Islam",
    role: "University Admission Prep",
    content: "I tried multiple platforms but ExamPro's adaptive difficulty and detailed explanations made the biggest difference in my preparation journey.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">
            Loved by Students & Teachers
          </h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of students who have improved their exam performance with ExamPro.
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
