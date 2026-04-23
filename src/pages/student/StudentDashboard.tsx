import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentCourse } from "@/contexts/StudentCourseContext";
import { useEffect, useMemo, useState } from "react";
import { coursesAPI, examsAPI, examResultsAPI } from "@/services/api";
import {
  Flame,
  Gauge,
  BookOpen,
  ClipboardList,
  Trophy,
  ArrowRight,
  Rocket,
  Target,
  Zap,
  CircleDashed,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { percentageToGrade } from "@/lib/utils";

type ExamLike = Record<string, any>;
type ResultLike = Record<string, any>;

const getExamDate = (exam: ExamLike) => {
  const direct = exam.startAt || exam.start || exam.date || exam.scheduledAt;
  if (direct) {
    const parsed = new Date(direct);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (exam.startDate) {
    const day = new Date(exam.startDate);
    if (Number.isNaN(day.getTime())) return null;
    if (!exam.startTime) return day;

    const dayStr = day.toISOString().slice(0, 10);
    const parsed = new Date(`${dayStr}T${exam.startTime}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return day;
  }

  return null;
};

const asPercent = (value: unknown) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

const readField = (value: unknown, key: string) => {
  if (!value || typeof value !== "object") return undefined;
  return (value as Record<string, unknown>)[key];
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const { selectedCourseId, selectedCourseExamIds } = useStudentCourse();
  const [exams, setExams] = useState<ExamLike[]>([]);
  const [results, setResults] = useState<ResultLike[]>([]);
  const [courseLeaderboardRows, setCourseLeaderboardRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [resultsRes, examsRes] = await Promise.allSettled([
          examResultsAPI.getMine(),
          examsAPI.getMine(),
        ]);

        if (resultsRes.status === "fulfilled") {
          setResults(resultsRes.value?.data || []);
        }

        let examsList: ExamLike[] = [];
        if (examsRes.status === "fulfilled") {
          examsList = examsRes.value?.data || [];
        }
        if (examsList.length === 0) {
          try {
            const fallback = await examsAPI.getAll();
            examsList = fallback?.data || [];
          } catch {
            examsList = [];
          }
        }
        setExams(examsList);
      } catch (error) {
        console.error("Student dashboard load failed", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  useEffect(() => {
    const loadCourseRankings = async () => {
      if (!selectedCourseId) {
        setCourseLeaderboardRows([]);
        return;
      }
      try {
        const res = await coursesAPI.getCourseLeaderboard(selectedCourseId, { timeRange: "weekly", type: "overall" });
        setCourseLeaderboardRows(Array.isArray(res?.data?.rows) ? res.data.rows : []);
      } catch {
        setCourseLeaderboardRows([]);
      }
    };

    loadCourseRankings();
  }, [selectedCourseId]);

  const userId = String(user?.id || (user as any)?._id || "");

  const scopedExamIdSet = useMemo(
    () => new Set((selectedCourseExamIds || []).map((id) => String(id))),
    [selectedCourseExamIds]
  );

  const scopedExams = useMemo(() => {
    if (!selectedCourseId) return exams;
    if (!scopedExamIdSet.size) return [];
    return exams.filter((exam) => scopedExamIdSet.has(String((exam as any)._id || (exam as any).id || "")));
  }, [exams, scopedExamIdSet, selectedCourseId]);

  const scopedResults = useMemo(() => {
    if (!selectedCourseId) return results;
    if (!scopedExamIdSet.size) return [];
    return results.filter((result) => {
      const examId = String((result as any).examId?._id || (result as any).examId || (result as any).exam || "");
      return scopedExamIdSet.has(examId);
    });
  }, [results, scopedExamIdSet, selectedCourseId]);

  const myRank = useMemo(() => {
    const courseRank = courseLeaderboardRows.find((item) => String(item.studentId) === userId)?.rank;
    return courseRank || "-";
  }, [courseLeaderboardRows, userId]);

  const avgScore = useMemo(() => {
    if (!scopedResults.length) return 0;
    const sum = scopedResults.reduce((acc, result) => acc + asPercent(result.percentage), 0);
    return Number((sum / scopedResults.length).toFixed(1));
  }, [scopedResults]);

  const totalStudySeconds = useMemo(() => {
    return scopedResults.reduce((acc, result) => acc + (Number(result.timeTaken) || 0), 0);
  }, [scopedResults]);

  const studyTimeLabel = useMemo(() => {
    if (!totalStudySeconds) return "0m";
    const totalMinutes = Math.round(totalStudySeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }, [totalStudySeconds]);

  const currentStreak = useMemo(() => {
    const daySet = new Set(
      scopedResults
        .map((result) => {
          if (!result.submittedAt) return null;
          const d = new Date(result.submittedAt);
          if (Number.isNaN(d.getTime())) return null;
          return d.toISOString().slice(0, 10);
        })
        .filter(Boolean) as string[]
    );

    if (!daySet.size) return 0;
    let streak = 0;
    const day = new Date();

    for (let i = 0; i < 365; i += 1) {
      const iso = day.toISOString().slice(0, 10);
      if (!daySet.has(iso)) break;
      streak += 1;
      day.setDate(day.getDate() - 1);
    }

    return streak;
  }, [scopedResults]);

  const examLookup = useMemo(() => {
    const map = new Map<string, ExamLike>();
    scopedExams.forEach((exam) => {
      const key = String(exam._id || exam.id);
      if (key) map.set(key, exam);
    });
    return map;
  }, [scopedExams]);

  const timelineData = useMemo(() => {
    const last7 = [...scopedResults]
      .sort((a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime())
      .slice(-7);

    return last7.map((result, idx) => {
      const submitted = result.submittedAt ? new Date(result.submittedAt) : null;
      const label = submitted ? submitted.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `R${idx + 1}`;
      return {
        day: label,
        engagement: asPercent(result.percentage),
      };
    });
  }, [scopedResults]);

  const upcomingExams = useMemo(() => {
    const now = Date.now();
    return scopedExams
      .map((exam) => ({ ...exam, _startAt: getExamDate(exam) }))
      .filter((exam) => exam._startAt && exam._startAt.getTime() > now)
      .sort((a, b) => (a._startAt?.getTime() || 0) - (b._startAt?.getTime() || 0));
  }, [scopedExams]);

  const subjectRows = useMemo(() => {
    const subjectStat: Record<string, { scoreSum: number; count: number }> = {};

    scopedResults.forEach((result) => {
      const examId = String(result.examId?._id || result.examId || "");
      const exam = examLookup.get(examId) || (typeof result.examId === "object" ? result.examId : null);

      const subjectName =
        exam?.subjectId?.name ||
        exam?.subject?.name ||
        (typeof exam?.subjectId === "string" ? "Subject" : null) ||
        "General";

      if (!subjectStat[subjectName]) {
        subjectStat[subjectName] = { scoreSum: 0, count: 0 };
      }

      subjectStat[subjectName].scoreSum += asPercent(result.percentage);
      subjectStat[subjectName].count += 1;
    });

    return Object.entries(subjectStat)
      .map(([subject, value]) => ({
        subject,
        progress: Number((value.scoreSum / value.count).toFixed(1)),
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 8);
  }, [examLookup, scopedResults]);

  const pendingEvaluation = scopedResults.filter((result) => !!result.pendingEvaluation).length;

  const recentActivities = useMemo(() => {
    return [...scopedResults]
      .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
      .slice(0, 6)
      .map((result) => {
        const exam = examLookup.get(String(result.examId?._id || result.examId || "")) || (typeof result.examId === "object" ? result.examId : null);
        const examTitle = exam?.title || result.examTitle || "Exam";
        const percentage = asPercent(result.percentage);
        const xpEarned = Math.max(5, Math.round(percentage / 4));

        return {
          id: String(result._id || result.id),
          title: examTitle,
          subtitle: `${percentage}% (${percentageToGrade(percentage)})`,
          time: result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "",
          xpEarned,
        };
      });
  }, [examLookup, scopedResults]);

  const missionCards = useMemo(() => {
    const missions: Array<{ id: string; title: string; progressLabel: string; progress: number; rewardXp: number; rewardCoins: number }> = [];

    if (upcomingExams[0]) {
      const next = upcomingExams[0];
      missions.push({
        id: String(readField(next, "_id") || readField(next, "id") || "next-exam"),
        title: `Attempt ${readField(next, "title") || "next exam"}`,
        progressLabel: "Progress: 0/1",
        progress: 0,
        rewardXp: 25,
        rewardCoins: 5,
      });
    }

    if (scopedResults.length) {
      missions.push({
        id: "accuracy-mission",
        title: "Push average accuracy to 80%",
        progressLabel: `Progress: ${Math.round(avgScore)}/80`,
        progress: Math.min(100, (avgScore / 80) * 100),
        rewardXp: 20,
        rewardCoins: 4,
      });
    }

    if (currentStreak < 7) {
      missions.push({
        id: "streak-mission",
        title: "Build a 7 day streak",
        progressLabel: `Progress: ${currentStreak}/7`,
        progress: Math.min(100, (currentStreak / 7) * 100),
        rewardXp: 15,
        rewardCoins: 2,
      });
    }

    return missions.slice(0, 3);
  }, [avgScore, currentStreak, scopedResults.length, upcomingExams]);

  const currentWeekLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/60 p-5">
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
              <Rocket className="h-3.5 w-3.5" /> Student Dashboard
            </p>
            <h1 className="mt-3 text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">{currentWeekLabel} · Welcome back, {user?.name?.split(" ")[0] || "Student"}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
            <Trophy className="h-3.5 w-3.5" />
            Rank {myRank}
          </div>
        </div>
      </div>

      <Card className="border-border/70">
        <CardContent className="p-3 md:p-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
            <Link to="/self-test" className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-center text-xs text-foreground transition-colors hover:bg-muted/40 md:text-sm">
              <Target className="mx-auto mb-1 h-4 w-4 text-primary" />
              Practice
            </Link>
            <Link to="/questions" className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-center text-xs text-foreground transition-colors hover:bg-muted/40 md:text-sm">
              <BookOpen className="mx-auto mb-1 h-4 w-4 text-primary" />
              Question Bank
            </Link>
            <Link to="/leaderboard" className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-center text-xs text-foreground transition-colors hover:bg-muted/40 md:text-sm">
              <Trophy className="mx-auto mb-1 h-4 w-4 text-primary" />
              Leaderboard
            </Link>
            <Link to="/exams" className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-center text-xs text-foreground transition-colors hover:bg-muted/40 md:text-sm">
              <ClipboardList className="mx-auto mb-1 h-4 w-4 text-primary" />
              Exams
            </Link>
            <Link to="/results" className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-center text-xs text-foreground transition-colors hover:bg-muted/40 md:text-sm">
              <Gauge className="mx-auto mb-1 h-4 w-4 text-primary" />
              Results
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-border/70">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Study Time</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{studyTimeLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">Across {results.length} submitted exams</p>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Accuracy</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{avgScore}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Grade {percentageToGrade(avgScore)}</p>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Exams Taken</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{results.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Pending evaluation: {pendingEvaluation}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Your Engagement</CardTitle>
              </CardHeader>
              <CardContent className="h-56 pb-4">
                {timelineData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No activity yet. Start an exam to see engagement trend.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Current Streak</CardTitle>
                  <Flame className="h-4 w-4 text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-orange-400/20 bg-orange-500/10 p-3">
                  <p className="text-3xl font-semibold text-foreground">{currentStreak}</p>
                  <p className="text-sm text-muted-foreground">day{currentStreak === 1 ? "" : "s"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Practice at least one MCQ daily to keep streak alive.</p>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Live Exams</span>
                    <span className="font-medium text-foreground">{exams.filter((exam) => exam.userStatus === "live").length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Upcoming Exams</span>
                    <span className="font-medium text-foreground">{upcomingExams.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Missions</CardTitle>
                <Rocket className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {missionCards.length ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {missionCards.map((mission) => (
                    <div key={mission.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{mission.title}</p>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">Daily</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{mission.progressLabel}</p>
                      <Progress className="mt-2 h-2 bg-muted" value={mission.progress} />
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-amber-400" />{mission.rewardXp} XP</span>
                        <span className="inline-flex items-center gap-1"><CircleDashed className="h-3 w-3 text-orange-400" />{mission.rewardCoins} Coins</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active mission yet.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Subjects Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {subjectRows.length ? (
                  subjectRows.map((row) => (
                    <div key={row.subject} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-foreground">{row.subject}</span>
                        <span className="font-medium text-primary">{row.progress}%</span>
                      </div>
                      <Progress className="h-2 bg-muted" value={row.progress} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No subject progress found yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Activities</CardTitle>
                  <Link to="/results" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivities.length ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{activity.time}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">+{activity.xpEarned} XP</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>

      {loading ? <p className="text-xs text-muted-foreground">Refreshing dashboard...</p> : null}
    </div>
  );
};

export default StudentDashboard;
