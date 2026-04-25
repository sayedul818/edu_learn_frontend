import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Sparkles, Target, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { coursesAPI } from "@/services/api";

interface StudentPerformanceData {
  course?: { _id: string; title: string };
  enrollment?: { _id: string; enrollmentDate?: string; status?: string; createdAt?: string };
  student?: { _id: string; name: string; email: string; status?: string; avatar?: string };
  performance?: {
    totalExams: number;
    completedExams: number;
    averagePercentage: number;
    lastActivityAt?: string;
    weakAreas?: Array<{ category: string; label: string; incorrectCount: number; attempts: number }>;
    results: Array<{
      examId: string;
      examTitle: string;
      score: number | null;
      totalMarks: number;
      percentage: number | null;
      submittedAt?: string;
      pendingEvaluation?: boolean;
      weakAreas?: Array<{ category: string; label: string; incorrectCount: number; attempts: number }>;
    }>;
    assignments?: {
      totalAssignments: number;
      submittedAssignments: number;
      assignmentAveragePercentage: number;
      assignmentCompletionRate: number;
      items: Array<{
        assignmentId: string;
        title: string;
        dueAt?: string;
        status: "submitted" | "pending" | "late";
        score: number | null;
        totalMarks: number;
        percentage: number | null;
        submittedAt?: string | null;
        feedback?: string;
      }>;
    };
  };
}

const TeacherStudentPerformance = () => {
  const { courseId = "", studentId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentPerformanceData | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!courseId || !studentId) return;
      setLoading(true);
      try {
        const res = await coursesAPI.getStudentPerformance(courseId, studentId);
        setData(res?.data || null);
      } catch (error: any) {
        toast({
          title: "Failed to load performance",
          description: error?.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId, studentId, toast]);

  const weakAreas = useMemo(() => data?.performance?.weakAreas || [], [data?.performance?.weakAreas]);
  const student = data?.student;
  const performance = data?.performance;

  const totalAttempts = performance?.results?.length || 0;
  const averageScore = performance?.averagePercentage ?? 0;
  const completedExams = performance?.completedExams ?? 0;
  const totalExams = performance?.totalExams ?? 0;
  const assignmentPerf = performance?.assignments;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/60 p-5 text-foreground shadow-lg md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Button variant="glass" size="sm" onClick={() => navigate(`/teacher/courses/${courseId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border border-black/15 dark:border-white/20">
                <AvatarImage src={student?.avatar || ""} alt={student?.name || "Student"} />
                <AvatarFallback>{student?.name?.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-white/60">Performance View</p>
                <h1 className="text-2xl font-semibold md:text-3xl">{student?.name || "Student performance"}</h1>
                <p className="text-sm text-muted-foreground dark:text-white/70">{student?.email || "Email unavailable"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 backdrop-blur dark:border-white/15 dark:bg-white/10">
              <p className="text-xs text-muted-foreground dark:text-white/60">Average Score</p>
              <p className="text-2xl font-semibold">{averageScore}%</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 backdrop-blur dark:border-white/15 dark:bg-white/10">
              <p className="text-xs text-muted-foreground dark:text-white/60">Completed</p>
              <p className="text-2xl font-semibold">{completedExams}/{totalExams}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 backdrop-blur dark:border-white/15 dark:bg-white/10">
              <p className="text-xs text-muted-foreground dark:text-white/60">Attempts</p>
              <p className="text-2xl font-semibold">{totalAttempts}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 backdrop-blur dark:border-white/15 dark:bg-white/10">
              <p className="text-xs text-muted-foreground dark:text-white/60">Weak Areas</p>
              <p className="text-2xl font-semibold">{weakAreas.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Joined Date</p>
            <p className="mt-1 font-semibold">{data?.enrollment?.enrollmentDate ? new Date(data.enrollment.enrollmentDate).toLocaleDateString() : "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Last Activity</p>
            <p className="mt-1 font-semibold">{performance?.lastActivityAt ? new Date(performance.lastActivityAt).toLocaleString() : "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Weakest Category</p>
            <p className="mt-1 font-semibold">{weakAreas[0]?.label || "No weak areas yet"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4" /> Weak Areas
              </div>
              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading performance...</p>
                ) : weakAreas.length > 0 ? (
                  weakAreas.map((area) => {
                    const ratio = area.attempts > 0 ? Math.max(8, Math.min(100, Math.round((area.incorrectCount / area.attempts) * 100))) : 0;
                    return (
                      <div key={`${area.category}-${area.label}`} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">{area.category}</span>
                              <p className="font-semibold">{area.label}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{area.incorrectCount} incorrect out of {area.attempts} checked</p>
                          </div>
                          <div className="flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-medium">
                            <Target className="h-3.5 w-3.5" /> {ratio}% weak
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" style={{ width: `${ratio}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                    No weak areas yet. This fills after graded MCQ attempts are available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading exam attempts...</p>
            ) : performance?.results?.length ? (
              performance.results.map((result) => (
                <Card key={result.examId} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="border-b border-border/70 bg-muted/20 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{result.examTitle}</p>
                          <p className="text-xs text-muted-foreground">{result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "Not submitted"}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${result.pendingEvaluation ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"}`}>
                          {result.pendingEvaluation ? "Pending" : "Scored"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-semibold">{result.score == null ? "-" : `${result.score}/${result.totalMarks}`}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Percentage</span>
                        <span className="font-semibold">{result.percentage == null ? "-" : `${result.percentage}%`}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, result.percentage || 0))}%` }} />
                      </div>
                      {result.weakAreas?.length ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {result.weakAreas.slice(0, 3).map((area) => (
                            <span key={`${result.examId}-${area.label}`} className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white">
                              {area.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                No exam attempts yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="mt-1 text-2xl font-semibold">{assignmentPerf?.submittedAssignments ?? 0}/{assignmentPerf?.totalAssignments ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="mt-1 text-2xl font-semibold">{assignmentPerf?.assignmentCompletionRate ?? 0}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="mt-1 text-2xl font-semibold">{assignmentPerf?.assignmentAveragePercentage ?? 0}%</p>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading assignment performance...</p>
          ) : assignmentPerf?.items?.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {assignmentPerf.items.map((item) => {
                const statusClass = item.status === "submitted"
                  ? "bg-emerald-500/15 text-emerald-600"
                  : item.status === "late"
                  ? "bg-orange-500/15 text-orange-600"
                  : "bg-rose-500/15 text-rose-600";

                return (
                  <Card key={item.assignmentId} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="border-b border-border/70 bg-muted/20 px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.dueAt ? new Date(item.dueAt).toLocaleString() : "No due date"}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-semibold">{item.score == null ? "-" : `${item.score}/${item.totalMarks}`}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Percentage</span>
                          <span className="font-semibold">{item.percentage == null ? "-" : `${item.percentage}%`}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, item.percentage || 0))}%` }} />
                        </div>
                        {item.feedback ? <p className="text-xs text-muted-foreground">Feedback: {item.feedback}</p> : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No assignment data yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherStudentPerformance;
