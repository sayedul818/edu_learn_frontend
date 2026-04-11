import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { examResultsAPI, leaderboardAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Medal, Award, Sparkles, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LeaderboardRange = {
  label: string;
  comparisonLabel: string;
  current: { start: string; end: string };
  previous: { start: string; end: string };
};

const Leaderboard = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [previousData, setPreviousData] = useState<any[]>([]);
  const [attemptedExams, setAttemptedExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [examLoading, setExamLoading] = useState(false);
  const [examLeaderboard, setExamLeaderboard] = useState<any[]>([]);
  const [examParticipantCount, setExamParticipantCount] = useState(0);

  const monthLabel = (() => {
    const [year, monthNumber] = month.split("-").map(Number);
    if (!year || !monthNumber) return month;
    return new Date(year, monthNumber - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  })();

  const leaderboardRange = (): LeaderboardRange => {
    const now = new Date();

    if (period === "daily") {
      const currentEnd = new Date(now);
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 1);

      const previousEnd = new Date(currentStart);
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 1);

      return {
        label: "Today",
        comparisonLabel: "Previous day",
        current: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
        previous: { start: previousStart.toISOString(), end: previousEnd.toISOString() },
      };
    }

    if (period === "weekly") {
      const currentEnd = new Date(now);
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);

      const previousEnd = new Date(currentStart);
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);

      return {
        label: "This week",
        comparisonLabel: "Previous week",
        current: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
        previous: { start: previousStart.toISOString(), end: previousEnd.toISOString() },
      };
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const currentStartDate = new Date(year, monthNumber - 1, 1);
    const currentEndDate = new Date(year, monthNumber, 1);
    const previousStartDate = new Date(year, monthNumber - 2, 1);
    const previousEndDate = new Date(year, monthNumber - 1, 1);

    return {
      label: monthLabel,
      comparisonLabel: "Previous month",
      current: { start: currentStartDate.toISOString(), end: currentEndDate.toISOString() },
      previous: { start: previousStartDate.toISOString(), end: previousEndDate.toISOString() },
    };
  };

  const normalizeRows = (rows: any[]) => {
    const processed = (rows || []).map((row: any) => ({ ...row, avgPercentage: Number(row.avgPercentage) || 0 }));
    processed.sort((a: any, b: any) => b.avgPercentage - a.avgPercentage);

    let lastAvg: number | null = null;
    let denseRank = 0;

    for (const row of processed) {
      if (lastAvg === null || row.avgPercentage !== lastAvg) {
        denseRank += 1;
        lastAvg = row.avgPercentage;
      }
      row.rank = denseRank;
    }

    return processed;
  };

  const normalizeExamRows = (rows: any[]) => {
    const processed = (rows || [])
      .map((row: any) => ({
        ...row,
        score: Number(row.score) || 0,
        percentage: row.percentage == null ? null : Number(row.percentage) || 0,
      }))
      .filter((row: any) => row.percentage != null);

    processed.sort((a: any, b: any) => b.percentage - a.percentage || b.score - a.score);

    let lastPercentage: number | null = null;
    let denseRank = 0;

    for (const row of processed) {
      if (lastPercentage === null || row.percentage !== lastPercentage) {
        denseRank += 1;
        lastPercentage = row.percentage;
      }
      row.rank = denseRank;
    }

    return processed;
  };

  const shiftMonth = (delta: number) => {
    setMonth((current) => {
      const [year, monthNumber] = current.split("-").map(Number);
      const date = new Date(year, monthNumber - 1 + delta, 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    });
  };

  const rankIcons: Record<number, ReactNode> = {
    1: <Trophy className="h-6 w-6 text-warning" />,
    2: <Medal className="h-6 w-6 text-muted-foreground" />,
    3: <Award className="h-6 w-6 text-amber-700" />,
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const range = leaderboardRange();
        const [currentRes, previousRes] = await Promise.all([
          leaderboardAPI.getWithRange({ period, start: range.current.start, end: range.current.end, ...(period === "monthly" ? { month } : {}) }),
          leaderboardAPI.getWithRange({ period, start: range.previous.start, end: range.previous.end, ...(period === "monthly" ? { month } : {}) }),
        ]);

        setData(normalizeRows(currentRes.data || []));
        setPreviousData(normalizeRows(previousRes.data || []));
      } catch (error) {
        console.error("Failed to load leaderboard", error);
        setData([]);
        setPreviousData([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [period, month]);

  useEffect(() => {
    const loadAttemptedExams = async () => {
      try {
        const res = await examResultsAPI.getMine();
        const results = Array.isArray(res?.data) ? res.data : [];
        const examMap = new Map<string, any>();

        results.forEach((result: any) => {
          const exam = result.examId;
          const examId = String(exam?._id || exam || "");
          if (!examId) return;
          if (!examMap.has(examId)) {
            examMap.set(examId, {
              _id: examId,
              title: exam?.title || exam?.examName || exam?.name || "Untitled exam",
              submittedAt: result.submittedAt || null,
            });
          }
        });

        const examList = Array.from(examMap.values()).sort((a, b) => {
          const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return bTime - aTime;
        });

        setAttemptedExams(examList);
        if (!selectedExamId && examList.length > 0) {
          setSelectedExamId(examList[0]._id);
        }
      } catch (error) {
        console.error("Failed to load attempted exams", error);
        setAttemptedExams([]);
      }
    };

    loadAttemptedExams();
  }, []);

  useEffect(() => {
    const loadExamLeaderboard = async () => {
      if (!selectedExamId) {
        setExamLeaderboard([]);
        setExamParticipantCount(0);
        return;
      }

      try {
        setExamLoading(true);
        const res = await examResultsAPI.getByExam(selectedExamId);
        const rows = Array.isArray(res?.data) ? res.data : [];
        setExamParticipantCount(rows.length);
        setExamLeaderboard(normalizeExamRows(rows));
      } catch (error) {
        console.error("Failed to load exam leaderboard", error);
        setExamLeaderboard([]);
        setExamParticipantCount(0);
      } finally {
        setExamLoading(false);
      }
    };

    loadExamLeaderboard();
  }, [selectedExamId]);

  const currentUserId = String(user?.id || (user as any)?._id || "");
  const currentRank = data.find((item) => String(item.studentId) === currentUserId)?.rank || "-";
  const previousRank = previousData.find((item) => String(item.studentId) === currentUserId)?.rank || "-";
  const selectedExam = attemptedExams.find((exam) => String(exam._id) === selectedExamId);
  const currentExamRank = examLeaderboard.find((item) => String(item.studentId?._id || item.studentId) === currentUserId)?.rank || "-";

  const listVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.03 } }),
  };

  return (
    <div className="space-y-6 font-bangla">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/60 p-5 md:p-6">
        <div className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Student Rankings
          </p>
          <h1 className="mt-3 text-2xl font-display font-bold text-foreground">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">See how you rank against other students</p>
        </div>
      </div>

      <Tabs defaultValue="overall" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overall">Overall Leaderboard</TabsTrigger>
          <TabsTrigger value="exam-wise">Exam-wise Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-6">
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  period === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          {period === "monthly" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Month view</p>
                <p className="text-xs text-muted-foreground">Showing rankings for {monthLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftMonth(-1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous month
                </button>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => shiftMonth(1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Next month <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Your {leaderboardRange().label.toLowerCase()} comparison</p>
                <p className="text-xs text-muted-foreground">
                  This period rank: #{currentRank} | {leaderboardRange().comparisonLabel} rank: #{previousRank}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentRank !== "-" && previousRank !== "-" && typeof currentRank === "number" && typeof previousRank === "number"
                  ? currentRank < previousRank
                    ? `Moved up ${previousRank - currentRank} places`
                    : currentRank > previousRank
                      ? `Moved down ${currentRank - previousRank} places`
                      : "No rank change"
                  : "No previous period data available"}
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="rounded-xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Loading leaderboard...</div>
          ) : (
            <>
              <div className="relative flex justify-center">
                {data[0] ? (
                  <>
                    <Confetti active />
                    <motion.div custom={0} variants={listVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.02 }} className="w-full text-center sm:w-1/2 lg:w-1/3">
                      <Card>
                        <CardContent className="p-6">
                          <div className="mb-3">{rankIcons[data[0].rank]}</div>
                          <Avatar className="mx-auto h-20 w-20 border border-border/60 shadow-lg">
                            <AvatarImage src={data[0]?.avatar || ""} alt={data[0]?.name || "Student"} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl font-bold text-white">
                              {data[0].name ? String(data[0].name).charAt(0) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="mt-3 text-base font-medium">{data[0].name}</p>
                          <div className="mt-3">
                            <motion.span
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.12 }}
                              className="text-3xl font-display font-bold text-emerald-600"
                            >
                              {Number(data[0].avgPercentage).toFixed(2)}%
                            </motion.span>
                            <p className="text-xs text-muted-foreground">average</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </>
                ) : null}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Full Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.map((entry, idx) => (
                      <motion.div
                        key={String(entry.studentId)}
                        custom={idx}
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.01 }}
                        className={`flex items-center gap-4 rounded-lg p-3 transition-shadow ${String(entry.studentId) === String(user?.id || (user as any)?._id) ? "border border-primary/30 bg-primary/10 shadow-md" : "bg-muted/30 hover:shadow-sm"}`}
                      >
                        <span className={`w-10 text-center text-lg font-display font-bold ${entry.rank <= 3 ? "text-warning" : "text-muted-foreground"}`}>
                          #{entry.rank}
                        </span>
                        <Avatar className="h-9 w-9 border border-border/60 shadow-sm">
                          <AvatarImage src={entry?.avatar || ""} alt={entry?.name || "Student"} />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-300 to-teal-400 text-sm font-bold text-white">
                            {entry.name ? String(entry.name).charAt(0) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {entry.name} {String(entry.studentId) === String(user?.id || (user as any)?._id) && <span className="text-xs text-primary">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.examsCompleted} exams</p>
                        </div>
                        <div className="text-right">
                          <motion.span
                            initial={{ x: 6, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.02 * idx }}
                            className="text-2xl font-display font-bold text-emerald-600"
                          >
                            {Number(entry.avgPercentage).toFixed(2)}%
                          </motion.span>
                          <p className="text-xs text-muted-foreground">average</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="exam-wise" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-4 w-4" /> Exam-wise Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Choose an exam you attended</p>
                  <p className="text-xs text-muted-foreground">Showing rankings when an exam has at least 1 participant.</p>
                </div>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="min-w-[240px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {attemptedExams.length === 0 ? (
                    <option value="">No attempted exams</option>
                  ) : (
                    attemptedExams.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {exam.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedExam ? (
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{selectedExam.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Participants: {examParticipantCount} | Your rank: #{currentExamRank}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {examParticipantCount >= 1 ? "Leaderboard available" : "No participants yet"}
                    </div>
                  </div>

                  {examLoading ? (
                    <div className="py-6 text-sm text-muted-foreground">Loading exam leaderboard...</div>
                  ) : examParticipantCount >= 1 ? (
                    <div className="mt-4 space-y-2">
                      {examLeaderboard.slice(0, 10).map((entry, idx) => {
                        const studentName = entry.studentId?.name || entry.studentId?.email || entry.name || "Student";
                        const studentId = String(entry.studentId?._id || entry.studentId || "");
                        return (
                          <div
                            key={studentId || idx}
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${studentId === currentUserId ? "border-primary/30 bg-primary/10" : "border-border bg-card"}`}
                          >
                            <span className="w-8 text-center font-bold text-muted-foreground">#{entry.rank}</span>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.studentId?.avatar || ""} alt={studentName} />
                              <AvatarFallback>{studentName ? String(studentName).charAt(0) : "?"}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {studentName} {studentId === currentUserId && <span className="text-xs text-primary">(You)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">Score: {Number(entry.score || 0).toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600">{Number(entry.percentage || 0).toFixed(2)}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-sm text-muted-foreground">This exam does not have enough participants yet to show an exam leaderboard.</div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-sm text-muted-foreground">Take an exam first to see the exam-wise leaderboard.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Confetti = ({ active = true }: { active?: boolean }) => {
  const [pieces] = useState(() => {
    const colors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];
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
      <div className="relative h-40 w-full overflow-visible">
        <style>{`@keyframes confettiFall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1 } 100% { transform: translateY(160px) rotate(360deg); opacity: 0 } }`}</style>
        {pieces.map((piece, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${piece.left}%`,
              top: "-8px",
              width: piece.size,
              height: piece.size * 0.6,
              background: piece.color,
              transform: `rotate(${piece.rotate}deg)`,
              borderRadius: 2,
              animation: `confettiFall ${piece.duration}s ${piece.delay}s forwards cubic-bezier(.2,.8,.2,1)`,
            }}
            className="z-50"
          />
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;