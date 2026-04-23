import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { coursesAPI, examResultsAPI } from "@/services/api";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  FileText,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TimeRange = "7d" | "30d" | "custom";

const toTs = (value: any) => {
  const ts = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ts) ? ts : null;
};

const pct = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;

const startOfDayIso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const StudentReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [courseBundles, setCourseBundles] = useState<any[]>([]);

  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customStart, setCustomStart] = useState<string>(startOfDayIso(30));
  const [customEnd, setCustomEnd] = useState<string>(startOfDayIso(0));

  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [examFilter, setExamFilter] = useState<string>("all");

  const [studentSearch, setStudentSearch] = useState("");
  const [studentSort, setStudentSort] = useState<"rank" | "avg" | "name">("rank");

  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareExamA, setCompareExamA] = useState<string>("none");
  const [compareExamB, setCompareExamB] = useState<string>("none");

  const [assignmentDrill, setAssignmentDrill] = useState<any>(null);
  const [examDrill, setExamDrill] = useState<any>(null);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await coursesAPI.getAll();
        const list = Array.isArray(res?.data) ? res.data : [];
        setCourses(list);
      } catch (error: any) {
        toast({ title: "Failed to load courses", description: error?.message, variant: "destructive" });
      }
    };
    loadCourses();
  }, [toast]);

  useEffect(() => {
    const loadReportData = async () => {
      if (!courses.length) {
        setCourseBundles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const targetCourseIds = selectedCourseId === "all"
          ? courses.map((course) => String(course._id))
          : [selectedCourseId];

        const bundles = await Promise.all(
          targetCourseIds.map(async (courseId) => {
            const [courseRes, assignmentsRes] = await Promise.all([
              coursesAPI.get(courseId),
              coursesAPI.listAssignments(courseId, { status: "all" }),
            ]);

            const courseData = courseRes?.data || {};
            const exams = Array.isArray(courseData?.exams) ? courseData.exams : [];
            const examResultRows = await Promise.all(
              exams.map(async (exam: any) => {
                try {
                  const resultRes = await examResultsAPI.getByExam(String(exam._id));
                  return {
                    examId: String(exam._id),
                    rows: Array.isArray(resultRes?.data) ? resultRes.data : [],
                  };
                } catch {
                  return { examId: String(exam._id), rows: [] };
                }
              })
            );

            return {
              courseId: String(courseData?._id || courseId),
              courseTitle: String(courseData?.title || "Course"),
              students: Array.isArray(courseData?.students) ? courseData.students : [],
              assignments: Array.isArray(assignmentsRes?.data) ? assignmentsRes.data : [],
              exams,
              examResultRows,
            };
          })
        );

        setCourseBundles(bundles);
      } catch (error: any) {
        toast({ title: "Failed to load reports", description: error?.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [courses, selectedCourseId, toast]);

  const selectedCourseLabel = useMemo(() => {
    if (selectedCourseId === "all") return "All Courses";
    const hit = courses.find((course) => String(course._id) === selectedCourseId);
    return hit?.title || "Course";
  }, [courses, selectedCourseId]);

  const timeWindow = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    if (timeRange === "7d") return { start: now - 7 * day, end: now };
    if (timeRange === "30d") return { start: now - 30 * day, end: now };
    const start = toTs(customStart);
    const endBase = toTs(customEnd);
    return {
      start: start ?? now - 30 * day,
      end: (endBase ?? now) + day - 1,
    };
  }, [timeRange, customStart, customEnd]);

  const report = useMemo(() => {
    const inWindow = (value: any) => {
      const ts = toTs(value);
      if (ts == null) return false;
      return ts >= timeWindow.start && ts <= timeWindow.end;
    };

    const studentMap = new Map<string, any>();
    const assignmentRows: any[] = [];
    const examRows: any[] = [];
    const trendBucket = new Map<string, { sum: number; count: number }>();

    const ensureStudent = (id: string, name: string, status: string, courseId: string) => {
      if (!studentMap.has(id)) {
        studentMap.set(id, {
          id,
          name,
          status,
          courseIds: new Set<string>(),
          assignmentsCompleted: 0,
          examsGiven: 0,
          scoreSum: 0,
          scoreCount: 0,
        });
      }
      studentMap.get(id).courseIds.add(courseId);
      return studentMap.get(id);
    };

    courseBundles.forEach((bundle) => {
      const studentLookup = new Map<string, string>();
      bundle.students.forEach((entry: any) => {
        const s = entry?.studentId;
        const studentId = String(s?._id || "");
        if (!studentId) return;
        const row = ensureStudent(studentId, String(s?.name || "Student"), String(entry?.status || "active"), bundle.courseId);
        studentLookup.set(studentId, row.name);
      });

      bundle.assignments.forEach((assignment: any) => {
        const assignmentId = String(assignment?._id || "");
        if (!assignmentId || (assignmentFilter !== "all" && assignmentId !== assignmentFilter)) return;
        if (!inWindow(assignment?.dueAt || assignment?.createdAt)) return;

        const submissions = Array.isArray(assignment?.submissions) ? assignment.submissions : [];
        const relevantSubmissions = submissions.filter((submission: any) => {
          const sid = String(submission?.studentId?._id || submission?.studentId || "");
          if (studentFilter !== "all" && sid !== studentFilter) return false;
          return inWindow(submission?.submittedAt || assignment?.createdAt);
        });

        relevantSubmissions.forEach((submission: any) => {
          const sid = String(submission?.studentId?._id || submission?.studentId || "");
          const student = studentMap.get(sid);
          if (!student) return;
          student.assignmentsCompleted += 1;
        });

        const marks = relevantSubmissions
          .map((submission: any) => Number(submission?.marks))
          .filter((value: number) => Number.isFinite(value));
        const avgMarks = marks.length
          ? marks.reduce((sum: number, value: number) => sum + value, 0) / marks.length
          : 0;

        const totalStudents = Math.max(bundle.students.length, 1);
        assignmentRows.push({
          id: assignmentId,
          courseId: bundle.courseId,
          courseTitle: bundle.courseTitle,
          name: assignment?.title || "Assignment",
          totalStudents,
          submitted: relevantSubmissions.length,
          notSubmitted: Math.max(totalStudents - relevantSubmissions.length, 0),
          averageMarks: Number(avgMarks.toFixed(1)),
        });
      });

      bundle.exams.forEach((exam: any) => {
        const examId = String(exam?._id || "");
        if (!examId || (examFilter !== "all" && examId !== examFilter)) return;

        const resultRows = bundle.examResultRows.find((row: any) => String(row.examId) === examId)?.rows || [];
        const relevantResults = resultRows.filter((result: any) => {
          const sid = String(result?.studentId?._id || result?.studentId || "");
          if (studentFilter !== "all" && sid !== studentFilter) return false;
          return inWindow(result?.submittedAt || result?.createdAt);
        });

        relevantResults.forEach((result: any) => {
          const sid = String(result?.studentId?._id || result?.studentId || "");
          const name = String(result?.studentId?.name || studentLookup.get(sid) || "Student");
          const student = ensureStudent(sid, name, "active", bundle.courseId);
          const percentage = Number(result?.percentage);
          student.examsGiven += 1;
          if (Number.isFinite(percentage)) {
            student.scoreSum += percentage;
            student.scoreCount += 1;
          }

          if (result?.submittedAt && Number.isFinite(percentage)) {
            const dayKey = new Date(result.submittedAt).toISOString().slice(0, 10);
            const bucket = trendBucket.get(dayKey) || { sum: 0, count: 0 };
            bucket.sum += percentage;
            bucket.count += 1;
            trendBucket.set(dayKey, bucket);
          }
        });

        const percentages = relevantResults
          .map((result: any) => Number(result?.percentage))
          .filter((value: number) => Number.isFinite(value));
        const averageScore = percentages.length
          ? percentages.reduce((sum: number, value: number) => sum + value, 0) / percentages.length
          : 0;

        const highestScore = percentages.length ? Math.max(...percentages) : 0;
        const totalStudents = Math.max(bundle.students.length, 1);
        examRows.push({
          id: examId,
          courseId: bundle.courseId,
          courseTitle: bundle.courseTitle,
          name: exam?.title || "Exam",
          participationRate: Number(((relevantResults.length / totalStudents) * 100).toFixed(1)),
          averageScore: Number(averageScore.toFixed(1)),
          highestScore: Number(highestScore.toFixed(1)),
          results: relevantResults,
        });
      });
    });

    const students = Array.from(studentMap.values())
      .map((student) => {
        const averageScore = student.scoreCount > 0 ? student.scoreSum / student.scoreCount : 0;
        return {
          ...student,
          averageScore: Number(averageScore.toFixed(1)),
        };
      })
      .filter((student) => student.name.toLowerCase().includes(studentSearch.trim().toLowerCase()));

    students.sort((a, b) => {
      if (studentSort === "name") return a.name.localeCompare(b.name);
      if (studentSort === "avg") return b.averageScore - a.averageScore || a.name.localeCompare(b.name);
      return b.averageScore - a.averageScore || b.examsGiven - a.examsGiven || a.name.localeCompare(b.name);
    });
    students.forEach((student, index) => {
      student.rank = index + 1;
    });

    const trendData = Array.from(trendBucket.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({ date: date.slice(5), avgScore: Number((value.sum / value.count).toFixed(1)) }));

    const assignmentTotals = assignmentRows.reduce(
      (acc, row) => {
        acc.submitted += row.submitted;
        acc.notSubmitted += row.notSubmitted;
        return acc;
      },
      { submitted: 0, notSubmitted: 0 }
    );

    const allExamPercentages = examRows
      .flatMap((row) => row.results)
      .map((result) => Number(result?.percentage))
      .filter((value) => Number.isFinite(value));

    const distribution = [
      { label: "80-100", value: allExamPercentages.filter((n) => n >= 80).length, color: "#10b981" },
      { label: "60-80", value: allExamPercentages.filter((n) => n >= 60 && n < 80).length, color: "#3b82f6" },
      { label: "40-60", value: allExamPercentages.filter((n) => n >= 40 && n < 60).length, color: "#f59e0b" },
      { label: "Below 40", value: allExamPercentages.filter((n) => n < 40).length, color: "#ef4444" },
    ];

    const topVsWeak = {
      top: students.slice(0, 5).map((student) => ({ name: student.name.split(" ")[0], score: student.averageScore })),
      weak: [...students].reverse().slice(0, 5).reverse().map((student) => ({ name: student.name.split(" ")[0], score: student.averageScore })),
    };

    const totalStudents = students.length;
    const activeStudents = students.filter((student) => student.status === "active").length;
    const averageScore = students.length
      ? students.reduce((sum, student) => sum + student.averageScore, 0) / students.length
      : 0;
    const assignmentCompletionRate = assignmentTotals.submitted + assignmentTotals.notSubmitted > 0
      ? (assignmentTotals.submitted / (assignmentTotals.submitted + assignmentTotals.notSubmitted)) * 100
      : 0;
    const examParticipationRate = examRows.length && totalStudents
      ? (examRows.reduce((sum, row) => sum + row.participationRate, 0) / examRows.length)
      : 0;

    return {
      students,
      assignmentRows,
      examRows,
      trendData,
      assignmentRateData: [assignmentTotals],
      distribution,
      topVsWeak,
      overview: {
        totalStudents,
        activeStudents,
        averageScore: Number(averageScore.toFixed(1)),
        assignmentCompletionRate: Number(assignmentCompletionRate.toFixed(1)),
        examParticipationRate: Number(examParticipationRate.toFixed(1)),
      },
    };
  }, [assignmentFilter, courseBundles, examFilter, studentFilter, studentSearch, studentSort, timeWindow]);

  const previousPeriodAvg = useMemo(() => {
    const duration = Math.max(1, timeWindow.end - timeWindow.start);
    const prevStart = timeWindow.start - duration;
    const prevEnd = timeWindow.start;

    const values: number[] = [];
    courseBundles.forEach((bundle) => {
      bundle.examResultRows.forEach((examRow: any) => {
        examRow.rows.forEach((result: any) => {
          const sid = String(result?.studentId?._id || result?.studentId || "");
          if (studentFilter !== "all" && sid !== studentFilter) return;
          if (examFilter !== "all" && String(examRow.examId) !== examFilter) return;
          const ts = toTs(result?.submittedAt || result?.createdAt);
          const percentage = Number(result?.percentage);
          if (ts == null || !Number.isFinite(percentage)) return;
          if (ts >= prevStart && ts <= prevEnd) values.push(percentage);
        });
      });
    });

    if (!values.length) return 0;
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
  }, [courseBundles, studentFilter, examFilter, timeWindow]);

  const insights = useMemo(() => {
    const list: Array<{ title: string; detail: string; tone: "warning" | "success" | "neutral" }> = [];

    const worstAssignment = [...report.assignmentRows].sort((a, b) => b.notSubmitted - a.notSubmitted)[0];
    if (worstAssignment && worstAssignment.notSubmitted > 0) {
      list.push({
        title: "Submission Alert",
        detail: `${worstAssignment.notSubmitted} students have not submitted ${worstAssignment.name}.`,
        tone: "warning",
      });
    }

    const drop = previousPeriodAvg - report.overview.averageScore;
    if (drop >= 10) {
      list.push({
        title: "Performance Drop",
        detail: `Average score dropped by ${drop.toFixed(1)}% compared to the previous period.`,
        tone: "warning",
      });
    }

    const top5 = report.students.slice(0, 5);
    if (top5.length >= 3 && top5.every((student) => student.averageScore >= 80)) {
      list.push({
        title: "Top Performers",
        detail: "Top students are consistently scoring above 80%.",
        tone: "success",
      });
    }

    if (!list.length) {
      list.push({
        title: "Stable Trend",
        detail: "No major anomalies detected in the selected report window.",
        tone: "neutral",
      });
    }
    return list;
  }, [previousPeriodAvg, report]);

  const handleExportCSV = () => {
    const header = ["Student Name", "Assignments Completed", "Exams Given", "Average Score", "Rank"];
    const rows = report.students.map((student) => [
      student.name,
      student.assignmentsCompleted,
      student.examsGiven,
      student.averageScore,
      student.rank,
    ]);

    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `teacher-reports-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;

    const rows = report.students
      .map((student) => `<tr><td>${student.name}</td><td>${student.assignmentsCompleted}</td><td>${student.examsGiven}</td><td>${student.averageScore}%</td><td>${student.rank}</td></tr>`)
      .join("");

    w.document.write(`
      <html>
        <head><title>Teacher Reports</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h1>Reports - ${selectedCourseLabel}</h1>
          <p>Total Students: ${report.overview.totalStudents} | Average Score: ${report.overview.averageScore}%</p>
          <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse: collapse;">
            <thead><tr><th>Student</th><th>Assignments</th><th>Exams</th><th>Average</th><th>Rank</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const openAssignmentDrill = async (row: any) => {
    setAssignmentDrill({ title: row.name, rows: [], summary: null });
    setDrillLoading(true);
    try {
      const res = await coursesAPI.getAssignmentSubmissions(row.courseId, row.id);
      setAssignmentDrill({
        title: row.name,
        rows: Array.isArray(res?.data?.rows) ? res.data.rows : [],
        summary: res?.data?.summary || null,
      });
    } catch (error: any) {
      toast({ title: "Failed to open assignment", description: error?.message, variant: "destructive" });
      setAssignmentDrill(null);
    } finally {
      setDrillLoading(false);
    }
  };

  const examCompare = useMemo(() => {
    const a = report.examRows.find((row) => row.id === compareExamA);
    const b = report.examRows.find((row) => row.id === compareExamB);
    if (!a || !b) return null;
    return {
      a,
      b,
      avgDiff: Number((a.averageScore - b.averageScore).toFixed(1)),
      participationDiff: Number((a.participationRate - b.participationRate).toFixed(1)),
    };
  }, [compareExamA, compareExamB, report.examRows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">{selectedCourseLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" onClick={handleExportPDF}><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
        </div>
      </div>

      <Card className="sticky top-16 z-20 border-border/70 bg-background/95 backdrop-blur">
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course: any) => (
                <SelectItem key={course._id} value={String(course._id)}>{course.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger><SelectValue placeholder="Time range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger><SelectValue placeholder="Student" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {report.students.map((student) => (
                <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
            <SelectTrigger><SelectValue placeholder="Assignment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignments</SelectItem>
              {report.assignmentRows.map((row) => (
                <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={examFilter} onValueChange={setExamFilter}>
            <SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {report.examRows.map((row) => (
                <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant={comparisonMode ? "default" : "outline"} onClick={() => setComparisonMode((prev) => !prev)}>
            Comparison Mode
          </Button>

          {timeRange === "custom" && (
            <>
              <Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
              <Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Students</p><p className="mt-1 text-2xl font-bold">{report.overview.totalStudents}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active Students</p><p className="mt-1 text-2xl font-bold">{report.overview.activeStudents}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Average Score</p><p className="mt-1 text-2xl font-bold">{pct(report.overview.averageScore)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Assignment Completion</p><p className="mt-1 text-2xl font-bold">{pct(report.overview.assignmentCompletionRate)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Exam Participation</p><p className="mt-1 text-2xl font-bold">{pct(report.overview.examParticipationRate)}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-4 w-4" /> Performance Trend</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-4 w-4" /> Assignment Submission Rate</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.assignmentRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="submitted" fill="#10b981" name="Submitted" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="notSubmitted" fill="#ef4444" name="Not Submitted" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-4 w-4" /> Exam Performance Distribution</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={report.distribution} dataKey="value" nameKey="label" outerRadius={95} label>
                      {report.distribution.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="h-4 w-4" /> Top vs Weak Students</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...report.topVsWeak.top, ...report.topVsWeak.weak]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {[...report.topVsWeak.top, ...report.topVsWeak.weak].map((row, idx) => (
                        <Cell key={`${row.name}-${idx}`} fill={idx < report.topVsWeak.top.length ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg">Student Performance Table</CardTitle>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <Input placeholder="Search student" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} className="md:w-64" />
                <Select value={studentSort} onValueChange={(value) => setStudentSort(value as any)}>
                  <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">Sort by Rank</SelectItem>
                    <SelectItem value="avg">Sort by Average</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-muted-foreground">Student Name</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Assignments Completed</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Exams Given</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Average Score</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.students.map((student) => (
                      <tr
                        key={student.id}
                        className={`cursor-pointer border-b border-border/50 ${student.averageScore < 40 ? "bg-destructive/5" : "hover:bg-muted/40"}`}
                        onClick={() => {
                          if (selectedCourseId === "all") {
                            toast({ title: "Pick a course first", description: "Student drill-down needs a single selected course." });
                            return;
                          }
                          navigate(`/teacher/courses/${selectedCourseId}/students/${student.id}/performance`);
                        }}
                      >
                        <td className="px-3 py-3 font-medium">{student.name}</td>
                        <td className="px-3 py-3 text-center">{student.assignmentsCompleted}</td>
                        <td className="px-3 py-3 text-center">{student.examsGiven}</td>
                        <td className="px-3 py-3 text-center font-semibold">{student.averageScore}%</td>
                        <td className="px-3 py-3 text-center">#{student.rank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Assignment Report Table</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-muted-foreground">Assignment Name</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Total Students</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Submitted</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Not Submitted</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Average Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.assignmentRows.map((row) => (
                      <tr key={`${row.courseId}-${row.id}`} className="cursor-pointer border-b border-border/50 hover:bg-muted/40" onClick={() => openAssignmentDrill(row)}>
                        <td className="px-3 py-3 font-medium">{row.name}</td>
                        <td className="px-3 py-3 text-center">{row.totalStudents}</td>
                        <td className="px-3 py-3 text-center text-emerald-600">{row.submitted}</td>
                        <td className="px-3 py-3 text-center text-rose-600">{row.notSubmitted}</td>
                        <td className="px-3 py-3 text-center">{row.averageMarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Exam Report Table</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-muted-foreground">Exam Name</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Participation Rate</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Average Score</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Highest Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.examRows.map((row) => (
                      <tr key={`${row.courseId}-${row.id}`} className="cursor-pointer border-b border-border/50 hover:bg-muted/40" onClick={() => setExamDrill(row)}>
                        <td className="px-3 py-3 font-medium">{row.name}</td>
                        <td className="px-3 py-3 text-center">{row.participationRate}%</td>
                        <td className="px-3 py-3 text-center">{row.averageScore}%</td>
                        <td className="px-3 py-3 text-center">{row.highestScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {comparisonMode && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Comparison Mode</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Select value={compareExamA} onValueChange={setCompareExamA}>
                    <SelectTrigger><SelectValue placeholder="Exam A" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select Exam A</SelectItem>
                      {report.examRows.map((row) => (
                        <SelectItem key={`a-${row.id}`} value={row.id}>{row.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={compareExamB} onValueChange={setCompareExamB}>
                    <SelectTrigger><SelectValue placeholder="Exam B" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select Exam B</SelectItem>
                      {report.examRows.map((row) => (
                        <SelectItem key={`b-${row.id}`} value={row.id}>{row.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {examCompare ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Average Score Delta</p><p className="mt-1 text-xl font-bold">{examCompare.avgDiff}%</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Participation Delta</p><p className="mt-1 text-xl font-bold">{examCompare.participationDiff}%</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Period Comparison</p><p className="mt-1 text-xl font-bold">{(report.overview.averageScore - previousPeriodAvg).toFixed(1)}%</p></CardContent></Card>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select two exams to compare their outcomes.</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-lg">Insights & Alerts</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {insights.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className={`rounded-xl border p-4 ${item.tone === "warning" ? "border-amber-400/40 bg-amber-500/10" : item.tone === "success" ? "border-emerald-400/40 bg-emerald-500/10" : "border-border bg-muted/20"}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {item.tone === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : item.tone === "success" ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))}

              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-sm font-semibold text-destructive">Weak Student Highlight</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {report.students.filter((student) => student.averageScore < 40).length} students are below 40% and need intervention.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {report.students.filter((student) => student.averageScore < 40).slice(0, 5).map((student) => (
                    <Badge key={student.id} variant="destructive">{student.name}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={Boolean(assignmentDrill)} onOpenChange={(open) => !open && setAssignmentDrill(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{assignmentDrill?.title || "Assignment Details"}</DialogTitle></DialogHeader>
          {drillLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-3">
              {assignmentDrill?.summary && (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Card><CardContent className="p-3 text-sm">Total: {assignmentDrill.summary.totalStudents}</CardContent></Card>
                  <Card><CardContent className="p-3 text-sm">Submitted: {assignmentDrill.summary.submitted}</CardContent></Card>
                  <Card><CardContent className="p-3 text-sm">Pending: {assignmentDrill.summary.pending}</CardContent></Card>
                  <Card><CardContent className="p-3 text-sm">Late: {assignmentDrill.summary.late}</CardContent></Card>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-2 py-2 text-left">Student</th>
                      <th className="px-2 py-2 text-center">Status</th>
                      <th className="px-2 py-2 text-center">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(assignmentDrill?.rows || []).map((row: any) => (
                      <tr key={row.studentId} className="border-b border-border/50">
                        <td className="px-2 py-2">{row.studentName}</td>
                        <td className="px-2 py-2 text-center">{row.submissionStatus}</td>
                        <td className="px-2 py-2 text-center">{row.marks ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(examDrill)} onOpenChange={(open) => !open && setExamDrill(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{examDrill?.name || "Exam Details"}</DialogTitle></DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left">Student</th>
                  <th className="px-2 py-2 text-center">Score</th>
                  <th className="px-2 py-2 text-center">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {(examDrill?.results || []).map((row: any, index: number) => (
                  <tr key={`${row?._id || index}`} className="border-b border-border/50">
                    <td className="px-2 py-2">{row?.studentId?.name || "Student"}</td>
                    <td className="px-2 py-2 text-center">{Number.isFinite(Number(row?.percentage)) ? `${Number(row.percentage).toFixed(1)}%` : "Pending"}</td>
                    <td className="px-2 py-2 text-center">{row?.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentReports;
