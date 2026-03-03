import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { examsAPI, examResultsAPI, leaderboardAPI } from "@/services/api";
import { BarChart3, ClipboardList, Trophy, Target, BookOpen, Clock, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10B981", "#2563EB", "#F59E0B"];

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
        // fetch student's results and leaderboard
        const [resultsRes, lbRes] = await Promise.allSettled([
          examResultsAPI.getMine(),
          leaderboardAPI.get("weekly"),
        ]);

        if (resultsRes.status === "fulfilled") setResults((resultsRes.value?.data || []).filter((r: any) => String(r.studentId) === String(user?.id || (user as any)?._id)));
        if (lbRes.status === "fulfilled") setLeaderboard(lbRes.value?.data || []);

        // fetch exams: try getMine(), but also fall back to getAll() so upcoming exams created by teachers/admins appear
        let examsList: any[] = [];
        try {
          const mine = await examsAPI.getMine();
          examsList = mine?.data || [];
        } catch (err) {
          // ignore
        }
        if (!examsList || examsList.length === 0) {
          try {
            const all = await examsAPI.getAll();
            examsList = all?.data || [];
          } catch (err) {
            // ignore
          }
        }
        setExams(examsList || []);
      } catch (e) {
        console.error("Dashboard load error", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  // Summary stats
  const totalGiven = results.length;
  const upcomingExams = useMemo(() => {
    const now = Date.now();
    return exams
      .map((e) => ({
        ...e,
        _start: new Date(e.startTime || e.startAt || e.date || e.scheduledAt || e.start || null),
      }))
      .filter((e) => e._start && e._start.getTime() > now)
      .sort((a, b) => a._start - b._start);
  }, [exams]);

  const pendingResults = results.filter((r) => r.pendingEvaluation).length;

  // current streak: consecutive days with submissions up to today
  const currentStreak = useMemo(() => {
    const dates = Array.from(new Set(results.map((r) => (r.submittedAt ? new Date(r.submittedAt).toISOString().slice(0, 10) : null)).filter(Boolean)));
    dates.sort((a, b) => (a > b ? -1 : 1));
    let streak = 0;
    let day = new Date();
    for (let i = 0; i < 365; i++) {
      const iso = day.toISOString().slice(0, 10);
      if (dates.includes(iso)) streak += 1;
      else break;
      day.setDate(day.getDate() - 1);
    }
    return streak;
  }, [results]);

  // average score
  const avgScore = results.length ? Number((results.reduce((a, r) => a + (Number(r.percentage) || 0), 0) / results.length).toFixed(2)) : 0;

  // Rank
  const myRank = leaderboard.find((l) => String(l.studentId) === String(user?.id || (user as any)?._id))?.rank || "-";

  // Performance per subject
  const subjectAgg: Record<string, { sum: number; count: number }> = {};
  results.forEach((r) => {
    const exam = exams.find((e) => String(e._id || e.id) === String(r.examId));
    const subjectName = exam?.subject?.name || (exam?.subject || "Unknown");
    if (!subjectAgg[subjectName]) subjectAgg[subjectName] = { sum: 0, count: 0 };
    subjectAgg[subjectName].sum += Number(r.percentage) || 0;
    subjectAgg[subjectName].count += 1;
  });
  const performanceData = Object.entries(subjectAgg).map(([k, v]) => ({ subject: k, score: Math.round(v.sum / v.count) }));
  if (performanceData.length === 0) performanceData.push({ subject: "No data", score: 0 });

  // Line chart: last 6 results
  const lastResults = [...results].sort((a, b) => (new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())).slice(0, 6).reverse();
  const lineData = lastResults.map((r, i) => ({ name: r.examTitle || `Exam ${i + 1}`, score: Number(r.percentage) || 0 }));

  // Pie: MCQ vs CQ aggregate
  const mcqTotal = results.reduce((a, r) => a + (Number(r.mcqScore) || 0), 0);
  const cqTotal = results.reduce((a, r) => a + (Number(r.cqAssigned) || 0), 0);
  const pieData = [
    { name: "MCQ", value: mcqTotal },
    { name: "CQ", value: cqTotal },
  ];

  const today = new Date();
  const todayStr = today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  const stats = [
    { label: "Total Exams Given", value: totalGiven, icon: <ClipboardList className="h-5 w-5" /> },
    { label: "Upcoming Exams", value: upcomingExams.length, icon: <Clock className="h-5 w-5" /> },
    { label: "Average Score", value: `${avgScore}%`, icon: <BarChart3 className="h-5 w-5" /> },
    { label: "Pending Results", value: pendingResults, icon: <BookOpen className="h-5 w-5" /> },
    { label: "Current Streak", value: `${currentStreak} days`, icon: <TrendingUp className="h-5 w-5" /> },
  ];

  const recentActivities = [
    ...results.map((r) => ({
      id: r._id || r.id,
      date: r.submittedAt ? new Date(r.submittedAt) : null,
      text: `You submitted "${r.examTitle || 'an exam'}" (${Number(r.percentage || 0).toFixed(0)}%)`,
    })),
  ].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div>
          <h1 className="text-2xl font-display font-bold">👋 Welcome back, {user?.name?.split(" ")[0] || 'Student'}</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-sm opacity-90">{todayStr}</div>
            <div className="text-sm opacity-80">Ready for your next challenge?</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-foreground">{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <div>
          <Card>
            <CardHeader><CardTitle className="text-lg">Performance Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={60} label>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 text-sm text-muted-foreground">MCQ vs CQ (aggregate)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Performance (beside Performance Overview) */}
        <div>
          <Card>
            <CardHeader><CardTitle className="text-lg">Subject Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="subject" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="score" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Exams (full width under performance) */}
      <div>
        <Card>
          <CardHeader><CardTitle className="text-lg">Upcoming Exams</CardTitle></CardHeader>
          <CardContent>
            {upcomingExams.length === 0 && <p className="text-sm text-muted-foreground">No upcoming exams.</p>}
            <div className="space-y-3">
              {upcomingExams.slice(0, 12).map((ex) => {
                // robust parsing for start time
                const possible = ex.startTime || ex.startAt || ex.start || ex.date || ex.scheduledAt || ex.startDate || ex.startsAt || ex.starts_at;
                const start = possible ? new Date(possible) : (ex._start || null);
                if (!start) return null;
                const now = Date.now();
                const startsInMs = start.getTime() - now;
                const startsInDays = Math.ceil(startsInMs / (1000 * 60 * 60 * 24));
                return (
                  <div key={ex._id || ex.id} className="flex items-center justify-between p-3 rounded-lg bg-card">
                    <div>
                      <p className="text-sm font-medium">{ex.title || ex.name}</p>
                      <p className="text-xs text-muted-foreground">{start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      {startsInMs <= 0 ? (
                        <span className="inline-flex items-center gap-2 text-sm text-destructive">🔴 Live Now</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">Starts in {startsInDays} day{startsInDays>1?'s':''}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
            {recentActivities.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center text-foreground">●</div>
                <div>
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.date ? a.date.toLocaleString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
