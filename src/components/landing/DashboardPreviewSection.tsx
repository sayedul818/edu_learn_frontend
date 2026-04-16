import { motion } from "framer-motion";
import { TrendingUp, Trophy, BookOpenText, Target } from "lucide-react";

const DashboardPreviewSection = () => {
  return (
    <section id="dashboard-preview" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">ড্যাশবোর্ড প্রিভিউ</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">
              আপনার লার্নিং ড্যাশবোর্ড এক নজরে
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              প্রগ্রেস চার্ট, পরীক্ষার ফলাফল এবং পারফরম্যান্স সহজেই দেখুন। কোথায় দুর্বলতা আছে, কোন বিষয়ে উন্নতি দরকার—সব একবারে বুঝুন।
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 max-w-xl">
              {[
                { icon: TrendingUp, title: "প্রগ্রেস", value: "82%" },
                { icon: Trophy, title: "র‌্যাঙ্ক", value: "#12" },
                { icon: BookOpenText, title: "প্র্যাকটিস", value: "240" },
                { icon: Target, title: "নির্ভুলতা", value: "91%" },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.title}</p>
                      <p className="text-xl font-display font-bold">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            className="relative rounded-[2rem] border border-border bg-card p-4 shadow-card-hover overflow-hidden"
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_26%)]" />
            <div className="relative grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-950 text-white p-5">
                <p className="text-xs text-white/60 mb-2">আজকের অগ্রগতি</p>
                <p className="text-3xl font-display font-bold">92%</p>
                <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                </div>
                <p className="text-xs text-white/70 mt-3">গত সপ্তাহের তুলনায় 18% বেশি</p>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-border p-5">
                <p className="text-sm font-semibold mb-3">পারফরম্যান্স ট্রেন্ড</p>
                <div className="flex items-end gap-2 h-40">
                  {[34, 52, 41, 65, 58, 74, 92].map((h, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        className="w-full rounded-t-xl bg-gradient-to-t from-emerald-500 to-cyan-400"
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: idx * 0.06 }}
                      />
                      <span className="text-[10px] text-muted-foreground">{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-border p-5 md:col-span-2 grid gap-4 md:grid-cols-3">
                {[
                  { label: "দুর্বল টপিক", value: "ব্যাকশুদ্ধি", tone: "bg-amber-500/10 text-amber-600" },
                  { label: "সর্বশেষ পরীক্ষা", value: "বাংলা ২য় পত্র", tone: "bg-blue-500/10 text-blue-600" },
                  { label: "আজকের লক্ষ্য", value: "40 প্রশ্ন", tone: "bg-emerald-500/10 text-emerald-600" },
                ].map((card) => (
                  <div key={card.label} className={`rounded-xl p-4 ${card.tone}`}>
                    <p className="text-xs opacity-80">{card.label}</p>
                    <p className="text-lg font-semibold mt-1">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreviewSection;