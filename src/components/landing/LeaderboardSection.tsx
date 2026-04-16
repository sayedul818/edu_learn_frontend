import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";

const leaders = [
  { rank: 1, name: "সাব্বির রহমান", score: 986, badge: Crown, tone: "from-amber-400 to-yellow-500" },
  { rank: 2, name: "ফারিহা ইসলাম", score: 972, badge: Trophy, tone: "from-slate-300 to-slate-400" },
  { rank: 3, name: "মেহেদী হাসান", score: 958, badge: Medal, tone: "from-orange-400 to-orange-500" },
];

const LeaderboardSection = () => {
  return (
    <section id="leaderboard" className="py-20 md:py-28 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">লিডারবোর্ড</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">সেরা শিক্ষার্থীদের তালিকা</h2>
          <p className="text-muted-foreground text-lg">আপনার অবস্থান দেখুন এবং সবার সাথে প্রতিযোগিতা করুন।</p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-4">
          {leaders.map((leader, index) => (
            <motion.div
              key={leader.rank}
              className="rounded-2xl border border-border bg-card p-5 shadow-card-hover flex items-center justify-between gap-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${leader.tone} text-white flex items-center justify-center font-display font-bold text-xl shadow-lg`}>
                  {leader.rank}
                </div>
                <div>
                  <p className="font-display font-semibold text-lg">{leader.name}</p>
                  <p className="text-sm text-muted-foreground">সাপ্তাহিক স্কোর</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display font-bold text-foreground">{leader.score}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeaderboardSection;