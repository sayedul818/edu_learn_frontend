import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { examsAPI, examResultsAPI, leaderboardAPI } from "@/services/api";
import { BarChart3, ClipboardList, Trophy, TrendingUp, Target, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const performanceData = [
  { subject: "Physics", score: 85 },
  { subject: "Chemistry", score: 60 },
  { subject: "Math", score: 92 },
  { subject: "Biology", score: 75 },
  { subject: "English", score: 88 },
  { subject: "ICT", score: 70 },
];

const weeklyProgress = [
  { week: "Week 1", exams: 3, avgScore: 65 },
  { week: "Week 2", exams: 5, avgScore: 72 },
  { week: "Week 3", exams: 4, avgScore: 78 },
  { week: "Week 4", exams: 6, avgScore: 83 },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [examsRes, resultsRes, lbRes] = await Promise.allSettled([
          examsAPI.getMine(),
          examResultsAPI.getMine(),
          leaderboardAPI.get('weekly'),
        ]);

        if (examsRes.status === 'fulfilled') setExams(examsRes.value.data || []);
        if (resultsRes.status === 'fulfilled') setResults((resultsRes.value.data || []).filter((r: any) => String(r.studentId) === String(user?.id || (user as any)?._id)));
        if (lbRes.status === 'fulfilled') setLeaderboard(lbRes.value.data || []);
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const myResults = results;
  const avgScore = myResults.length ? Math.round(myResults.reduce((a, r) => a + (r.percentage || 0), 0) / myResults.length) : 0;
  const myRank = leaderboard.find((l) => String(l.studentId) === String(user?.id || (user as any)?._id))?.rank || "-";

  // compute weak subject from results+exams if possible
  const subjectAgg: Record<string, { sum: number; count: number }> = {};
  myResults.forEach((r) => {
    const exam = exams.find((e) => String(e._id || e.id) === String(r.examId));
    const subjectName = exam?.subject?.name || (exam?.subject || 'Unknown');
    if (!subjectAgg[subjectName]) subjectAgg[subjectName] = { sum: 0, count: 0 };
    subjectAgg[subjectName].sum += r.percentage || 0;
    subjectAgg[subjectName].count += 1;
  });
  const weakSubject = Object.keys(subjectAgg).length ? Object.entries(subjectAgg).sort((a, b) => (a[1].sum / a[1].count) - (b[1].sum / b[1].count))[0][0] : "-";

  const stats = [
    { label: "Exams Taken", value: myResults.length, icon: <ClipboardList className="h-5 w-5" />, color: "text-primary" },
    { label: "Avg. Score", value: `${avgScore}%`, icon: <BarChart3 className="h-5 w-5" />, color: "text-accent" },
    { label: "Rank", value: `#${myRank}`, icon: <Trophy className="h-5 w-5" />, color: "text-warning" },
    { label: "Weak Subject", value: weakSubject, icon: <Target className="h-5 w-5" />, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 font-bangla">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl font-display font-bold">Welcome back, {user?.name?.split(" ")[0]}! 👋</h1>
          <p className="mt-1 text-sm text-white/80">Here's your preparation overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${s.color}`}>{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Subject Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="subject" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Weekly Progress</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Results</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myResults.length === 0 && !loading && <p className="text-sm text-muted-foreground">No recent results yet.</p>}
            {myResults.map((r) => {
              const exam = exams.find((e) => String(e._id || e.id) === String(r.examId));
              const submitted = r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '';
              return (
                <div key={r._id || r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{exam?.title || 'Exam'}</p>
                      <p className="text-xs text-muted-foreground">{submitted || r.submittedAt || '-'}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${r.percentage >= 80 ? "text-success" : r.percentage >= 50 ? "text-warning" : "text-destructive"}`}>
                    {r.percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
