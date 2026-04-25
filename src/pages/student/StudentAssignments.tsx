import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { coursesAPI } from "@/services/api";
import { useStudentCourse } from "@/contexts/StudentCourseContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, ArrowRight, CheckCircle2, AlertCircle, ClipboardCheck, Clock, BookOpen } from "lucide-react";

type StudentAssignment = {
  _id: string;
  title: string;
  description?: string;
  status: "active" | "closed";
  dueAt?: string | null;
  totalMarks?: number;
  hasSubmitted?: boolean;
  submissionStatus?: "pending" | "submitted" | "late";
  submittedAt?: string | null;
  marks?: number | null;
  feedback?: string;
  course?: { _id: string; title: string };
};

type ViewFilter = "all" | "pending" | "submitted" | "late" | "graded";
type SortBy = "due-soon" | "due-late" | "newest" | "oldest" | "title";

const resolveViewStatus = (assignment: StudentAssignment): ViewFilter => {
  if (assignment.marks !== null && assignment.marks !== undefined) return "graded";
  if (assignment.hasSubmitted && assignment.submissionStatus === "late") return "late";
  if (assignment.hasSubmitted) return "submitted";
  return "pending";
};

const dueLabel = (dueAt?: string | null) => {
  if (!dueAt) return "No due date";
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleString();
};

