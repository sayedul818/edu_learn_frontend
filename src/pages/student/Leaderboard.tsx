import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leaderboardAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Medal, Award } from "lucide-react";

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
        setData(res.data || []);
      } catch (e) {
        console.error('Failed to load leaderboard', e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

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
      <div className="grid grid-cols-3 gap-4">
        {data.slice(0, 3).map((e, i) => {
          const sizes = ["", "scale-110", ""];
          return (
            <Card key={String(e.studentId)} className={`text-center ${i === 0 ? "border-warning/50 shadow-card-hover" : ""}`}>
              <CardContent className="p-5">
                <div className="mb-2">{rankIcons[e.rank]}</div>
                <div className={`h-12 w-12 mx-auto rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold`}>
                  {e.name ? String(e.name).charAt(0) : "?"}
                </div>
                <p className="font-medium mt-2 text-sm">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.avgPercentage}% avg</p>
                <p className="text-lg font-display font-bold text-primary mt-1">{e.totalScore} pts</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full list */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Full Rankings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.map((entry) => (
              <div key={String(entry.studentId)} className={`flex items-center gap-4 p-3 rounded-lg ${String(entry.studentId) === String(user?.id || (user as any)?._id) ? "bg-primary/10 border border-primary/30" : "bg-muted/30"}`}>
                <span className={`w-8 text-center font-display font-bold text-lg ${entry.rank <= 3 ? "text-warning" : "text-muted-foreground"}`}>
                  #{entry.rank}
                </span>
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {entry.name ? String(entry.name).charAt(0) : "?"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{entry.name} {String(entry.studentId) === String(user?.id || (user as any)?._id) && <span className="text-xs text-primary">(You)</span>}</p>
                  <p className="text-xs text-muted-foreground">{entry.examsCompleted} exams</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-primary">{entry.totalScore} pts</p>
                  <p className="text-xs text-muted-foreground">{entry.avgPercentage}% avg</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
