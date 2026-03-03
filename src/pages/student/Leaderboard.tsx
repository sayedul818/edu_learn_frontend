  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leaderboardAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Medal, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const Leaderboard = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const rankIcons: Record<number, React.ReactNode> = {
    1: <Trophy className="h-6 w-6 text-warning" />,
    2: <Medal className="h-6 w-6 text-muted-foreground" />,
    3: <Award className="h-6 w-6 text-amber-700" />,
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await leaderboardAPI.get(period);
        const raw = res.data || [];
        // compute ranks based only on avgPercentage (descending). Use dense ranking so equal averages share the same rank.
        const processed = (raw || []).map((e:any) => ({ ...e, avgPercentage: Number(e.avgPercentage) || 0 }));
        processed.sort((a:any, b:any) => b.avgPercentage - a.avgPercentage);
        let lastAvg: number | null = null;
        let denseRank = 0;
        for (let i = 0; i < processed.length; i++) {
          const p = processed[i];
          if (lastAvg === null || p.avgPercentage !== lastAvg) {
            denseRank += 1;
            lastAvg = p.avgPercentage;
          }
          p.rank = denseRank;
        }
        setData(processed);
      } catch (e) {
        console.error('Failed to load leaderboard', e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const listVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.03 } }),
  };

  return (
    <div className="space-y-6 font-bangla">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl font-display font-bold">Leaderboard</h1>
          <p className="mt-1 text-sm text-white/80">See how you rank against other students</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["daily", "weekly", "monthly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Top 3 */}
      <div className="flex justify-center relative">
        {data[0] ? (
          <>
            <Confetti active={true} />
            <motion.div custom={0} variants={listVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.02 }} className="w-full sm:w-1/2 lg:w-1/3 text-center">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3">{rankIcons[data[0].rank]}</div>
                  <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {data[0].name ? String(data[0].name).charAt(0) : "?"}
                  </div>
                  <p className="font-medium mt-3 text-base">{data[0].name}</p>
                  <div className="mt-3">
                    <motion.span initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.12 }} className="text-3xl font-display font-bold text-emerald-600">{Number(data[0].avgPercentage).toFixed(2)}%</motion.span>
                    <p className="text-xs text-muted-foreground">average</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : null}
      </div>

      {/* Full list */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Full Rankings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.map((entry, idx) => (
              <motion.div key={String(entry.studentId)} custom={idx} variants={listVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.01 }} className={`flex items-center gap-4 p-3 rounded-lg transition-shadow ${String(entry.studentId) === String(user?.id || (user as any)?._id) ? "bg-primary/10 border border-primary/30 shadow-md" : "bg-muted/30 hover:shadow-sm"}`}>
                <span className={`w-10 text-center font-display font-bold text-lg ${entry.rank <= 3 ? "text-warning" : "text-muted-foreground"}`}>
                  #{entry.rank}
                </span>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {entry.name ? String(entry.name).charAt(0) : "?"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{entry.name} {String(entry.studentId) === String(user?.id || (user as any)?._id) && <span className="text-xs text-primary">(You)</span>}</p>
                  <p className="text-xs text-muted-foreground">{entry.examsCompleted} exams</p>
                </div>
                <div className="text-right">
                  <motion.span initial={{ x: 6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.02 * idx }} className="text-2xl font-display font-bold text-emerald-600">{Number(entry.avgPercentage).toFixed(2)}%</motion.span>
                  <p className="text-xs text-muted-foreground">average</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Confetti = ({ active = true }: { active?: boolean }) => {
  const [pieces] = useState(() => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
    return new Array(30).fill(0).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.6 + Math.random() * 1.2,
      rotate: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 10,
    }));
  });

  if (!active) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center">
      <div className="relative w-full h-40 overflow-visible">
        <style>{`
          @keyframes confettiFall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1 } 100% { transform: translateY(160px) rotate(360deg); opacity: 0 } }
        `}</style>
        {pieces.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: '-8px',
              width: p.size,
              height: p.size * 0.6,
              background: p.color,
              transform: `rotate(${p.rotate}deg)`,
              borderRadius: 2,
              animation: `confettiFall ${p.duration}s ${p.delay}s forwards cubic-bezier(.2,.8,.2,1)`,
            }}
            className="z-50"
          />
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