const getTimeRemaining = (dueAt?: string | null) => {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;
  
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  
  if (diffMs < 0) {
    // Overdue
    const overdueDays = Math.floor(-diffMs / (1000 * 60 * 60 * 24));
    const overdueHours = Math.floor((-diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let text = "Overdue";
    if (overdueDays > 0) text = `${overdueDays}d overdue`;
    else if (overdueHours > 0) text = `${overdueHours}h overdue`;
    
    return { text, isOverdue: true, color: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" };
  }
  
  // Time remaining
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let text = "";
  if (days > 0) {
    text = `${days}d ${hours}h left`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m left`;
  } else if (minutes > 0) {
    text = `${minutes}m left`;
  } else {
    text = "Submitting soon!";
  }
  
  // Color coding: green if plenty of time, orange if warning time, red if critical
  let colorClass = "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (hours < 24 && hours > 0) colorClass = "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  else if (hours === 0 && minutes < 60) colorClass = "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800";
  
  return { text, isOverdue: false, color: colorClass };
};

const StudentAssignments = () => {
  const { toast } = useToast();
  const { selectedCourseId, selectedCourse } = useStudentCourse();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("due-soon");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [timeRefresh, setTimeRefresh] = useState(0);

  // Refresh time remaining display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh((prev) => prev + 1);
    }, 60000); // Update every 60 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await coursesAPI.listMyAssignments({ search: search || undefined });
        setAssignments(res?.data || []);
      } catch (error: any) {
        toast({
          title: "Failed to load assignments",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search, toast]);

  const courseScopedAssignments = useMemo(() => {
    if (!selectedCourseId) return assignments;
    return assignments.filter((item) => String(item.course?._id || "") === String(selectedCourseId));
  }, [assignments, selectedCourseId]);

  const filtered = useMemo(() => {
    if (filter === "all") return courseScopedAssignments;
    return courseScopedAssignments.filter((item) => resolveViewStatus(item) === filter);
  }, [courseScopedAssignments, filter]);

  const sorted = useMemo(() => {
    const getDueMs = (value?: string | null) => {
      if (!value) return Number.MAX_SAFE_INTEGER;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
    };

    const getCreatedMs = (item: StudentAssignment) => {
      const anyItem = item as any;
      const source = anyItem.createdAt || anyItem.updatedAt || item.dueAt;
      if (!source) return 0;
      const parsed = new Date(source);
      return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    };

    const list = [...filtered];
    list.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "due-soon") return getDueMs(a.dueAt) - getDueMs(b.dueAt);
      if (sortBy === "due-late") return getDueMs(b.dueAt) - getDueMs(a.dueAt);
      if (sortBy === "newest") return getCreatedMs(b) - getCreatedMs(a);
      return getCreatedMs(a) - getCreatedMs(b);
    });
    return list;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [page, pageSize, sorted]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, sortBy, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const summary = useMemo(() => {
    const stats = { all: courseScopedAssignments.length, pending: 0, submitted: 0, late: 0, graded: 0 } as Record<ViewFilter, number>;
    courseScopedAssignments.forEach((item) => {
      const state = resolveViewStatus(item);
      stats[state] += 1;
    });
    return stats;
  }, [courseScopedAssignments]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/60 p-5 shadow-lg md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />
        
        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Student Assignment Center</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">Assignments</h1>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm">{selectedCourse ? `Assignments for ${selectedCourse.courseTitle}` : "Complete your assignments, track submissions, and receive feedback from your teachers."}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <button type="button" onClick={() => setFilter("all")} className={`rounded-xl border p-3 text-left shadow-sm transition-shadow hover:shadow-md ${filter === "all" ? "border-primary bg-primary/5" : "border-border bg-card"}`} style={{ boxShadow: "rgba(0, 0, 0, 0.12) 0px 6px 16px" }}>
          <p className="text-xs text-muted-foreground">All</p>
          <p className="text-xl font-semibold">{summary.all}</p>
        </button>
        <button type="button" onClick={() => setFilter("pending")} className={`rounded-xl border p-3 text-left shadow-sm transition-shadow hover:shadow-md ${filter === "pending" ? "border-primary bg-primary/5" : "border-border bg-card"}`} style={{ boxShadow: "rgba(0, 0, 0, 0.12) 0px 6px 16px" }}>
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-xl font-semibold">{summary.pending}</p>
        </button>
        <button type="button" onClick={() => setFilter("submitted")} className={`rounded-xl border p-3 text-left shadow-sm transition-shadow hover:shadow-md ${filter === "submitted" ? "border-primary bg-primary/5" : "border-border bg-card"}`} style={{ boxShadow: "rgba(0, 0, 0, 0.12) 0px 6px 16px" }}>
          <p className="text-xs text-muted-foreground">Submitted</p>
          <p className="text-xl font-semibold">{summary.submitted}</p>
        </button>
        <button type="button" onClick={() => setFilter("late")} className={`rounded-xl border p-3 text-left shadow-sm transition-shadow hover:shadow-md ${filter === "late" ? "border-primary bg-primary/5" : "border-border bg-card"}`} style={{ boxShadow: "rgba(0, 0, 0, 0.12) 0px 6px 16px" }}>
          <p className="text-xs text-muted-foreground">Late</p>
          <p className="text-xl font-semibold">{summary.late}</p>
        </button>
        <button type="button" onClick={() => setFilter("graded")} className={`rounded-xl border p-3 text-left shadow-sm transition-shadow hover:shadow-md ${filter === "graded" ? "border-primary bg-primary/5" : "border-border bg-card"}`} style={{ boxShadow: "rgba(0, 0, 0, 0.12) 0px 6px 16px" }}>
          <p className="text-xs text-muted-foreground">Graded</p>
          <p className="text-xl font-semibold">{summary.graded}</p>
        </button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Search by assignment title"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="due-soon">Sort: Due date (nearest)</option>
              <option value="due-late">Sort: Due date (farthest)</option>
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="title">Sort: Title A-Z</option>
            </select>
            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value) || 6)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="6">6 per page</option>
              <option value="10">10 per page</option>
              <option value="16">16 per page</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Loading assignments...</CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No assignments found for this filter.</CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((assignment) => {
            const viewStatus = resolveViewStatus(assignment);
            return (
              <Card
                key={assignment._id}
                className="border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 hover:shadow-lg transition-shadow"
                style={{ boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px" }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{assignment.title}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{assignment.course?.title || "Course"}</p>
                    </div>
                    <StatusBadge status={viewStatus} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{assignment.description || "No description provided."}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4" />
                      <span>{dueLabel(assignment.dueAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClipboardCheck className="h-4 w-4" />
                      <span>Total marks: {assignment.totalMarks ?? 100}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{assignment.hasSubmitted ? "Submission done" : "Not submitted"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      <span>{assignment.marks !== null && assignment.marks !== undefined ? `Marks: ${assignment.marks}` : "Not graded"}</span>
                    </div>
                  </div>

                  {getTimeRemaining(assignment.dueAt) && (
                    <div className={`flex items-center gap-2 rounded-lg border p-2.5 ${getTimeRemaining(assignment.dueAt)?.color}`}>
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold text-sm">{getTimeRemaining(assignment.dueAt)?.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button asChild size="sm" className="gap-2">
                      <Link to={`/assignments/${assignment._id}`}>
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: ViewFilter }) => {
  if (status === "graded") return <Badge className="bg-emerald-600">Graded</Badge>;
  if (status === "late") return <Badge variant="destructive">Late</Badge>;
  if (status === "submitted") return <Badge className="bg-blue-600">Submitted</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
};

export default StudentAssignments;
