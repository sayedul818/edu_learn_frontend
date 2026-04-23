import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { coursesAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentCourse } from "@/contexts/StudentCourseContext";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const Leaderboard = () => {
  const { user } = useAuth();
  const { courses: enrolledCourses, selectedCourseId, setSelectedCourseId } = useStudentCourse();
  const [courseTimeRange, setCourseTimeRange] = useState<"weekly" | "monthly" | "all">("weekly");
  const [courseScoreType, setCourseScoreType] = useState<"overall" | "exams" | "assignments">("overall");
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseLeaderboardData, setCourseLeaderboardData] = useState<any>(null);

  useEffect(() => {
    const loadCourseLeaderboard = async () => {
      if (!selectedCourseId) {
        setCourseLeaderboardData(null);
        return;
      }
      try {
        setCourseLoading(true);
        const res = await coursesAPI.getCourseLeaderboard(selectedCourseId, {
          timeRange: courseTimeRange,
          type: courseScoreType,
        });
        setCourseLeaderboardData(res?.data || null);
      } catch (error) {
        console.error("Failed to load course leaderboard", error);
        setCourseLeaderboardData(null);
      } finally {
        setCourseLoading(false);
      }
    };

    loadCourseLeaderboard();
  }, [selectedCourseId, courseTimeRange, courseScoreType]);

  const currentUserId = String(user?.id || (user as any)?._id || "");
  const courseRows = Array.isArray(courseLeaderboardData?.rows) ? courseLeaderboardData.rows : [];
  const courseTop3 = Array.isArray(courseLeaderboardData?.top3) ? courseLeaderboardData.top3 : [];
  const myCourseRow = courseRows.find((item: any) => String(item.studentId) === currentUserId);
  const selectedCourse = enrolledCourses.find((item) => String(item.courseId) === String(selectedCourseId));

  const listVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.03 } }),
  };

  return (
    <div className="space-y-6 font-bangla">
      <div className="rounded-2xl border border-slate-300 bg-slate-100 p-5 shadow-xl dark:border-cyan-500/20 dark:bg-slate-900">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-400 bg-slate-200/50 px-4 py-2 dark:border-cyan-500/30 dark:bg-cyan-500/10">
          <Trophy className="h-4 w-4 text-slate-600 dark:text-cyan-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-cyan-300">Course-wise Leaderboard</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Course-based rankings only</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-4 w-4" /> Course-wise Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Select enrolled course</p>
              <p className="text-xs text-muted-foreground">This ranking mirrors the teacher course leaderboard model.</p>
            </div>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="min-w-[240px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {enrolledCourses.length === 0 ? (
                <option value="">No enrolled courses</option>
              ) : (
                enrolledCourses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.courseTitle}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              { key: "weekly", label: "Weekly" },
              { key: "monthly", label: "Monthly" },
              { key: "all", label: "All-time" },
            ] as const).map((option) => (
              <button
                key={option.key}
                onClick={() => setCourseTimeRange(option.key)}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${courseTimeRange === option.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {option.label}
              </button>
            ))}
            {([
              { key: "overall", label: "Overall" },
              { key: "exams", label: "Exams only" },
              { key: "assignments", label: "Assignments only" },
            ] as const).map((option) => (
              <button
                key={option.key}
                onClick={() => setCourseScoreType(option.key)}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${courseScoreType === option.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {myCourseRow ? (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
              You are ranked <span className="font-bold">#{myCourseRow.rank}</span> out of <span className="font-bold">{courseRows.length}</span> students in <span className="font-semibold">{selectedCourse?.courseTitle || courseLeaderboardData?.courseTitle || "this course"}</span>.
            </div>
          ) : null}

          {courseLoading ? (
            <div className="rounded-xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Loading course leaderboard...</div>
          ) : !selectedCourseId ? (
            <div className="rounded-xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Enroll in a course to see course-wise leaderboard.</div>
          ) : courseRows.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">No ranking data yet for this course.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {[1, 0, 2].map((positionIndex) => {
                  const row = courseTop3[positionIndex];
                  if (!row) return <div key={`course-top-empty-${positionIndex}`} className="hidden md:block" />;
                  const place = Number(row.rank || 0);
                  const isChampion = place === 1;
                  return (
                    <div
                      key={`course-top-${row.studentId}`}
                      className={`rounded-2xl border p-4 text-center ${isChampion ? "md:scale-105 border-amber-300 bg-amber-50/80 dark:border-amber-600/40 dark:bg-amber-500/10" : "border-border bg-card"}`}
                    >
                      <p className="text-xs font-semibold text-muted-foreground">{place === 1 ? "1st Place" : place === 2 ? "2nd Place" : "3rd Place"}</p>
                      <Avatar className="mx-auto mt-3 h-14 w-14 border border-border/70">
                        <AvatarImage src={row.avatar || ""} alt={row.studentName || "Student"} />
                        <AvatarFallback>{String(row.studentName || "S").slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="mt-3 text-sm font-semibold">{row.studentName}</p>
                      <p className="text-xs text-muted-foreground">Score {Number(row.score || 0).toFixed(1)}</p>
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">Rank #{row.rank}</span>
                        {place === 1 && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Top Performer</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Course Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courseRows.map((entry: any, idx: number) => (
                      <motion.div
                        key={String(entry.studentId)}
                        custom={idx}
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${String(entry.studentId) === currentUserId ? "border-primary/30 bg-primary/10" : "border-border bg-card"}`}
                      >
                        <span className="w-8 text-center font-bold text-muted-foreground">#{entry.rank}</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.avatar || ""} alt={entry.studentName || "Student"} />
                          <AvatarFallback>{String(entry.studentName || "S").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{entry.studentName} {String(entry.studentId) === currentUserId && <span className="text-xs text-primary">(You)</span>}</p>
                          <p className="text-xs text-muted-foreground">Assignments: {entry.completedAssignments} | Exams: {entry.examsGiven} | Accuracy: {Number(entry.accuracy || 0).toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">{Number(entry.score || 0).toFixed(1)}</p>
                          <p className="text-[11px] text-muted-foreground">Score</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;