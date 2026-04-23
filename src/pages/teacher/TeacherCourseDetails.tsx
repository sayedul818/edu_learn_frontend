import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, BarChart3, Bell, CalendarClock, CalendarDays, CheckCircle2, ClipboardList, Clock3, Copy, Eye, FileText, FolderUp, Gauge, GraduationCap, Heart, Link2, Mail, Megaphone, MessageCircle, MoreVertical, PauseCircle, Pencil, Paperclip, Pin, PinOff, PlayCircle, Plus, Search, Send, Trash2, Trophy, Upload, UserPlus, Users, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { coursesAPI, examResultsAPI, examsAPI, leaderboardAPI, teacherAPI } from "@/services/api";
import { uploadFileToCloudinary } from "@/services/cloudinary";
import ExamCreationModal from "@/components/admin/ExamCreationModal";

type CourseDetails = {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  status: "draft" | "published";
  duration: string;
  startDate?: string;
  endDate?: string;
  students: Array<{
    _id: string;
    studentId?: { _id: string; name: string; email: string; status?: string; avatar?: string };
    enrollmentDate?: string;
    createdAt?: string;
    status?: "active" | "pending" | "hold";
    progressPercentage?: number;
    averagePercentage?: number;
    completedExams?: number;
    totalExams?: number;
    lastActivityAt?: string;
  }>;
  exams: Array<{ _id: string; title: string; status: string; totalMarks: number }>;
  materials: Array<{ _id: string; title: string; url: string; type: string; uploadedAt?: string }>;
  announcements: CourseAnnouncement[];
};

type TeacherStudent = {
  _id: string;
  name: string;
  email: string;
  status?: "active" | "inactive";
};

type ExamResultStats = {
  attempts: number;
  gradedAttempts: number;
  averagePercentage: number;
  latestSubmittedAt?: string;
};

type StudentPerformance = {
  student?: { _id: string; name: string; email: string; status?: string; avatar?: string };
  enrollment?: { _id: string; enrollmentDate?: string; status?: string; createdAt?: string };
  performance?: {
    totalExams: number;
    completedExams: number;
    averagePercentage: number;
    lastActivityAt?: string;
    weakAreas?: Array<{ category: string; label: string; incorrectCount: number; attempts: number }>;
    results: Array<{ examId: string; examTitle: string; score: number | null; totalMarks: number; percentage: number | null; submittedAt?: string; pendingEvaluation?: boolean }>;
  };
};

type BulkStudentRow = {
  rowNumber: number;
  name: string;
  email: string;
  status: "active" | "pending";
  errors: string[];
  studentId?: string;
};

type AssignmentType = "written" | "file" | "mixed";
type AssignmentStatus = "draft" | "active" | "closed";

type AssignmentItem = {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  type: AssignmentType;
  status: AssignmentStatus;
  dueAt?: string;
  totalMarks?: number;
  allowLateSubmission?: boolean;
  maxFileSizeMb?: number;
  referenceMaterials?: Array<{ title?: string; url?: string; type?: string }>;
  submittedCount?: number;
  pendingCount?: number;
  lateCount?: number;
  totalStudents?: number;
  completionRate?: number;
};

type AssignmentSubmissionRow = {
  studentId: string;
  studentName: string;
  email?: string;
  submissionStatus: "submitted" | "pending" | "late";
  submittedAt?: string | null;
  marks?: number | null;
  feedback?: string;
  hasFile?: boolean;
  files?: Array<{ name?: string; url?: string; size?: number; mimeType?: string }>;
};

type AnnouncementAttachment = {
  name?: string;
  url: string;
  type?: "pdf" | "image" | "video" | "link";
};

type CourseAnnouncement = {
  _id: string;
  title?: string;
  message: string;
  attachments?: AnnouncementAttachment[];
  audience?: {
    scope?: "all" | "batch" | "students";
    batches?: string[];
    studentIds?: string[];
  };
  schedule?: {
    mode?: "now" | "scheduled";
    scheduledFor?: string | null;
  };
  priority?: "normal" | "important" | "urgent";
  isPinned?: boolean;
  notification?: {
    push?: boolean;
    email?: boolean;
    silent?: boolean;
  };
  status?: "draft" | "published" | "scheduled";
  seenBy?: string[];
  likedBy?: string[];
  comments?: Array<{ _id?: string; userName?: string; message?: string; createdAt?: string }>;
  createdBy?: { userId?: string; name?: string };
  createdAt: string;
  updatedAt?: string;
};

type LeaderboardTimeRange = "weekly" | "monthly" | "all";
type LeaderboardScoreType = "overall" | "exams" | "assignments";

type LeaderboardExamAttempt = {
  studentId: string;
  studentName: string;
  examId: string;
  submittedAt?: string;
  percentage: number;
  score: number;
};

type LeaderboardAssignmentAttempt = {
  studentId: string;
  studentName: string;
  assignmentId: string;
  submittedAt?: string;
  dueAt?: string;
  marks?: number | null;
  totalMarks?: number;
  isLate: boolean;
};

type LeaderboardAssignmentCatalogItem = {
  assignmentId: string;
  dueAt?: string;
  createdAt?: string;
};

type CourseLeaderboardEntry = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatar?: string;
  completedAssignments: number;
  examsGiven: number;
  accuracy: number;
  score: number;
  bonus: number;
  penalty: number;
  lateSubmissions: number;
  consistencyDays: number;
  assignmentAccuracy: number;
  examAccuracy: number;
  completionRate: number;
  rank: number;
  deltaScore: number;
};

function parseCsvLine(line: string) {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

const TeacherCourseDetails = () => {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const sharedSurfaceCardClass = "group flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/80";
  const sharedSurfaceCardShadow = { boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px" };

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [leaderboardRows, setLeaderboardRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [examSearch, setExamSearch] = useState("");
  const [examFilter, setExamFilter] = useState<"all" | "draft" | "published" | "scheduled">("all");
  const [examPage, setExamPage] = useState(1);
  const [examPageSize] = useState(6);
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialFilter, setMaterialFilter] = useState<"all" | "pdf" | "video" | "link" | "doc">("all");
  const [materialSort, setMaterialSort] = useState<"latest" | "oldest">("latest");
  const [materialPage, setMaterialPage] = useState(1);
  const [materialPageSize] = useState(6);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [materialSubmitting, setMaterialSubmitting] = useState(false);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    type: "link" as "pdf" | "doc" | "video" | "link",
    description: "",
    url: "",
  });
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementFilter, setAnnouncementFilter] = useState<"all" | "pinned" | "scheduled">("all");
  const [announcementSort, setAnnouncementSort] = useState<"latest" | "oldest">("latest");
  const [announcementUnreadOnly, setAnnouncementUnreadOnly] = useState(false);
  const [announcementImportantOnly, setAnnouncementImportantOnly] = useState(false);
  const [announcementComposerOpen, setAnnouncementComposerOpen] = useState(false);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [announcementPreviewOpen, setAnnouncementPreviewOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcementUploadFiles, setAnnouncementUploadFiles] = useState<File[]>([]);
  const [announcementLinkInput, setAnnouncementLinkInput] = useState("");
  const [announcementVideoInput, setAnnouncementVideoInput] = useState("");
  const [announcementAttachments, setAnnouncementAttachments] = useState<AnnouncementAttachment[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    audienceScope: "all" as "all" | "batch" | "students",
    batchText: "",
    selectedStudentIds: [] as string[],
    scheduleMode: "now" as "now" | "scheduled",
    scheduledFor: "",
    priority: "normal" as "normal" | "important" | "urgent",
    isPinned: false,
    notifyPush: true,
    notifyEmail: false,
    notifySilent: false,
  });
  const [coverImageFailed, setCoverImageFailed] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examModalTab, setExamModalTab] = useState<"edit" | "settings" | "result">("edit");
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [actionExamId, setActionExamId] = useState<string | null>(null);
  const [examResultStats, setExamResultStats] = useState<Record<string, ExamResultStats>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewExam, setPreviewExam] = useState<any | null>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [teacherStudents, setTeacherStudents] = useState<TeacherStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [loadingTeacherStudents, setLoadingTeacherStudents] = useState(false);
  const [enrollingStudentId, setEnrollingStudentId] = useState<string | null>(null);
  const [studentFlow, setStudentFlow] = useState<"menu" | "manual" | "bulk" | "invite">("menu");
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkStudentRow[]>([]);
  const [bulkHeaderError, setBulkHeaderError] = useState("");
  const [bulkValidated, setBulkValidated] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [bulkDragActive, setBulkDragActive] = useState(false);
  const [studentProfileOpen, setStudentProfileOpen] = useState(false);
  const [selectedCourseStudent, setSelectedCourseStudent] = useState<CourseDetails["students"][number] | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | AssignmentStatus>("all");
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentPageSize] = useState(6);
  const [assignmentEditorOpen, setAssignmentEditorOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    instructions: "",
    type: "written" as AssignmentType,
    dueDate: "",
    dueTime: "",
    totalMarks: "",
    allowLateSubmission: false,
    maxFileSizeMb: "",
    referenceTitle: "",
    referenceUrl: "",
  });
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [submissionSummary, setSubmissionSummary] = useState({ totalStudents: 0, submitted: 0, pending: 0, late: 0 });
  const [submissionRows, setSubmissionRows] = useState<AssignmentSubmissionRow[]>([]);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [bulkMarks, setBulkMarks] = useState("");
  const [bulkFeedback, setBulkFeedback] = useState("");
  const [studentSubmissionOpen, setStudentSubmissionOpen] = useState(false);
  const [studentSubmissionLoading, setStudentSubmissionLoading] = useState(false);
  const [studentSubmissionData, setStudentSubmissionData] = useState<any | null>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [recentSubmissionRows, setRecentSubmissionRows] = useState<Array<{ id: string; studentName: string; itemName: string; submittedAt: number; status: string }>>([]);
  const [leaderboardTimeRange, setLeaderboardTimeRange] = useState<LeaderboardTimeRange>("weekly");
  const [leaderboardScoreType, setLeaderboardScoreType] = useState<LeaderboardScoreType>("overall");
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [courseExamAttempts, setCourseExamAttempts] = useState<LeaderboardExamAttempt[]>([]);
  const [leaderboardAssignmentAttempts, setLeaderboardAssignmentAttempts] = useState<LeaderboardAssignmentAttempt[]>([]);
  const [leaderboardAssignmentCatalog, setLeaderboardAssignmentCatalog] = useState<LeaderboardAssignmentCatalogItem[]>([]);
  const [leaderboardAssignmentLoading, setLeaderboardAssignmentLoading] = useState(false);
  const [sharedCourseLeaderboard, setSharedCourseLeaderboard] = useState<any | null>(null);
  const [sharedCourseLeaderboardLoading, setSharedCourseLeaderboardLoading] = useState(false);

  const buildDueAtFromForm = () => {
    if (!assignmentForm.dueDate) return null;
    const value = `${assignmentForm.dueDate}T${assignmentForm.dueTime || "23:59"}:00`;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  };

  const appendDescriptionImage = async (file?: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
      });

      setAssignmentForm((prev) => ({
        ...prev,
        description: `${prev.description || ""}\n<img src="${dataUrl}" alt="Assignment image" />`,
      }));
      toast({ title: "Image inserted into description" });
    } catch (error: any) {
      toast({ title: "Failed to insert image", description: error?.message, variant: "destructive" });
    }
  };

  const assignmentStatusMeta = (status: AssignmentStatus) => {
    if (status === "active") return { label: "Active", className: "bg-emerald-100 text-emerald-700" };
    if (status === "closed") return { label: "Closed", className: "bg-rose-100 text-rose-700" };
    return { label: "Draft", className: "bg-amber-100 text-amber-700" };
  };

  const submissionStatusMeta = (status: AssignmentSubmissionRow["submissionStatus"]) => {
    if (status === "submitted") return { label: "Submitted", className: "bg-emerald-100 text-emerald-700" };
    if (status === "late") return { label: "Late", className: "bg-orange-100 text-orange-700" };
    return { label: "Pending", className: "bg-rose-100 text-rose-700" };
  };

  const loadRecentSubmissionRows = async (assignmentList: AssignmentItem[]) => {
    if (!courseId || assignmentList.length === 0) {
      setRecentSubmissionRows([]);
      return;
    }

    const targetAssignments = assignmentList.slice(0, 8);
    const settled = await Promise.allSettled(
      targetAssignments.map(async (assignment) => {
        const response = await coursesAPI.getAssignmentSubmissions(courseId, assignment._id);
        const rows = Array.isArray(response?.data?.rows) ? response.data.rows : [];
        return rows
          .filter((row: any) => Boolean(row?.submittedAt))
          .map((row: any) => {
            const at = new Date(row.submittedAt).getTime();
            if (!Number.isFinite(at)) return null;
            return {
              id: `${assignment._id}-${row.studentId}-${at}`,
              studentName: row.studentName || "Student",
              itemName: assignment.title || "Assignment",
              submittedAt: at,
              status: row.submissionStatus || "submitted",
            };
          })
          .filter(Boolean);
      })
    );

    const nextRows = settled
      .filter((result): result is PromiseFulfilledResult<any[]> => result.status === "fulfilled")
      .flatMap((result) => result.value)
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .slice(0, 8);

    setRecentSubmissionRows(nextRows);
  };

  const loadAssignments = async () => {
    if (!courseId) return;
    setAssignmentsLoading(true);
    try {
      const res = await coursesAPI.listAssignments(courseId, {
        search: assignmentSearch || undefined,
        status: assignmentFilter,
      });
      const nextAssignments = Array.isArray(res?.data) ? res.data : [];
      setAssignments(nextAssignments);
      await loadRecentSubmissionRows(nextAssignments);
    } catch (error: any) {
      toast({ title: "Failed to load assignments", description: error?.message, variant: "destructive" });
      setAssignments([]);
      setRecentSubmissionRows([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const resetAssignmentForm = () => {
    setEditingAssignmentId(null);
    setAssignmentForm({
      title: "",
      description: "",
      instructions: "",
      type: "written",
      dueDate: "",
      dueTime: "",
      totalMarks: "",
      allowLateSubmission: false,
      maxFileSizeMb: "",
      referenceTitle: "",
      referenceUrl: "",
    });
  };

  const openCreateAssignment = () => {
    resetAssignmentForm();
    setAssignmentEditorOpen(true);
  };

  const openEditAssignment = (assignment: AssignmentItem) => {
    setEditingAssignmentId(assignment._id);
    const due = assignment.dueAt ? new Date(assignment.dueAt) : null;
    const ref = Array.isArray(assignment.referenceMaterials) && assignment.referenceMaterials.length > 0 ? assignment.referenceMaterials[0] : null;
    setAssignmentForm({
      title: assignment.title || "",
      description: assignment.description || "",
      instructions: assignment.instructions || "",
      type: assignment.type || "written",
      dueDate: due ? due.toISOString().slice(0, 10) : "",
      dueTime: due ? due.toISOString().slice(11, 16) : "",
      totalMarks: String(assignment.totalMarks ?? 100),
      allowLateSubmission: Boolean(assignment.allowLateSubmission),
      maxFileSizeMb: String(assignment.maxFileSizeMb ?? 10),
      referenceTitle: ref?.title || "",
      referenceUrl: ref?.url || "",
    });
    setAssignmentEditorOpen(true);
  };

  const submitAssignment = async (publishNow = false) => {
    if (!assignmentForm.title.trim()) {
      toast({ title: "Assignment title is required", variant: "destructive" });
      return;
    }

    setAssignmentSubmitting(true);
    try {
      const payload = {
        title: assignmentForm.title.trim(),
        description: assignmentForm.description,
        instructions: assignmentForm.instructions,
        type: assignmentForm.type,
        dueAt: buildDueAtFromForm(),
        totalMarks: Number(assignmentForm.totalMarks) || 0,
        allowLateSubmission: assignmentForm.allowLateSubmission,
        maxFileSizeMb: Number(assignmentForm.maxFileSizeMb) || 10,
        referenceMaterials: assignmentForm.referenceUrl
          ? [{ title: assignmentForm.referenceTitle || "Reference", url: assignmentForm.referenceUrl, type: "link" }]
          : [],
      };

      if (editingAssignmentId) {
        await coursesAPI.updateAssignment(courseId, editingAssignmentId, payload);
        if (publishNow) await coursesAPI.publishAssignment(courseId, editingAssignmentId);
      } else {
        const created = await coursesAPI.createAssignment(courseId, { ...payload, status: publishNow ? "active" : "draft" });
        if (publishNow && created?.data?._id && created?.data?.status !== "active") {
          await coursesAPI.publishAssignment(courseId, created.data._id);
        }
      }

      setAssignmentEditorOpen(false);
      resetAssignmentForm();
      await loadAssignments();
      toast({ title: publishNow ? "Assignment published" : "Assignment saved" });
    } catch (error: any) {
      toast({ title: "Failed to save assignment", description: error?.message, variant: "destructive" });
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const changeAssignmentStatus = async (assignment: AssignmentItem, next: "publish" | "close") => {
    try {
      if (next === "publish") await coursesAPI.publishAssignment(courseId, assignment._id);
      else await coursesAPI.closeAssignment(courseId, assignment._id);
      await loadAssignments();
      toast({ title: next === "publish" ? "Assignment published" : "Assignment closed" });
    } catch (error: any) {
      toast({ title: "Failed to update assignment", description: error?.message, variant: "destructive" });
    }
  };

  const removeAssignment = async (assignment: AssignmentItem) => {
    const confirmed = window.confirm(`Delete "${assignment.title}"?`);
    if (!confirmed) return;
    try {
      await coursesAPI.deleteAssignment(courseId, assignment._id);
      await loadAssignments();
      toast({ title: "Assignment deleted" });
    } catch (error: any) {
      toast({ title: "Failed to delete assignment", description: error?.message, variant: "destructive" });
    }
  };

  const openSubmissions = async (assignment: AssignmentItem) => {
    setSelectedAssignment(assignment);
    setSubmissionsOpen(true);
    setSubmissionsLoading(true);
    setSelectedSubmissionIds([]);
    try {
      const res = await coursesAPI.getAssignmentSubmissions(courseId, assignment._id);
      setSubmissionSummary(res?.data?.summary || { totalStudents: 0, submitted: 0, pending: 0, late: 0 });
      setSubmissionRows(Array.isArray(res?.data?.rows) ? res.data.rows : []);
    } catch (error: any) {
      toast({ title: "Failed to load submissions", description: error?.message, variant: "destructive" });
      setSubmissionRows([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const openStudentSubmission = async (studentId: string) => {
    if (!selectedAssignment) return;
    setStudentSubmissionOpen(true);
    setStudentSubmissionLoading(true);
    try {
      const res = await coursesAPI.getStudentSubmission(courseId, selectedAssignment._id, studentId);
      const data = res?.data || null;
      setStudentSubmissionData(data);
      setGradeMarks(data?.submission?.marks != null ? String(data.submission.marks) : "");
      setGradeFeedback(data?.submission?.feedback || "");
    } catch (error: any) {
      toast({ title: "Failed to load submission", description: error?.message, variant: "destructive" });
      setStudentSubmissionData(null);
    } finally {
      setStudentSubmissionLoading(false);
    }
  };

  const saveGrade = async (returnToStudent = false) => {
    const assignmentId = selectedAssignment?._id;
    const studentId = studentSubmissionData?.student?._id;
    if (!assignmentId || !studentId) return;
    try {
      await coursesAPI.gradeStudentSubmission(courseId, assignmentId, studentId, {
        marks: gradeMarks === "" ? undefined : Number(gradeMarks),
        feedback: gradeFeedback,
        returnToStudent,
      });
      await openSubmissions(selectedAssignment as AssignmentItem);
      await openStudentSubmission(studentId);
      toast({ title: returnToStudent ? "Saved and returned to student" : "Grade saved" });
    } catch (error: any) {
      toast({ title: "Failed to save grade", description: error?.message, variant: "destructive" });
    }
  };

  const applyBulkGrade = async () => {
    if (!selectedAssignment) return;
    if (!selectedSubmissionIds.length) {
      toast({ title: "No students selected", variant: "destructive" });
      return;
    }

    const payload = {
      marks: bulkMarks === "" ? undefined : Number(bulkMarks),
      feedback: bulkFeedback,
      returnToStudent: false,
    };

    const result = await Promise.allSettled(
      selectedSubmissionIds.map((studentId) => coursesAPI.gradeStudentSubmission(courseId, selectedAssignment._id, studentId, payload))
    );
    const success = result.filter((item) => item.status === "fulfilled").length;
    const failed = result.length - success;
    await openSubmissions(selectedAssignment);
    toast({ title: "Bulk grading complete", description: `${success} success, ${failed} failed.` });
  };

  const downloadAllSubmissionFiles = () => {
    const urls = submissionRows.flatMap((row) => (row.files || []).map((file) => file.url).filter(Boolean));
    if (!urls.length) {
      toast({ title: "No files to download", variant: "destructive" });
      return;
    }
    urls.forEach((url) => window.open(url as string, "_blank"));
  };

  const loadData = async () => {
    setLoading(true);
    setExamResultStats({});
    setCourseExamAttempts([]);
    try {
      const [courseRes, examsRes, leaderboardRes] = await Promise.all([
        coursesAPI.get(courseId),
        examsAPI.getAll(),
        leaderboardAPI.get(),
      ]);
      const courseData = courseRes?.data || null;
      const examsData = examsRes?.data || [];
      setCourse(courseData);
      setAllExams(examsData);
      setLeaderboardRows(leaderboardRes?.data || []);

      const courseExamIds = Array.isArray(courseData?.exams)
        ? courseData.exams.map((exam: any) => String(exam?._id || exam)).filter(Boolean)
        : [];

      if (courseExamIds.length > 0) {
        const nextExamAttempts: LeaderboardExamAttempt[] = [];
        const statsResults = await Promise.allSettled(
          courseExamIds.map(async (examId) => {
            const res = await examResultsAPI.getByExam(examId);
            const results = Array.isArray(res?.data) ? res.data : [];
            results.forEach((result: any) => {
              const rawStudent = result?.studentId;
              const studentId = String(rawStudent?._id || rawStudent || "");
              if (!studentId) return;
              const submittedAt = result?.submittedAt;
              const score = Number(result?.score || 0);
              const percentage = Number(result?.percentage);
              if (!Number.isFinite(percentage)) return;
              nextExamAttempts.push({
                studentId,
                studentName: String(rawStudent?.name || result?.studentName || "Student"),
                examId,
                submittedAt,
                percentage,
                score,
              });
            });
            const gradedResults = results.filter((result: any) => result?.pendingEvaluation !== true && typeof result?.percentage === "number");
            const averagePercentage = gradedResults.length > 0
              ? Math.round(gradedResults.reduce((sum: number, result: any) => sum + (Number(result?.percentage) || 0), 0) / gradedResults.length)
              : 0;
            const latestSubmittedAt = results.reduce((latest: string | undefined, result: any) => {
              if (!result?.submittedAt) return latest;
              const current = new Date(result.submittedAt).toISOString();
              if (!latest) return current;
              return new Date(current).getTime() > new Date(latest).getTime() ? current : latest;
            }, undefined as string | undefined);

            return [examId, {
              attempts: results.length,
              gradedAttempts: gradedResults.length,
              averagePercentage,
              latestSubmittedAt,
            }] as const;
          })
        );

        const nextStats: Record<string, ExamResultStats> = {};
        statsResults.forEach((result) => {
          if (result.status === "fulfilled") {
            const [examId, stats] = result.value;
            nextStats[examId] = stats;
          }
        });
        setExamResultStats(nextStats);
        setCourseExamAttempts(nextExamAttempts);
      } else {
        setExamResultStats({});
        setCourseExamAttempts([]);
      }
    } catch (error: any) {
      toast({ title: "Failed to load course", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;
    const timer = window.setTimeout(() => {
      loadAssignments();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [courseId, assignmentSearch, assignmentFilter]);

  const loadLeaderboardAssignmentRows = async () => {
    if (!courseId) {
      setLeaderboardAssignmentAttempts([]);
      setLeaderboardAssignmentCatalog([]);
      return;
    }

    try {
      setLeaderboardAssignmentLoading(true);
      const assignmentRes = await coursesAPI.listAssignments(courseId, { status: "all" });
      const allAssignmentRows = Array.isArray(assignmentRes?.data) ? assignmentRes.data : [];
      setLeaderboardAssignmentCatalog(
        allAssignmentRows.map((item: any) => ({
          assignmentId: String(item?._id || ""),
          dueAt: item?.dueAt,
          createdAt: item?.createdAt,
        })).filter((item: LeaderboardAssignmentCatalogItem) => Boolean(item.assignmentId))
      );

      const settled = await Promise.allSettled(
        allAssignmentRows.map(async (assignment: any) => {
          const assignmentId = String(assignment?._id || "");
          if (!assignmentId) return [] as LeaderboardAssignmentAttempt[];
          const response = await coursesAPI.getAssignmentSubmissions(courseId, assignmentId);
          const rows = Array.isArray(response?.data?.rows) ? response.data.rows : [];

          return rows
            .filter((row: any) => Boolean(row?.submittedAt) && Boolean(row?.studentId))
            .map((row: any) => ({
              studentId: String(row.studentId),
              studentName: String(row.studentName || "Student"),
              assignmentId,
              submittedAt: row.submittedAt,
              dueAt: assignment?.dueAt,
              marks: row.marks == null ? null : Number(row.marks),
              totalMarks: Number(assignment?.totalMarks || 0),
              isLate: String(row.submissionStatus || "").toLowerCase() === "late",
            }));
        })
      );

      const nextRows = settled
        .filter((result): result is PromiseFulfilledResult<LeaderboardAssignmentAttempt[]> => result.status === "fulfilled")
        .flatMap((result) => result.value);

      setLeaderboardAssignmentAttempts(nextRows);
    } catch {
      setLeaderboardAssignmentAttempts([]);
      setLeaderboardAssignmentCatalog([]);
    } finally {
      setLeaderboardAssignmentLoading(false);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    loadLeaderboardAssignmentRows();
  }, [courseId]);

  useEffect(() => {
    const loadSharedLeaderboard = async () => {
      if (!courseId) return;
      try {
        setSharedCourseLeaderboardLoading(true);
        const res = await coursesAPI.getCourseLeaderboard(courseId, {
          timeRange: leaderboardTimeRange,
          type: leaderboardScoreType,
        });
        setSharedCourseLeaderboard(res?.data || null);
      } catch {
        setSharedCourseLeaderboard(null);
      } finally {
        setSharedCourseLeaderboardLoading(false);
      }
    };

    loadSharedLeaderboard();
  }, [courseId, leaderboardTimeRange, leaderboardScoreType]);

  useEffect(() => {
    setCoverImageFailed(false);
  }, [course?.thumbnail]);

  const examsById = useMemo(() => {
    const map = new Map<string, any>();
    (allExams || []).forEach((exam) => {
      if (exam?._id) map.set(exam._id, exam);
    });
    return map;
  }, [allExams]);

  const courseExams = useMemo(
    () => (course?.exams || []).map((exam) => examsById.get(String(exam?._id || exam)) || exam),
    [course?.exams, examsById]
  );

  const courseScopedUsers = useMemo(
    () =>
      (course?.students || [])
        .map((entry) => entry.studentId)
        .filter((student): student is { _id: string; name: string; email: string; status?: string } => Boolean(student?._id)),
    [course?.students]
  );

  const courseScopedStudentIds = useMemo(
    () => courseScopedUsers.map((student) => student._id),
    [courseScopedUsers]
  );

  const enrolledStudentIds = useMemo(
    () => new Set((course?.students || []).map((entry) => String(entry.studentId?._id || "")).filter(Boolean)),
    [course?.students]
  );

  const availableStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();
    return teacherStudents
      .filter((student) => !enrolledStudentIds.has(String(student._id)))
      .filter((student) => {
        if (!search) return true;
        return student.name.toLowerCase().includes(search) || student.email.toLowerCase().includes(search);
      });
  }, [teacherStudents, enrolledStudentIds, studentSearch]);

  const courseStudentRows = useMemo(() => {
    return (course?.students || []).map((entry) => {
      const student = entry.studentId;
      const joinedDate = entry.enrollmentDate || entry.createdAt;
      return {
        ...entry,
        studentId: student,
        joinedDate,
      };
    });
  }, [course?.students]);

  const leaderboardInsights = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const currentStart = leaderboardTimeRange === "weekly"
      ? now - 7 * oneDayMs
      : leaderboardTimeRange === "monthly"
        ? now - 30 * oneDayMs
        : null;
    const previousEnd = currentStart;
    const previousStart = currentStart == null
      ? null
      : leaderboardTimeRange === "weekly"
        ? currentStart - 7 * oneDayMs
        : currentStart - 30 * oneDayMs;

    const inWindow = (value?: string, start?: number | null, end?: number | null) => {
      if (!value) return false;
      const ts = new Date(value).getTime();
      if (!Number.isFinite(ts)) return false;
      if (start != null && ts < start) return false;
      if (end != null && ts > end) return false;
      return true;
    };

    const courseStudentMap = new Map<string, {
      studentId: string;
      studentName: string;
      studentEmail: string;
      avatar: string;
    }>(
      (courseStudentRows || [])
        .map((row: any) => {
          const studentId = String(row?.studentId?._id || "");
          return [
            studentId,
            {
              studentId,
              studentName: String(row?.studentId?.name || "Student"),
              studentEmail: String(row?.studentId?.email || ""),
              avatar: String(row?.studentId?.avatar || ""),
            },
          ] as const;
        })
        .filter(([studentId]) => Boolean(studentId))
    );

    const fallbackLeaderboardMap = new Map<string, any>(
      (leaderboardRows || [])
        .map((row: any) => {
          const studentId = String(row?.studentId?._id || row?.studentId || "");
          return [studentId, row] as const;
        })
        .filter(([studentId]) => Boolean(studentId) && courseStudentMap.has(studentId))
    );

    const computeWindowRows = (start: number | null, end: number | null) => {
      const metrics = new Map<string, {
        assignmentCount: number;
        lateCount: number;
        assignmentPercentages: number[];
        examsById: Set<string>;
        examPercentages: number[];
        activityDays: Set<string>;
      }>();

      const ensure = (studentId: string) => {
        if (!metrics.has(studentId)) {
          metrics.set(studentId, {
            assignmentCount: 0,
            lateCount: 0,
            assignmentPercentages: [],
            examsById: new Set<string>(),
            examPercentages: [],
            activityDays: new Set<string>(),
          });
        }
        return metrics.get(studentId)!;
      };

      (courseExamAttempts || []).forEach((attempt) => {
        if (!courseStudentMap.has(attempt.studentId)) return;
        if (start != null && !inWindow(attempt.submittedAt, start, end)) return;
        const item = ensure(attempt.studentId);
        item.examsById.add(attempt.examId);
        item.examPercentages.push(Number(attempt.percentage) || 0);
        if (attempt.submittedAt) item.activityDays.add(new Date(attempt.submittedAt).toISOString().slice(0, 10));
      });

      (leaderboardAssignmentAttempts || []).forEach((attempt) => {
        if (!courseStudentMap.has(attempt.studentId)) return;
        if (start != null && !inWindow(attempt.submittedAt, start, end)) return;
        const item = ensure(attempt.studentId);
        item.assignmentCount += 1;
        if (attempt.isLate) item.lateCount += 1;
        if (attempt.submittedAt) item.activityDays.add(new Date(attempt.submittedAt).toISOString().slice(0, 10));

        const marks = Number(attempt.marks);
        const totalMarks = Number(attempt.totalMarks || 0);
        if (Number.isFinite(marks) && totalMarks > 0) {
          item.assignmentPercentages.push(Math.max(0, Math.min(100, Math.round((marks / totalMarks) * 100))));
        }
      });

      const totalAssignmentsInWindow = (() => {
        const count = (leaderboardAssignmentCatalog || []).filter((item) => {
          if (start == null) return true;
          const probeDate = item.dueAt || item.createdAt;
          return inWindow(probeDate, start, end);
        }).length;
        return count > 0 ? count : (leaderboardAssignmentCatalog || []).length;
      })();

      const rows = Array.from(courseStudentMap.values()).map((student: {
        studentId: string;
        studentName: string;
        studentEmail: string;
        avatar: string;
      }) => {
        const item = metrics.get(student.studentId);
        const assignmentCount = item?.assignmentCount || 0;
        const lateCount = item?.lateCount || 0;
        const examsGiven = item?.examsById.size || 0;
        const examAccuracyRaw = item && item.examPercentages.length > 0
          ? item.examPercentages.reduce((sum, value) => sum + value, 0) / item.examPercentages.length
          : Number(fallbackLeaderboardMap.get(student.studentId)?.avgPercentage || 0);
        const completionRate = totalAssignmentsInWindow > 0 ? assignmentCount / totalAssignmentsInWindow : 0;
        const assignmentAccuracyRaw = item && item.assignmentPercentages.length > 0
          ? item.assignmentPercentages.reduce((sum, value) => sum + value, 0) / item.assignmentPercentages.length
          : completionRate * 100;

        const examComponent = Math.max(0, Math.min(100, examAccuracyRaw));
        const assignmentComponent = Math.max(0, Math.min(100, assignmentAccuracyRaw));
        const weightedOverall = examComponent * 0.7 + assignmentComponent * 0.3;
        const baseScore = leaderboardScoreType === "exams"
          ? examComponent
          : leaderboardScoreType === "assignments"
            ? assignmentComponent
            : weightedOverall;

        const consistencyDays = item?.activityDays.size || 0;
        const bonus = Math.min(10, Number((consistencyDays * 1.5).toFixed(1)));
        const penalty = lateCount * 2;
        const score = Math.max(0, Number((baseScore + bonus - penalty).toFixed(1)));
        const accuracy = leaderboardScoreType === "exams"
          ? examComponent
          : leaderboardScoreType === "assignments"
            ? assignmentComponent
            : weightedOverall;

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          studentEmail: student.studentEmail,
          avatar: student.avatar,
          completedAssignments: assignmentCount,
          examsGiven,
          accuracy: Number(accuracy.toFixed(1)),
          score,
          bonus,
          penalty,
          lateSubmissions: lateCount,
          consistencyDays,
          assignmentAccuracy: Number(assignmentComponent.toFixed(1)),
          examAccuracy: Number(examComponent.toFixed(1)),
          completionRate: Number((completionRate * 100).toFixed(1)),
          rank: 0,
          deltaScore: 0,
        } as CourseLeaderboardEntry;
      });

      rows.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy || a.studentName.localeCompare(b.studentName));
      rows.forEach((row, index) => {
        row.rank = index + 1;
      });
      return rows;
    };

    const currentRows = computeWindowRows(currentStart, now);
    const previousRows = computeWindowRows(previousStart, previousEnd);
    const previousScoreMap = new Map(previousRows.map((row) => [row.studentId, row.score]));

    const rankedRows = currentRows.map((row) => ({
      ...row,
      deltaScore: Number((row.score - Number(previousScoreMap.get(row.studentId) || 0)).toFixed(1)),
    }));

    const searchText = leaderboardSearch.trim().toLowerCase();
    const filteredRows = rankedRows.filter((row) => {
      if (!searchText) return true;
      return row.studentName.toLowerCase().includes(searchText) || row.studentEmail.toLowerCase().includes(searchText);
    });

    const top3 = rankedRows.slice(0, 3);
    const topPerformer = rankedRows[0] || null;
    const mostImproved = [...rankedRows]
      .sort((a, b) => b.deltaScore - a.deltaScore)
      .find((row) => row.deltaScore > 0) || null;
    const weakStudents = [...rankedRows]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / 10));
    const currentPage = Math.min(leaderboardPage, totalPages);
    const paginatedRows = filteredRows.slice((currentPage - 1) * 10, currentPage * 10);

    return {
      rankedRows,
      filteredRows,
      paginatedRows,
      top3,
      topPerformer,
      mostImproved,
      weakStudents,
      totalPages,
      currentPage,
    };
  }, [
    courseStudentRows,
    leaderboardRows,
    courseExamAttempts,
    leaderboardAssignmentAttempts,
    leaderboardAssignmentCatalog,
    leaderboardTimeRange,
    leaderboardScoreType,
    leaderboardSearch,
    leaderboardPage,
  ]);

  const leaderboardView = useMemo(() => {
    const baseRows = Array.isArray(sharedCourseLeaderboard?.rows) && sharedCourseLeaderboard.rows.length > 0
      ? sharedCourseLeaderboard.rows
      : leaderboardInsights.rankedRows;
    const searchText = leaderboardSearch.trim().toLowerCase();
    const filteredRows = baseRows.filter((row: any) => {
      if (!searchText) return true;
      return String(row.studentName || "").toLowerCase().includes(searchText) || String(row.studentEmail || "").toLowerCase().includes(searchText);
    });
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / 10));
    const currentPage = Math.min(leaderboardPage, totalPages);
    const paginatedRows = filteredRows.slice((currentPage - 1) * 10, currentPage * 10);
    return {
      rankedRows: baseRows,
      filteredRows,
      paginatedRows,
      top3: (Array.isArray(sharedCourseLeaderboard?.top3) && sharedCourseLeaderboard.top3.length > 0) ? sharedCourseLeaderboard.top3 : baseRows.slice(0, 3),
      totalPages,
      currentPage,
    };
  }, [sharedCourseLeaderboard, leaderboardInsights, leaderboardSearch, leaderboardPage]);

  useEffect(() => {
    setLeaderboardPage(1);
  }, [leaderboardTimeRange, leaderboardScoreType, leaderboardSearch]);

  const importableBulkRows = useMemo(
    () => bulkRows.filter((row) => row.errors.length === 0 && row.studentId),
    [bulkRows]
  );

  const statusLabel = (status?: string) => {
    const value = String(status || "draft").toLowerCase();
    if (value === "live" || value === "published") return "Published";
    if (value === "scheduled") return "Scheduled";
    return "Draft";
  };

  const getExamQuestionIds = (exam: any) => Array.from(new Set((exam?.questionIds || []).map((question: any) => String(question?._id || question)).filter(Boolean)));

  const formatDuration = (duration: any) => {
    const minutes = Number(duration);
    if (!Number.isFinite(minutes) || minutes <= 0) return duration ? String(duration) : "-";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0 && remainingMinutes > 0) return `${hours}h ${remainingMinutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const getExamResultStats = (examId: string): ExamResultStats => examResultStats[examId] || {
    attempts: 0,
    gradedAttempts: 0,
    averagePercentage: 0,
  };

  const getQuestionText = (question: any) => {
    if (!question) return "Untitled question";
    return question.questionTextBn || question.questionTextEn || question.questionText || question.text || "Untitled question";
  };

  const openCreateExamBuilder = () => {
    navigate(`/teacher/exams/builder?courseId=${courseId}`);
  };

  const openExamModal = async (examId: string, tab: "edit" | "settings" | "result") => {
    try {
      setActionExamId(examId);
      const cached = examsById.get(examId);
      if (cached) {
        setActiveExam(cached);
      } else {
        const res = await examsAPI.get(examId);
        setActiveExam(res?.data || null);
      }
      setExamModalTab(tab);
      setExamModalOpen(true);
    } catch (error: any) {
      toast({ title: "Failed to open exam", description: error?.message, variant: "destructive" });
    } finally {
      setActionExamId(null);
    }
  };

  const openExamPreview = async (exam: any) => {
    if (!exam?._id) return;

    try {
      setPreviewLoading(true);
      setPreviewOpen(true);
      const response = await examsAPI.get(String(exam._id));
      setPreviewExam(response?.data || exam);
    } catch (error: any) {
      setPreviewExam(exam || null);
      toast({ title: "Failed to load full preview", description: error?.message || "Showing available question data.", variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleExamPublish = async (exam: any) => {
    try {
      const current = String(exam?.status || "draft").toLowerCase();
      if (current === "live" || current === "published") {
        setActionExamId(exam._id);
        await examsAPI.unpublish(exam._id);
        await loadData();
        toast({ title: "Exam unpublished", description: "The exam is no longer visible to students." });
        return;
      }

      if (courseScopedStudentIds.length === 0) {
        toast({ title: "No enrolled students", description: "Enroll students in this course before starting an exam.", variant: "destructive" });
        return;
      }

      setActionExamId(exam._id);
      await examsAPI.update(exam._id, {
        accessType: "specific",
        allowedStudents: courseScopedStudentIds,
      });
      await examsAPI.publish(exam._id);
      await loadData();
      toast({ title: "Exam published", description: "Exam is now visible to the course students." });
    } catch (error: any) {
      toast({ title: "Failed to update exam", description: error?.message, variant: "destructive" });
    } finally {
      setActionExamId(null);
    }
  };

  const duplicateExam = async (exam: any) => {
    try {
      setActionExamId(exam._id);
      const questionIds = getExamQuestionIds(exam);
      const questionMarks = Array.isArray(exam?.questionMarks)
        ? exam.questionMarks
            .map((item: any) => ({ questionId: String(item?.questionId?._id || item?.questionId || ""), marks: Number(item?.marks) || 0 }))
            .filter((item: any) => item.questionId)
        : [];

      const payload = {
        title: `${exam.title || "Exam"} Copy`,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        questionIds,
        questionMarks,
        description: exam.description,
        questionNumbering: exam.questionNumbering,
        questionPresentation: exam.questionPresentation,
        shuffleQuestions: Boolean(exam.shuffleQuestions),
        shuffleOptions: Boolean(exam.shuffleOptions),
        allowMultipleAttempts: Boolean(exam.allowMultipleAttempts),
        allowAnswerChange: exam.allowAnswerChange !== false,
        resultVisibility: exam.resultVisibility,
        answerVisibility: exam.answerVisibility,
        autoSubmit: exam.autoSubmit !== false,
        marksPerQuestion: exam.marksPerQuestion,
        negativeMarking: Boolean(exam.negativeMarking),
        negativeMarkValue: exam.negativeMarkValue,
        accessType: exam.accessType === "specific" ? "specific" : "all",
        allowedStudents: exam.accessType === "specific" ? courseScopedStudentIds : [],
      };

      const created = await examsAPI.create(payload);
      const createdExam = created?.data || created;
      if (createdExam?._id) {
        await coursesAPI.linkExam(courseId, createdExam._id);
      }
      await loadData();
      toast({ title: "Exam duplicated", description: "A new copy was added to this course." });
    } catch (error: any) {
      toast({ title: "Failed to duplicate exam", description: error?.message, variant: "destructive" });
    } finally {
      setActionExamId(null);
    }
  };

  const removeExamFromCourse = async (exam: any) => {
    try {
      setActionExamId(exam._id);
      await coursesAPI.unlinkExam(courseId, exam._id);
      await loadData();
      toast({ title: "Exam removed from course" });
    } catch (error: any) {
      toast({ title: "Failed to remove exam", description: error?.message, variant: "destructive" });
    } finally {
      setActionExamId(null);
    }
  };

  const deleteExamPermanently = async (exam: any) => {
    const confirmed = window.confirm(`Delete \"${exam?.title || "this exam"}\" permanently? This will remove it from the course and delete the exam data.`);
    if (!confirmed) return;

    try {
      setActionExamId(exam._id);
      await coursesAPI.unlinkExam(courseId, exam._id).catch(() => null);
      await examsAPI.delete(exam._id);
      await loadData();
      toast({ title: "Exam deleted" });
    } catch (error: any) {
      toast({ title: "Failed to delete exam", description: error?.message, variant: "destructive" });
    } finally {
      setActionExamId(null);
    }
  };

  const examSummary = useMemo(() => {
    return courseExams.reduce(
      (summary, exam) => {
        const status = String(exam?.status || "draft").toLowerCase();
        if (status === "live" || status === "published") summary.published += 1;
        else if (status === "scheduled") summary.scheduled += 1;
        else summary.draft += 1;
        summary.attempts += getExamResultStats(String(exam?._id)).attempts;
        return summary;
      },
      { total: courseExams.length, published: 0, draft: 0, scheduled: 0, attempts: 0 }
    );
  }, [courseExams, examResultStats]);

  const filteredCourseExams = useMemo(() => {
    const q = examSearch.trim().toLowerCase();
    return courseExams.filter((exam) => {
      const status = String(exam?.status || "draft").toLowerCase();
      const normalizedStatus = status === "live" ? "published" : status;
      const matchesStatus = examFilter === "all" || normalizedStatus === examFilter;
      const matchesSearch = !q
        || String(exam?.title || "").toLowerCase().includes(q)
        || String(exam?.description || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [courseExams, examFilter, examSearch]);

  const paginatedCourseExams = useMemo(() => {
    const start = (examPage - 1) * examPageSize;
    return filteredCourseExams.slice(start, start + examPageSize);
  }, [examPage, examPageSize, filteredCourseExams]);

  const examTotalPages = Math.max(1, Math.ceil(filteredCourseExams.length / examPageSize));

  const filteredAssignments = useMemo(() => assignments, [assignments]);

  const paginatedAssignments = useMemo(() => {
    const start = (assignmentPage - 1) * assignmentPageSize;
    return filteredAssignments.slice(start, start + assignmentPageSize);
  }, [assignmentPage, assignmentPageSize, filteredAssignments]);

  const assignmentTotalPages = Math.max(1, Math.ceil(filteredAssignments.length / assignmentPageSize));

  const assignmentReminderText = useMemo(() => {
    const pending = assignments.reduce((sum, assignment) => sum + Number(assignment.pendingCount || 0), 0);
    if (pending <= 0) return "All students are up to date on assignments.";
    return `${pending} students have not submitted yet.`;
  }, [assignments]);

  const activeStudentsCount = useMemo(
    () => (course?.students || []).filter((student) => String(student?.status || student?.studentId?.status || "active") === "active").length,
    [course?.students]
  );

  const subjectLevelText = useMemo(() => {
    const subject = String((course as any)?.subject || (course as any)?.subjectName || "").trim();
    const level = String((course as any)?.level || (course as any)?.academicLevel || "").trim();
    if (subject && level) return `${subject} / ${level}`;
    if (subject) return `${subject} / Not set`;
    if (level) return `Not set / ${level}`;
    return "Not set";
  }, [course]);

  const upcomingTasks = useMemo(() => {
    const now = Date.now();

    const examItems = (courseExams || [])
      .map((exam) => {
        const start = exam?.startDate || exam?.publishedAt || exam?.createdAt;
        const dateValue = start ? new Date(start).getTime() : NaN;
        if (!Number.isFinite(dateValue) || dateValue < now) return null;
        return {
          id: `exam-${exam._id}`,
          title: exam?.title || "Exam",
          date: dateValue,
          type: "Exam" as const,
          status: statusLabel(exam?.status),
        };
      })
      .filter(Boolean) as Array<{ id: string; title: string; date: number; type: "Exam"; status: string }>;

    const assignmentItems = (assignments || [])
      .map((assignment) => {
        const due = assignment?.dueAt ? new Date(assignment.dueAt).getTime() : NaN;
        if (!Number.isFinite(due) || due < now) return null;
        return {
          id: `assignment-${assignment._id}`,
          title: assignment?.title || "Assignment",
          date: due,
          type: "Assignment" as const,
          status: assignmentStatusMeta(assignment.status).label,
        };
      })
      .filter(Boolean) as Array<{ id: string; title: string; date: number; type: "Assignment"; status: string }>;

    return [...examItems, ...assignmentItems].sort((a, b) => a.date - b.date).slice(0, 8);
  }, [assignments, courseExams]);

  const performanceSnapshot = useMemo(() => {
    let weightedAverageTotal = 0;
    let weightedAverageCount = 0;

    (courseExams || []).forEach((exam) => {
      const examId = String(exam?._id || "");
      const stats = getExamResultStats(examId);
      if (stats.gradedAttempts > 0) {
        weightedAverageTotal += Number(stats.averagePercentage || 0) * Number(stats.gradedAttempts || 0);
        weightedAverageCount += Number(stats.gradedAttempts || 0);
      }
    });

    const averageScore = weightedAverageCount > 0 ? Math.round(weightedAverageTotal / weightedAverageCount) : 0;

    const completionWeightTotal = assignments.reduce((sum, assignment) => {
      const weight = Number(assignment.totalStudents || 0) || Number(course?.students?.length || 0);
      return sum + weight;
    }, 0);
    const weightedCompletionTotal = assignments.reduce((sum, assignment) => {
      const weight = Number(assignment.totalStudents || 0) || Number(course?.students?.length || 0);
      return sum + Number(assignment.completionRate || 0) * weight;
    }, 0);
    const completionRate = completionWeightTotal > 0 ? Math.round(weightedCompletionTotal / completionWeightTotal) : 0;

    const activeAssignments = assignments.filter((assignment) => assignment.status === "active");
    const submittedTotal = activeAssignments.reduce((sum, assignment) => sum + Number(assignment.submittedCount || 0), 0);
    const expectedTotal = activeAssignments.reduce((sum, assignment) => {
      const expected = Number(assignment.totalStudents || 0);
      return sum + (expected > 0 ? expected : (course?.students?.length || 0));
    }, 0);
    const submissionRate = expectedTotal > 0 ? Math.round((submittedTotal / expectedTotal) * 100) : 0;

    return {
      averageScore,
      completionRate,
      submissionRate,
    };
  }, [assignments, course?.students?.length, courseExams, examResultStats]);

  const quickInsights = useMemo(() => {
    const insights: string[] = [];

    const pendingAssignments = assignments.reduce((sum, assignment) => sum + Number(assignment.pendingCount || 0), 0);
    if (pendingAssignments > 0) {
      insights.push(`${pendingAssignments} students have pending assignment submissions.`);
    }

    const lateAssignments = assignments.reduce((sum, assignment) => sum + Number(assignment.lateCount || 0), 0);
    if (lateAssignments > 0) {
      insights.push(`${lateAssignments} late submissions are waiting for review.`);
    }

    const examTrend = (courseExams || [])
      .map((exam) => {
        const examId = String(exam?._id || "");
        const stats = getExamResultStats(examId);
        const startDate = exam?.startDate || exam?.publishedAt || exam?.createdAt;
        const dateValue = startDate ? new Date(startDate).getTime() : 0;
        return {
          title: exam?.title || "Exam",
          average: Number(stats.averagePercentage || 0),
          attempts: Number(stats.gradedAttempts || 0),
          date: Number.isFinite(dateValue) ? dateValue : 0,
        };
      })
      .filter((row) => row.attempts > 0)
      .sort((a, b) => b.date - a.date)
      .slice(0, 2);

    if (examTrend.length >= 2 && examTrend[0].average < examTrend[1].average) {
      insights.push(`Average score dropped from ${examTrend[1].average}% to ${examTrend[0].average}% in the latest exam.`);
    }

    if (insights.length === 0) {
      insights.push("Great momentum: no urgent flags detected in this course right now.");
    }

    return insights.slice(0, 4);
  }, [assignments, courseExams, examResultStats]);

  const recentMaterials = useMemo(() => {
    return [...(course?.materials || [])]
      .sort((a, b) => {
        const left = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const right = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return right - left;
      })
      .slice(0, 6);
  }, [course?.materials]);

  const recentActivity = useMemo(() => {
    const items: Array<{ id: string; title: string; subtitle: string; at: number }> = [];

    (assignments || []).forEach((assignment) => {
      const createdAt = (assignment as any)?.createdAt ? new Date((assignment as any).createdAt).getTime() : NaN;
      const updatedAt = (assignment as any)?.updatedAt ? new Date((assignment as any).updatedAt).getTime() : NaN;
      const at = Number.isFinite(updatedAt) ? updatedAt : createdAt;
      if (!Number.isFinite(at)) return;
      items.push({
        id: `activity-assignment-${assignment._id}`,
        title: Number.isFinite(updatedAt) && Number.isFinite(createdAt) && updatedAt > createdAt ? "Assignment updated" : "Assignment created",
        subtitle: `${assignment.title} (${assignmentStatusMeta(assignment.status).label})`,
        at,
      });
    });

    (course?.materials || []).forEach((material) => {
      const at = material.uploadedAt ? new Date(material.uploadedAt).getTime() : NaN;
      if (!Number.isFinite(at)) return;
      items.push({
        id: `activity-material-${material._id}`,
        title: "Material uploaded",
        subtitle: material.title,
        at,
      });
    });

    (course?.announcements || []).forEach((announcement) => {
      const at = announcement.createdAt ? new Date(announcement.createdAt).getTime() : NaN;
      if (!Number.isFinite(at)) return;
      items.push({
        id: `activity-announcement-${announcement._id}`,
        title: "Announcement posted",
        subtitle: announcement.message,
        at,
      });
    });

    (course?.students || []).forEach((student) => {
      const source = student.enrollmentDate || student.createdAt;
      const at = source ? new Date(source).getTime() : NaN;
      if (!Number.isFinite(at)) return;
      items.push({
        id: `activity-student-${student._id}`,
        title: "Student added to course",
        subtitle: student.studentId?.name || "Student",
        at,
      });
    });

    return items.sort((a, b) => b.at - a.at).slice(0, 5);
  }, [assignments, course?.announcements, course?.materials, course?.students]);

  const totalAnnouncementStudents = course?.students?.length || 0;

  const announcementRows = useMemo(() => {
    const q = announcementSearch.trim().toLowerCase();
    const list = Array.isArray(course?.announcements) ? [...course.announcements] : [];

    const filtered = list.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const message = String(item.message || "").toLowerCase();
      const status = String(item.status || "published").toLowerCase();
      const seenCount = Array.isArray(item.seenBy) ? item.seenBy.length : 0;
      const unreadByStudents = totalAnnouncementStudents > 0 ? seenCount < totalAnnouncementStudents : false;
      const isImportant = item.priority === "important" || item.priority === "urgent";

      const matchesSearch = !q || title.includes(q) || message.includes(q);
      const matchesFilter = announcementFilter === "all"
        || (announcementFilter === "pinned" && Boolean(item.isPinned))
        || (announcementFilter === "scheduled" && status === "scheduled");
      const matchesUnread = !announcementUnreadOnly || unreadByStudents;
      const matchesImportant = !announcementImportantOnly || isImportant;
      return matchesSearch && matchesFilter && matchesUnread && matchesImportant;
    });

    filtered.sort((left, right) => {
      const leftTime = new Date(left.createdAt || left.updatedAt || 0).getTime();
      const rightTime = new Date(right.createdAt || right.updatedAt || 0).getTime();
      return announcementSort === "latest" ? rightTime - leftTime : leftTime - rightTime;
    });

    return filtered;
  }, [announcementFilter, announcementImportantOnly, announcementSearch, announcementSort, announcementUnreadOnly, course?.announcements, totalAnnouncementStudents]);

  const pinnedAnnouncementRows = useMemo(
    () => announcementRows.filter((item) => Boolean(item.isPinned)),
    [announcementRows]
  );

  const feedAnnouncementRows = useMemo(
    () => announcementRows.filter((item) => !item.isPinned),
    [announcementRows]
  );

  const getMaterialKind = (material: CourseDetails["materials"][number]) => {
    const type = String(material.type || "").toLowerCase();
    const url = String(material.url || "").toLowerCase();

    if (type === "pdf" || url.includes(".pdf")) return "pdf";
    if (type === "video" || url.includes("youtube") || url.includes("youtu.be") || url.includes("video")) return "video";
    if (type === "doc" || url.includes(".doc") || url.includes(".docx") || url.includes(".ppt") || url.includes(".pptx")) return "doc";
    return "link";
  };

  const materialCards = useMemo(() => {
    const list = Array.isArray(course?.materials) ? [...course.materials] : [];

    const filtered = list.filter((material) => {
      const title = String(material.title || "").toLowerCase();
      const url = String(material.url || "").toLowerCase();
      const description = String((material as any).description || "").toLowerCase();
      const kind = getMaterialKind(material);

      const matchesSearch = !materialSearch.trim()
        || title.includes(materialSearch.trim().toLowerCase())
        || url.includes(materialSearch.trim().toLowerCase())
        || description.includes(materialSearch.trim().toLowerCase());
      const matchesFilter = materialFilter === "all" || kind === materialFilter;

      return matchesSearch && matchesFilter;
    });

    filtered.sort((left, right) => {
      const leftTime = left.uploadedAt ? new Date(left.uploadedAt).getTime() : 0;
      const rightTime = right.uploadedAt ? new Date(right.uploadedAt).getTime() : 0;
      return materialSort === "latest" ? rightTime - leftTime : leftTime - rightTime;
    });

    return filtered;
  }, [course?.materials, materialSearch, materialFilter, materialSort]);

  const paginatedMaterials = useMemo(() => {
    const start = (materialPage - 1) * materialPageSize;
    return materialCards.slice(start, start + materialPageSize);
  }, [materialCards, materialPage, materialPageSize]);

  const materialTotalPages = Math.max(1, Math.ceil(materialCards.length / materialPageSize));

  useEffect(() => {
    setExamPage(1);
  }, [examFilter, examSearch, courseExams.length]);

  useEffect(() => {
    if (examPage > Math.max(1, Math.ceil(filteredCourseExams.length / examPageSize))) {
      setExamPage(1);
    }
  }, [examPage, examPageSize, filteredCourseExams.length]);

  useEffect(() => {
    setAssignmentPage(1);
  }, [assignmentSearch, assignmentFilter, assignments.length]);

  useEffect(() => {
    if (assignmentPage > Math.max(1, Math.ceil(filteredAssignments.length / assignmentPageSize))) {
      setAssignmentPage(1);
    }
  }, [assignmentPage, assignmentPageSize, filteredAssignments.length]);

  useEffect(() => {
    setMaterialPage(1);
  }, [materialFilter, materialSearch, materialSort, materialCards.length]);

  useEffect(() => {
    if (materialPage > Math.max(1, Math.ceil(materialCards.length / materialPageSize))) {
      setMaterialPage(1);
    }
  }, [materialPage, materialPageSize, materialCards.length]);

  const openMaterialModal = () => {
    setEditingMaterialId(null);
    resetMaterialForm();
    setMaterialModalOpen(true);
  };

  const openEditMaterialModal = (material: CourseDetails["materials"][number]) => {
    setEditingMaterialId(String(material._id));
    setMaterialFile(null);
    setMaterialForm({
      title: String(material.title || ""),
      type: (getMaterialKind(material) as "pdf" | "doc" | "video" | "link"),
      description: String((material as any).description || ""),
      url: String(material.url || ""),
    });
    setMaterialModalOpen(true);
  };

  const resetMaterialForm = () => {
    setEditingMaterialId(null);
    setMaterialForm({
      title: "",
      type: "link",
      description: "",
      url: "",
    });
    setMaterialFile(null);
  };

  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const getMaterialAccept = (type: "pdf" | "doc" | "video" | "link") => {
    if (type === "pdf") return "application/pdf,.pdf";
    if (type === "doc") return ".doc,.docx,.ppt,.pptx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (type === "video") return "video/*";
    return "";
  };

  const deleteMaterial = async (materialId: string, materialTitle?: string) => {
    const shouldDelete = window.confirm(`Delete material${materialTitle ? `: ${materialTitle}` : ""}?`);
    if (!shouldDelete) return;

    try {
      await coursesAPI.removeMaterial(courseId, materialId);
      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          materials: (prev.materials || []).filter((material) => String(material._id) !== String(materialId)),
        };
      });
      toast({ title: "Material deleted" });
    } catch (error: any) {
      toast({ title: "Failed to delete material", description: error?.message, variant: "destructive" });
    }
  };

  const addMaterial = async () => {
    if (!materialForm.title.trim()) return;
    try {
      setMaterialSubmitting(true);

      const isLinkType = materialForm.type === "link";
      const isVideoType = materialForm.type === "video";
      const isDocType = materialForm.type === "doc" || materialForm.type === "pdf";
      const normalizedUrl = normalizeUrl(materialForm.url);

      if (isLinkType && !normalizedUrl) {
        toast({
          title: "Link required",
          description: "Please enter a valid URL for Link type.",
          variant: "destructive",
        });
        return;
      }

      if (isVideoType && !normalizedUrl && !materialFile) {
        toast({
          title: "Video required",
          description: "For Video type, upload a file or provide a video URL.",
          variant: "destructive",
        });
        return;
      }

      if (isDocType && !materialFile && !normalizedUrl) {
        toast({
          title: "File required",
          description: `Please upload a ${materialForm.type.toUpperCase()} file.`,
          variant: "destructive",
        });
        return;
      }

      if (materialFile && materialForm.type === "pdf") {
        const maxPdfBytes = 10 * 1024 * 1024;
        const isPdfMime = materialFile.type === "application/pdf" || materialFile.name.toLowerCase().endsWith(".pdf");
        if (isPdfMime && materialFile.size > maxPdfBytes) {
          toast({
            title: "PDF too large",
            description: "Please compress this PDF below 10MB, then upload. Large PDFs can time out during upload.",
            variant: "destructive",
          });
          return;
        }
      }

      let url = normalizedUrl;
      if (materialFile) {
        url = await uploadFileToCloudinary(materialFile);
      }

      if (!url) {
        toast({
          title: "Material URL required",
          description: materialForm.type === "link" ? "Paste a link or upload a file first." : "Upload a file or add a URL.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        title: materialForm.title.trim(),
        url,
        type: materialForm.type,
        description: materialForm.description,
      } as any;

      if (editingMaterialId) {
        const updateRes = await coursesAPI.updateMaterial(courseId, editingMaterialId, payload);
        const updatedMaterial = updateRes?.data;
        if (updatedMaterial) {
          setCourse((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              materials: (prev.materials || []).map((item) => String(item._id) === String(editingMaterialId) ? updatedMaterial : item),
            };
          });
        }
      } else {
        const addRes = await coursesAPI.addMaterial(courseId, payload);
        const createdMaterial = addRes?.data;
        if (createdMaterial) {
          setCourse((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              materials: [...(prev.materials || []), createdMaterial],
            };
          });
        }
      }

      resetMaterialForm();
      setMaterialModalOpen(false);
      toast({ title: editingMaterialId ? "Material updated" : "Material added" });
    } catch (error: any) {
      toast({ title: "Failed to add material", description: error?.message, variant: "destructive" });
    } finally {
      setMaterialSubmitting(false);
    }
  };

  const resetAnnouncementComposer = () => {
    setEditingAnnouncementId(null);
    setAnnouncementUploadFiles([]);
    setAnnouncementLinkInput("");
    setAnnouncementVideoInput("");
    setAnnouncementAttachments([]);
    setAnnouncementForm({
      title: "",
      message: "",
      audienceScope: "all",
      batchText: "",
      selectedStudentIds: [],
      scheduleMode: "now",
      scheduledFor: "",
      priority: "normal",
      isPinned: false,
      notifyPush: true,
      notifyEmail: false,
      notifySilent: false,
    });
  };

  const addAnnouncementAttachmentLink = (type: "link" | "video") => {
    const source = type === "link" ? announcementLinkInput : announcementVideoInput;
    const normalized = normalizeUrl(source);
    if (!normalized) return;
    setAnnouncementAttachments((prev) => [...prev, { name: type === "video" ? "Video link" : "Reference link", url: normalized, type }]);
    if (type === "link") setAnnouncementLinkInput("");
    else setAnnouncementVideoInput("");
  };

  const toggleAnnouncementAudienceStudent = (studentId: string) => {
    setAnnouncementForm((prev) => ({
      ...prev,
      selectedStudentIds: prev.selectedStudentIds.includes(studentId)
        ? prev.selectedStudentIds.filter((id) => id !== studentId)
        : [...prev.selectedStudentIds, studentId],
    }));
  };

  const applyAnnouncementSnippet = (snippet: string) => {
    setAnnouncementForm((prev) => ({
      ...prev,
      message: `${prev.message}${prev.message ? "\n" : ""}${snippet}`,
    }));
  };

  const uploadAnnouncementFiles = async () => {
    if (!announcementUploadFiles.length) return [] as AnnouncementAttachment[];
    const uploaded = await Promise.all(
      announcementUploadFiles.map(async (file) => {
        const url = await uploadFileToCloudinary(file);
        const mime = String(file.type || "").toLowerCase();
        const kind: AnnouncementAttachment["type"] = mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : mime.includes("pdf") ? "pdf" : "link";
        return {
          name: file.name,
          url,
          type: kind,
        };
      })
    );
    return uploaded;
  };

  const formatRelativeTime = (value?: string) => {
    if (!value) return "just now";
    const ts = new Date(value).getTime();
    if (!Number.isFinite(ts)) return "just now";
    const diff = Date.now() - ts;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return "Just now";
    if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
    if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
    if (diff < day * 2) return "Yesterday";
    return new Date(value).toLocaleString();
  };

  const submitAnnouncement = async (mode: "draft" | "publish") => {
    if (!announcementForm.message.trim()) {
      toast({ title: "Announcement message is required", variant: "destructive" });
      return;
    }
    if (mode === "publish" && announcementForm.scheduleMode === "scheduled" && !announcementForm.scheduledFor) {
      toast({ title: "Pick a schedule date", description: "Choose when this announcement should be posted.", variant: "destructive" });
      return;
    }

    setAnnouncementSubmitting(true);
    try {
      const uploaded = await uploadAnnouncementFiles();
      const combinedAttachments = [...announcementAttachments, ...uploaded];
      const batches = announcementForm.batchText
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      const status = mode === "draft"
        ? "draft"
        : announcementForm.scheduleMode === "scheduled"
          ? "scheduled"
          : "published";

      const payload = {
        title: announcementForm.title.trim(),
        message: announcementForm.message,
        attachments: combinedAttachments,
        audience: {
          scope: announcementForm.audienceScope,
          batches: announcementForm.audienceScope === "batch" ? batches : [],
          studentIds: announcementForm.audienceScope === "students" ? announcementForm.selectedStudentIds : [],
        },
        schedule: {
          mode: announcementForm.scheduleMode,
          scheduledFor: announcementForm.scheduleMode === "scheduled" && announcementForm.scheduledFor
            ? new Date(announcementForm.scheduledFor).toISOString()
            : null,
        },
        priority: announcementForm.priority,
        isPinned: announcementForm.isPinned,
        notification: {
          push: announcementForm.notifyPush,
          email: announcementForm.notifyEmail,
          silent: announcementForm.notifySilent,
        },
        status,
      };

      if (editingAnnouncementId) {
        await coursesAPI.updateAnnouncement(courseId, editingAnnouncementId, payload);
      } else {
        await coursesAPI.addAnnouncement(courseId, payload);
      }

      await loadData();
      resetAnnouncementComposer();
      setAnnouncementComposerOpen(false);
      setAnnouncementPreviewOpen(false);
      toast({ title: status === "draft" ? "Draft saved" : status === "scheduled" ? "Announcement scheduled" : "Announcement published" });
    } catch (error: any) {
      toast({ title: "Failed to save announcement", description: error?.message, variant: "destructive" });
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const editAnnouncement = (item: CourseAnnouncement) => {
    setEditingAnnouncementId(item._id);
    setAnnouncementComposerOpen(true);
    setAnnouncementAttachments(Array.isArray(item.attachments) ? item.attachments : []);
    setAnnouncementUploadFiles([]);
    setAnnouncementLinkInput("");
    setAnnouncementVideoInput("");
    setAnnouncementForm({
      title: item.title || "",
      message: item.message || "",
      audienceScope: item.audience?.scope || "all",
      batchText: Array.isArray(item.audience?.batches) ? item.audience?.batches.join(", ") : "",
      selectedStudentIds: Array.isArray(item.audience?.studentIds) ? item.audience.studentIds : [],
      scheduleMode: item.schedule?.mode || "now",
      scheduledFor: item.schedule?.scheduledFor ? new Date(item.schedule.scheduledFor).toISOString().slice(0, 16) : "",
      priority: item.priority || "normal",
      isPinned: Boolean(item.isPinned),
      notifyPush: item.notification?.push ?? true,
      notifyEmail: item.notification?.email ?? false,
      notifySilent: item.notification?.silent ?? false,
    });
  };

  const removeAnnouncementCard = async (announcementId: string) => {
    const confirmed = window.confirm("Delete this announcement?");
    if (!confirmed) return;
    try {
      await coursesAPI.removeAnnouncement(courseId, announcementId);
      await loadData();
      toast({ title: "Announcement deleted" });
    } catch (error: any) {
      toast({ title: "Failed to delete announcement", description: error?.message, variant: "destructive" });
    }
  };

  const duplicateAnnouncementCard = async (announcementId: string) => {
    try {
      await coursesAPI.duplicateAnnouncement(courseId, announcementId);
      await loadData();
      toast({ title: "Announcement duplicated" });
    } catch (error: any) {
      toast({ title: "Failed to duplicate announcement", description: error?.message, variant: "destructive" });
    }
  };

  const toggleAnnouncementPin = async (item: CourseAnnouncement) => {
    try {
      await coursesAPI.updateAnnouncement(courseId, item._id, { isPinned: !item.isPinned });
      await loadData();
      toast({ title: item.isPinned ? "Announcement unpinned" : "Announcement pinned" });
    } catch (error: any) {
      toast({ title: "Failed to update pin", description: error?.message, variant: "destructive" });
    }
  };

  const loadTeacherStudents = async () => {
    setLoadingTeacherStudents(true);
    try {
      const res = await teacherAPI.getStudents();
      const students = Array.isArray(res?.data) ? res.data : [];
      setTeacherStudents(students);
    } catch (error: any) {
      toast({ title: "Failed to load students", description: error?.message, variant: "destructive" });
      setTeacherStudents([]);
    } finally {
      setLoadingTeacherStudents(false);
    }
  };

  const openStudentModal = async () => {
    setStudentModalOpen(true);
    setStudentFlow("menu");
    setStudentSearch("");
    setBulkFileName("");
    setBulkRows([]);
    setBulkHeaderError("");
    setBulkValidated(false);
    setInviteLink("");
    await loadTeacherStudents();
  };

  const openManualStudentFlow = async () => {
    setStudentFlow("manual");
    if (teacherStudents.length === 0) {
      await loadTeacherStudents();
    }
  };

  const enrollStudentToCourse = async (studentId: string) => {
    try {
      setEnrollingStudentId(studentId);
      await coursesAPI.addStudent(courseId, { studentId, status: "active" });
      await loadData();
      setTeacherStudents((prev) => prev.filter((student) => String(student._id) !== String(studentId)));
      toast({ title: "Student added to course" });
    } catch (error: any) {
      toast({ title: "Failed to add student", description: error?.message, variant: "destructive" });
    } finally {
      setEnrollingStudentId(null);
    }
  };

  const parseBulkCsvText = (text: string, fileName: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length <= 1) {
      setBulkFileName(fileName);
      setBulkRows([]);
      setBulkHeaderError("CSV must include a header and at least one row.");
      setBulkValidated(false);
      return;
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const emailIdx = headers.indexOf("email");
    const nameIdx = headers.indexOf("name");
    const statusIdx = headers.indexOf("status");

    if (emailIdx < 0) {
      setBulkFileName(fileName);
      setBulkRows([]);
      setBulkHeaderError("CSV header must contain an 'email' column.");
      setBulkValidated(false);
      return;
    }

    const parsedRows: BulkStudentRow[] = lines.slice(1).map((line, idx) => {
      const cols = parseCsvLine(line);
      const email = String(cols[emailIdx] || "").trim();
      const name = nameIdx >= 0 ? String(cols[nameIdx] || "").trim() : "";
      const statusRaw = statusIdx >= 0 ? String(cols[statusIdx] || "").trim().toLowerCase() : "active";
      const status: "active" | "pending" = statusRaw === "pending" ? "pending" : "active";
      const errors: string[] = [];

      if (!email) {
        errors.push("Email is required.");
      }

      return {
        rowNumber: idx + 2,
        name,
        email,
        status,
        errors,
      };
    });

    setBulkFileName(fileName);
    setBulkRows(parsedRows);
    setBulkHeaderError("");
    setBulkValidated(false);
  };

  const handleBulkFileChange = async (file?: File | null) => {
    if (!file) return;
    const text = await file.text();
    parseBulkCsvText(text, file.name);
  };

  const handleBulkDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setBulkDragActive(false);
    const file = event.dataTransfer.files?.[0];
    await handleBulkFileChange(file || null);
  };

  const validateBulkRows = () => {
    if (bulkRows.length === 0) {
      toast({ title: "No rows to validate", variant: "destructive" });
      return;
    }

    const teacherByEmail = new Map<string, TeacherStudent>();
    teacherStudents.forEach((student) => {
      if (student.email) {
        teacherByEmail.set(student.email.trim().toLowerCase(), student);
      }
    });

    const seen = new Set<string>();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validated = bulkRows.map((row) => {
      const errors = [...row.errors.filter(Boolean)];
      const normalizedEmail = row.email.trim().toLowerCase();
      let studentId: string | undefined;

      if (!emailRegex.test(normalizedEmail)) {
        errors.push("Invalid email format.");
      }

      if (seen.has(normalizedEmail)) {
        errors.push("Duplicate email in CSV.");
      } else {
        seen.add(normalizedEmail);
      }

      const matched = teacherByEmail.get(normalizedEmail);
      if (!matched) {
        errors.push("Student not found under your teacher account.");
      } else {
        studentId = matched._id;
        if (enrolledStudentIds.has(String(matched._id))) {
          errors.push("Already enrolled in this course.");
        }
      }

      return {
        ...row,
        studentId,
        errors,
      };
    });

    setBulkRows(validated);
    setBulkValidated(true);
    toast({ title: "Validation complete", description: `${validated.filter((r) => r.errors.length === 0).length} row(s) ready to import.` });
  };

  const confirmBulkImport = async () => {
    if (!bulkValidated) {
      toast({ title: "Validate data first", variant: "destructive" });
      return;
    }

    if (importableBulkRows.length === 0) {
      toast({ title: "No valid rows to import", variant: "destructive" });
      return;
    }

    setBulkImporting(true);
    let success = 0;
    let failed = 0;

    for (const row of importableBulkRows) {
      try {
        await coursesAPI.addStudent(courseId, {
          studentId: row.studentId as string,
          status: row.status,
        });
        success += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkImporting(false);
    await loadData();
    await loadTeacherStudents();
    validateBulkRows();
    toast({ title: "Bulk import completed", description: `${success} imported, ${failed} failed.` });
  };

  const downloadBulkTemplate = () => {
    const csv = [
      "email,name,status",
      "student1@example.com,Student One,active",
      "student2@example.com,Student Two,pending",
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${course?.title || "course"}_bulk_import_template.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const exportFailedBulkRows = () => {
    const failedRows = bulkRows.filter((row) => row.errors.length > 0);
    if (failedRows.length === 0) {
      toast({ title: "No failed rows to export", variant: "destructive" });
      return;
    }

    const csvLines = [
      "rowNumber,email,name,status,errors",
      ...failedRows.map((row) => [
        row.rowNumber,
        `"${String(row.email || "").replace(/"/g, '""')}"`,
        `"${String(row.name || "").replace(/"/g, '""')}"`,
        row.status,
        `"${row.errors.join(" | ").replace(/"/g, '""')}"`,
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${course?.title || "course"}_bulk_import_failed_rows.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const generateInviteLink = async () => {
    try {
      setGeneratingInvite(true);
      const res = await coursesAPI.generateInviteLink(courseId);
      const token = res?.data?.token;
      const joinPath = res?.data?.joinPath;
      const fullLink = joinPath
        ? `${window.location.origin}${joinPath}`
        : `${window.location.origin}/course-join/${token}`;
      setInviteLink(fullLink);
      toast({ title: "Invite link generated" });
    } catch (error: any) {
      toast({ title: "Failed to generate invite link", description: error?.message, variant: "destructive" });
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({ title: "Invite link copied" });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const openStudentPerformance = async (entry: CourseDetails["students"][number]) => {
    setSelectedCourseStudent(entry);
    const studentId = entry.studentId?._id;
    if (!studentId) return;
    navigate(`/teacher/courses/${courseId}/students/${studentId}/performance`);
  };

  const removeStudentFromCourse = async (entry: CourseDetails["students"][number]) => {
    const studentId = entry.studentId?._id;
    if (!studentId) return;
    try {
      await coursesAPI.removeStudent(courseId, studentId);
      toast({ title: "Student removed from course" });
      setCourse((current) => {
        if (!current) return current;
        return {
          ...current,
          students: (current.students || []).filter((student) => String(student.studentId?._id || student._id) !== studentId),
        };
      });
      if (selectedCourseStudent?.studentId?._id === studentId) {
        setSelectedCourseStudent(null);
        setStudentProfileOpen(false);
      }
    } catch (error: any) {
      toast({ title: "Failed to remove student", description: error?.message, variant: "destructive" });
    }
  };

  const updateStudentEnrollmentStatus = async (
    entry: CourseDetails["students"][number],
    nextStatus: "active" | "pending" | "hold"
  ) => {
    const studentId = entry.studentId?._id;
    if (!studentId) return;

    try {
      const res = await coursesAPI.updateStudentStatus(courseId, studentId, nextStatus);
      const updated = res?.data;

      setCourse((current) => {
        if (!current) return current;
        return {
          ...current,
          students: (current.students || []).map((row) => {
            const rowStudentId = String(row.studentId?._id || row._id || "");
            if (rowStudentId !== String(studentId)) return row;
            return {
              ...row,
              status: updated?.status || nextStatus,
              enrollmentDate: updated?.enrollmentDate || row.enrollmentDate,
            };
          }),
        };
      });

      if (selectedCourseStudent?.studentId?._id === studentId) {
        setSelectedCourseStudent((current) => {
          if (!current) return current;
          return {
            ...current,
            status: updated?.status || nextStatus,
            enrollmentDate: updated?.enrollmentDate || current.enrollmentDate,
          };
        });
      }

      toast({ title: nextStatus === "active" ? "Student approved" : nextStatus === "hold" ? "Student put on hold" : "Student set to pending" });
    } catch (error: any) {
      toast({ title: "Failed to update status", description: error?.message, variant: "destructive" });
    }
  };

  const enrollmentStatusMeta = (status?: string) => {
    const value = String(status || "pending").toLowerCase();
    if (value === "active") return { label: "Approved", className: "bg-emerald-500/15 text-emerald-500" };
    if (value === "hold") return { label: "Hold", className: "bg-amber-500/20 text-amber-500" };
    return { label: "Pending", className: "bg-zinc-500/20 text-zinc-400" };
  };

  const openStudentDrawer = async (entry: CourseDetails["students"][number], tab: "overview" | "exams" | "assignments" = "overview") => {
    setSelectedCourseStudent(entry);
    setStudentProfileOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <BeautifulLoader message="Loading course details..." className="min-h-[260px] w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card><CardContent className="p-5"><div className="h-4 w-24 animate-pulse rounded bg-muted" /><div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" /></CardContent></Card>
          <Card><CardContent className="p-5"><div className="h-4 w-24 animate-pulse rounded bg-muted" /><div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" /></CardContent></Card>
          <Card><CardContent className="p-5"><div className="h-4 w-24 animate-pulse rounded bg-muted" /><div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!course) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Course not found.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7 h-auto bg-transparent p-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <Card className="overflow-hidden border-primary/20">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Course Header</p>
                  <h2 className="text-3xl font-bold tracking-tight">{course.title}</h2>
                  <p className="text-sm text-muted-foreground">Subject / Level: {subjectLevelText}</p>
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    {course.description?.trim() || "Build and manage learning flow with exams, assignments, materials, and student progress tracking."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Total Students</p><Users className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-bold">{course.students?.length || 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Total Exams</p><ClipboardList className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-bold">{courseExams.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Total Assignments</p><FileText className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-bold">{assignments.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Total Materials</p><Paperclip className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-bold">{course.materials?.length || 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Active Students</p><GraduationCap className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-bold">{activeStudentsCount}</p></CardContent></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Upcoming Tasks / Deadlines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {upcomingTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming tasks. You are all caught up.</p>
                  ) : (
                    upcomingTasks.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-primary">{item.type}</p>
                          <p className="text-xs text-muted-foreground">{item.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentSubmissionRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Submission activity will appear as students submit assignments and exams.</p>
                  ) : (
                    recentSubmissionRows.map((signal) => (
                      <div key={signal.id} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{signal.studentName}</p>
                          <p className="text-xs text-muted-foreground">{signal.itemName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{signal.submittedAt ? new Date(signal.submittedAt).toLocaleString() : "-"}</p>
                          <p className="text-xs font-medium capitalize">{signal.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Gauge className="h-4 w-4" /> Course Performance Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"><span>Average Score</span><span className="font-semibold">{performanceSnapshot.averageScore}%</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"><span>Completion Rate</span><span className="font-semibold">{performanceSnapshot.completionRate}%</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"><span>Submission Rate</span><span className="font-semibold">{performanceSnapshot.submissionRate}%</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Quick Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickInsights.map((insight, index) => (
                    <div key={`${insight}-${index}`} className="rounded-lg border border-border/70 px-3 py-2 text-sm text-muted-foreground">
                      {insight}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> Recent Materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentMaterials.length === 0 ? (
                <p className="text-sm text-muted-foreground">No materials uploaded yet.</p>
              ) : (
                recentMaterials.map((material) => {
                  const kind = getMaterialKind(material);
                  const kindLabel = kind === "pdf" ? "PDF" : kind === "video" ? "Video" : kind === "doc" ? "Doc" : "Link";
                  return (
                    <div key={material._id} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{material.title}</p>
                        <p className="text-xs text-muted-foreground">{material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString() : "Recently"}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{kindLabel}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="relative pl-5">
                      <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-primary" />
                      <div className="rounded-lg border border-border/70 px-3 py-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(item.at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="overflow-hidden">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Course Students</CardTitle>
                <Button onClick={openStudentModal}><UserPlus className="mr-2 h-4 w-4" /> Add Student</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {courseStudentRows.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">No students enrolled yet.</p>
              ) : (
                <div className="no-scrollbar max-w-full overflow-x-auto overflow-y-hidden px-6 pb-6">
                  <table className="w-full min-w-[980px] table-fixed text-sm">
                    <thead>
                      <tr className="border-b border-border/70 text-left text-muted-foreground">
                      <th className="py-3 pr-4">Student Name</th>
                      <th className="py-3 pr-4">Email / ID</th>
                      <th className="py-3 pr-4">Joined Date</th>
                      <th className="py-3 pr-4">Progress</th>
                      <th className="py-3 pr-4">Last Activity</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudentRows.map((entry) => {
                        const student = entry.studentId;
                        const initials = (student?.name || "?")
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("") || "?";
                        const progressPercent = entry.progressPercentage ?? 0;
                        const joinedDate = entry.enrollmentDate || entry.createdAt;
                        const lastActivityAt = entry.lastActivityAt || joinedDate;
                        const enrollmentStatus = enrollmentStatusMeta(String(entry.status || "pending"));

                        return (
                          <tr
                            key={entry._id}
                            className="border-b border-border/40 align-middle transition hover:bg-muted/30"
                            onClick={() => openStudentDrawer(entry)}
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={student?.avatar || ""} alt={student?.name || "Student"} />
                                  <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{student?.name || "Unknown"}</p>
                                  <p className="truncate text-xs text-muted-foreground">Course student</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="truncate">{student?.email || "N/A"}</p>
                              <p className="truncate text-xs text-muted-foreground">{student?._id || entry._id}</p>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{joinedDate ? new Date(joinedDate).toLocaleDateString() : "-"}</td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 rounded-full bg-muted">
                                  <div className="h-2 rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{progressPercent}%</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{lastActivityAt ? new Date(lastActivityAt).toLocaleString() : "-"}</td>
                            <td className="py-3 pr-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${enrollmentStatus.className}`}>
                                {enrollmentStatus.label}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => openStudentDrawer(entry, "overview")}>View Profile</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStudentEnrollmentStatus(entry, "active")}>Approve</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStudentEnrollmentStatus(entry, "hold")}>Hold</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStudentEnrollmentStatus(entry, "pending")}>Move to Pending</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => removeStudentFromCourse(entry)} className="text-destructive focus:text-destructive">
                                    Delete Request / Remove
                                  </DropdownMenuItem>
                                  <DropdownMenuItem disabled className="text-muted-foreground">Message (coming soon)</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={studentModalOpen} onOpenChange={setStudentModalOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {studentFlow === "menu" && "Add Student"}
                  {studentFlow === "manual" && "Add Manually"}
                  {studentFlow === "bulk" && "Bulk Import (CSV)"}
                  {studentFlow === "invite" && "Invite via Link"}
                </DialogTitle>
              </DialogHeader>
              {studentFlow === "menu" && (
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full rounded-md border border-border/70 p-4 text-left transition hover:bg-muted/40"
                    onClick={openManualStudentFlow}
                  >
                    <p className="font-medium">Add Manually</p>
                    <p className="text-sm text-muted-foreground">Browse teacher students who are not enrolled in this course.</p>
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-md border border-border/70 p-4 text-left transition hover:bg-muted/40"
                    onClick={() => setStudentFlow("bulk")}
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <p className="font-medium">Bulk Import (CSV)</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Upload a CSV file to enroll multiple students at once.</p>
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-md border border-border/70 p-4 text-left transition hover:bg-muted/40"
                    onClick={() => setStudentFlow("invite")}
                  >
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      <p className="font-medium">Invite via Link</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Generate and share a unique join link for this course.</p>
                  </button>
                </div>
              )}

              {studentFlow === "manual" && (
                <div className="space-y-3">
                  <Button variant="outline" size="sm" onClick={() => setStudentFlow("menu")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Input
                    placeholder="Search by student name or email"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border border-border/70 p-2">
                    {loadingTeacherStudents ? (
                      <p className="p-2 text-sm text-muted-foreground">Loading students...</p>
                    ) : availableStudents.length === 0 ? (
                      <p className="p-2 text-sm text-muted-foreground">No available students found. Already enrolled students are hidden.</p>
                    ) : (
                      availableStudents.map((student) => (
                        <div key={student._id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => enrollStudentToCourse(student._id)}
                            disabled={enrollingStudentId === student._id}
                          >
                            {enrollingStudentId === student._id ? "Adding..." : "Add"}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {studentFlow === "bulk" && (
                <div className="space-y-3">
                  <Button variant="outline" size="sm" onClick={() => setStudentFlow("menu")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={downloadBulkTemplate}>Download CSV Template</Button>
                    <Button variant="outline" onClick={exportFailedBulkRows} disabled={bulkRows.filter((row) => row.errors.length > 0).length === 0}>Export Failed Rows</Button>
                  </div>
                  <div
                    className={`rounded-lg border-2 border-dashed p-5 text-center transition ${bulkDragActive ? "border-primary bg-primary/5" : "border-border/70 bg-muted/20"}`}
                    onDragEnter={(e) => { e.preventDefault(); setBulkDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); setBulkDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setBulkDragActive(false); }}
                    onDrop={handleBulkDrop}
                  >
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 font-medium">Drag and drop CSV here</p>
                    <p className="text-sm text-muted-foreground">or click to choose a file</p>
                    <Input
                      type="file"
                      accept=".csv,text/csv"
                      className="mt-3 cursor-pointer"
                      onChange={(e) => handleBulkFileChange(e.target.files?.[0] || null)}
                    />
                  </div>
                  {bulkFileName && <p className="text-xs text-muted-foreground">File: {bulkFileName}</p>}
                  {bulkHeaderError && <p className="text-sm text-destructive">{bulkHeaderError}</p>}

                  {!!bulkRows.length && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={validateBulkRows}>Validate Data</Button>
                        <Button onClick={confirmBulkImport} disabled={!bulkValidated || importableBulkRows.length === 0 || bulkImporting}>
                          {bulkImporting ? "Importing..." : "Confirm Import"}
                        </Button>
                        <p className="ml-auto text-xs text-muted-foreground">Ready: {importableBulkRows.length} / {bulkRows.length}</p>
                      </div>

                      <div className="max-h-80 overflow-auto rounded-md border border-border/70">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/70 text-left text-muted-foreground">
                              <th className="px-3 py-2">Row</th>
                              <th className="px-3 py-2">Email</th>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Validation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkRows.map((row) => (
                              <tr key={`${row.rowNumber}-${row.email}`} className="border-b border-border/50">
                                <td className="px-3 py-2">{row.rowNumber}</td>
                                <td className="px-3 py-2">{row.email || "-"}</td>
                                <td className="px-3 py-2">{row.name || "-"}</td>
                                <td className="px-3 py-2 capitalize">{row.status}</td>
                                <td className="px-3 py-2">
                                  {row.errors.length === 0 ? (
                                    <span className="text-emerald-600">Valid</span>
                                  ) : (
                                    <span className="text-destructive">{row.errors.join(" ")}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {studentFlow === "invite" && (
                <div className="space-y-3">
                  <Button variant="outline" size="sm" onClick={() => setStudentFlow("menu")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <div className="space-y-3 rounded-md border border-border/70 p-4">
                    <p className="text-sm text-muted-foreground">Generate a unique course join link and share it with students assigned to you.</p>
                    <div className="flex gap-2">
                      <Button onClick={generateInviteLink} disabled={generatingInvite}>{generatingInvite ? "Generating..." : "Generate Course Link"}</Button>
                      <Button variant="outline" onClick={copyInviteLink} disabled={!inviteLink}>Copy Link</Button>
                    </div>
                    <Input value={inviteLink} readOnly placeholder="Generated invite link will appear here" />
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Drawer open={studentProfileOpen} onOpenChange={setStudentProfileOpen}>
            <DrawerContent className="left-auto right-0 top-0 mt-0 h-full w-full max-w-3xl rounded-none border-l sm:max-w-4xl">
              <div className="flex h-full flex-col overflow-hidden">
                <DrawerHeader className="border-b border-border/70 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-left text-white">
                  <DrawerTitle>Student Profile</DrawerTitle>
                  <DrawerDescription className="text-white/70">
                    {selectedCourseStudent?.studentId?.name || "Student"} in {course?.title || "this course"}
                  </DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {selectedCourseStudent?.studentId ? (
                    <div className="space-y-5">
                      <div className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-lg">
                        <div className="relative p-5 sm:p-6">
                          <div className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
                          <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16 border border-white/20 shadow-lg">
                                <AvatarImage src={selectedCourseStudent.studentId.avatar || ""} alt={selectedCourseStudent.studentId.name} />
                                <AvatarFallback>{selectedCourseStudent.studentId.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/65">Student Profile</p>
                                <h3 className="text-2xl font-semibold leading-tight">{selectedCourseStudent.studentId.name}</h3>
                                <p className="mt-1 flex items-center gap-2 text-sm text-white/75">
                                  <Activity className="h-4 w-4" /> {selectedCourseStudent.studentId.email}
                                </p>
                                <p className="mt-1 text-xs text-white/55 break-all">{selectedCourseStudent.studentId._id}</p>
                              </div>
                            </div>

                            <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${String(selectedCourseStudent.status || "pending") === "active" ? "bg-emerald-400/20 text-emerald-200" : String(selectedCourseStudent.status || "pending") === "hold" ? "bg-amber-400/20 text-amber-200" : "bg-white/15 text-white/80"}`}>
                              {String(selectedCourseStudent.status || "pending") === "active" ? "Approved" : String(selectedCourseStudent.status || "pending") === "hold" ? "Hold" : "Pending"}
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                              <p className="text-xs text-white/65">Course Progress</p>
                              <p className="text-2xl font-semibold">{selectedCourseStudent.progressPercentage ?? 0}%</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                              <p className="text-xs text-white/65">Exams Attempted</p>
                              <p className="text-2xl font-semibold">{selectedCourseStudent.completedExams ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                              <p className="text-xs text-white/65">Average Score</p>
                              <p className="text-2xl font-semibold">{selectedCourseStudent.averagePercentage ?? 0}%</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                              <p className="text-xs text-white/65">Last Activity</p>
                              <p className="text-sm font-semibold">{selectedCourseStudent.lastActivityAt ? new Date(selectedCourseStudent.lastActivityAt).toLocaleDateString() : "-"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card className="border-border/70 shadow-sm">
                          <CardContent className="space-y-4 p-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <GraduationCap className="h-4 w-4 text-primary" /> Student Information
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                                <p className="text-xs text-muted-foreground">Joined Date</p>
                                <p className="mt-1 font-semibold">{selectedCourseStudent.enrollmentDate ? new Date(selectedCourseStudent.enrollmentDate).toLocaleDateString() : "-"}</p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                                <p className="text-xs text-muted-foreground">Enrollment Status</p>
                                <p className="mt-1 font-semibold capitalize">{String(selectedCourseStudent.status || "pending") === "active" ? "Approved" : String(selectedCourseStudent.status || "pending") === "hold" ? "Hold" : "Pending"}</p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 sm:col-span-2">
                                <p className="text-xs text-muted-foreground">Student ID</p>
                                <p className="mt-1 break-all font-semibold">{selectedCourseStudent.studentId._id}</p>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs text-muted-foreground">Course</p>
                              <p className="mt-1 font-semibold">{course?.title || "-"}</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-border/70 shadow-sm">
                          <CardContent className="space-y-4 p-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Gauge className="h-4 w-4 text-primary" /> Learning Snapshot
                            </div>

                            <div>
                              <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Completion</span>
                                <span className="font-medium">{selectedCourseStudent.completedExams ?? 0}/{selectedCourseStudent.totalExams ?? 0} exams</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted">
                                <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-primary to-amber-500" style={{ width: `${Math.max(0, Math.min(100, selectedCourseStudent.progressPercentage ?? 0))}%` }} />
                              </div>
                            </div>

                            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4">
                              <p className="text-sm font-medium">Performance</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Open the performance page for exam scores, weak areas, and attempt history.
                              </p>
                              <Button className="mt-3 w-full" onClick={() => openStudentPerformance(selectedCourseStudent)}>
                                <ArrowLeft className="mr-2 h-4 w-4 rotate-180" /> Open Performance Page
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Student details unavailable.</p>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </TabsContent>

        <TabsContent value="exams">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Exams</CardTitle>
                  <p className="text-sm text-muted-foreground">Beautiful exam cards with real stats, hover actions, and quick publishing controls.</p>
                </div>
                <Button onClick={openCreateExamBuilder}><Plus className="mr-2 h-4 w-4" /> Create Exam</Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Total Exams</p>
                  <p className="mt-1 text-2xl font-semibold">{examSummary.total}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-600">{examSummary.published}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Draft / Scheduled</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-700">{examSummary.draft + examSummary.scheduled}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Attempts</p>
                  <p className="mt-1 text-2xl font-semibold text-primary">{examSummary.attempts}</p>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <Input
                  value={examSearch}
                  onChange={(event) => setExamSearch(event.target.value)}
                  placeholder="Search exams by title or description"
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={examFilter}
                  onChange={(event) => setExamFilter(event.target.value as typeof examFilter)}
                >
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredCourseExams.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                  {paginatedCourseExams.map((exam: any) => {
                    const examId = String(exam?._id || "");
                    const status = statusLabel(exam.status);
                    const stats = getExamResultStats(examId);
                    const questionCount = getExamQuestionIds(exam).length;
                    const attemptRate = stats.attempts > 0 ? Math.round((stats.gradedAttempts / stats.attempts) * 100) : 0;
                    const isLive = status === "Published";

                    return (
                      <div
                        key={examId}
                        className={sharedSurfaceCardClass}
                        style={sharedSurfaceCardShadow}
                      >
                        <div className={`h-1 w-full ${isLive ? "bg-emerald-500" : status === "Scheduled" ? "bg-amber-500" : "bg-zinc-400"}`} />
                        <div className="p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              onClick={() => openExamPreview(exam)}
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isLive ? "bg-emerald-100 text-emerald-700" : status === "Scheduled" ? "bg-amber-100 text-amber-700" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}`}>
                                  {status}
                                </span>
                                <span className="rounded-full border border-zinc-200/80 bg-white/70 px-2 py-1 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300">
                                  {String(exam.accessType || "all") === "specific" ? "Course only" : "Open access"}
                                </span>
                              </div>

                              <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug">{exam.title}</h3>
                              <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                                {exam.description || "No description yet. Open the card to review settings and questions."}
                              </p>
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 opacity-70 transition hover:opacity-100"
                                  onClick={(event) => event.stopPropagation()}
                                  disabled={actionExamId === examId}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                                <DropdownMenuItem onClick={() => openExamPreview(exam)}>
                                  <Eye className="mr-2 h-4 w-4" /> Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openExamModal(examId, "edit")}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleExamPublish(exam)}>
                                  {isLive ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                                  {isLive ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => duplicateExam(exam)}>
                                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => removeExamFromCourse(exam)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Remove from Course
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteExamPermanently(exam)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2.5 text-sm">
                            <div className="rounded-xl border border-zinc-200/80 bg-white/75 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">Questions</p>
                              <p className="mt-0.5 text-base font-semibold">{questionCount}</p>
                            </div>
                            <div className="rounded-xl border border-zinc-200/80 bg-white/75 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">Duration</p>
                              <p className="mt-0.5 text-base font-semibold">{formatDuration(exam.duration)}</p>
                            </div>
                            <div className="rounded-xl border border-zinc-200/80 bg-white/75 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">Attempts</p>
                              <p className="mt-0.5 text-base font-semibold">{stats.attempts}</p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                              <BarChart3 className="h-3.5 w-3.5" /> Avg {stats.averagePercentage}%
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                              <Clock3 className="h-3.5 w-3.5" /> {stats.latestSubmittedAt ? new Date(stats.latestSubmittedAt).toLocaleDateString() : "No attempts yet"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                              {attemptRate}% graded
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                            <Button size="sm" variant="secondary" onClick={(event) => { event.stopPropagation(); openExamPreview(exam); }} disabled={actionExamId === examId}>
                              <Eye className="mr-2 h-4 w-4" /> Preview
                            </Button>
                            <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); openExamModal(examId, "edit"); }} disabled={actionExamId === examId}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button size="sm" onClick={(event) => { event.stopPropagation(); toggleExamPublish(exam); }} disabled={actionExamId === examId}>
                              {isLive ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                              {isLive ? "Unpublish" : "Publish"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No exams match the selected search or filter.</p>
              )}
              {filteredCourseExams.length > 0 && (
                <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground">
                  <p>Page {examPage} of {examTotalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setExamPage((prev) => Math.max(1, prev - 1))} disabled={examPage <= 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setExamPage((prev) => Math.min(examTotalPages, prev + 1))} disabled={examPage >= examTotalPages}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <ExamCreationModal
            open={examModalOpen}
            onOpenChange={setExamModalOpen}
            initialExam={activeExam}
            mode="edit"
            initialTab={examModalTab}
            scopedUsers={courseScopedUsers}
            enforceSpecificAccess
            selectedQuestionIds={activeExam?.questionIds?.map((q: any) => q._id || q) || []}
            onSuccess={async () => {
              try {
                await loadData();
              } catch (error: any) {
                toast({ title: "Failed to refresh exams", description: error?.message, variant: "destructive" });
              }
            }}
          />

          <Dialog
            open={previewOpen}
            onOpenChange={(open) => {
              setPreviewOpen(open);
              if (!open) {
                setPreviewLoading(false);
                setPreviewExam(null);
              }
            }}
          >
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{previewExam?.title || "Exam Preview"}</DialogTitle>
              </DialogHeader>

              {previewLoading ? (
                <div className="space-y-3 py-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-20 animate-pulse rounded-xl border border-border/60 bg-muted/40" />
                  <div className="h-20 animate-pulse rounded-xl border border-border/60 bg-muted/40" />
                </div>
              ) : (
                <div className="no-scrollbar max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                      <p className="text-muted-foreground">Questions</p>
                      <p className="mt-0.5 text-sm font-semibold">{Array.isArray(previewExam?.questionIds) ? previewExam.questionIds.length : 0}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                      <p className="text-muted-foreground">Duration</p>
                      <p className="mt-0.5 text-sm font-semibold">{formatDuration(previewExam?.duration)}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                      <p className="text-muted-foreground">Total Marks</p>
                      <p className="mt-0.5 text-sm font-semibold">{previewExam?.totalMarks ?? 0}</p>
                    </div>
                  </div>

                  {Array.isArray(previewExam?.questionIds) && previewExam.questionIds.length > 0 ? (
                    <div className="space-y-3">
                      {previewExam.questionIds.map((question: any, index: number) => {
                        const questionId = String(question?._id || question || index);
                        const optionCount = Array.isArray(question?.options) ? question.options.length : 0;

                        return (
                          <div key={questionId} className="rounded-xl border border-border/70 bg-background p-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold leading-snug">Q{index + 1}. {getQuestionText(question)}</p>
                              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                {question?.questionType || "Question"}
                              </span>
                            </div>

                            {optionCount > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {question.options.map((option: any, optionIndex: number) => (
                                  <div
                                    key={`${questionId}-${optionIndex}`}
                                    className={`rounded-md border px-2.5 py-1.5 text-xs ${option?.isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-border/60 bg-muted/20 text-muted-foreground"}`}
                                  >
                                    <span className="mr-1.5 font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                                    <span>{option?.text || "-"}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {Array.isArray(question?.subQuestions) && question.subQuestions.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {question.subQuestions.map((subQuestion: any, subIndex: number) => (
                                  <div key={`${questionId}-sub-${subIndex}`} className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs text-muted-foreground">
                                    <span className="mr-1.5 font-medium text-foreground">{subQuestion?.label || `${subIndex + 1}.`}</span>
                                    <span>{subQuestion?.questionTextBn || subQuestion?.questionTextEn || "Sub-question"}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                      No questions available in this exam.
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Assignments</CardTitle>
                  <p className="text-sm text-muted-foreground">{course.title}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={assignmentSearch}
                    onChange={(event) => setAssignmentSearch(event.target.value)}
                    placeholder="Search assignments"
                    className="w-52"
                  />
                  <select
                    value={assignmentFilter}
                    onChange={(event) => setAssignmentFilter(event.target.value as any)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="active">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                  <Button onClick={openCreateAssignment}><Plus className="mr-2 h-4 w-4" /> Create Assignment</Button>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {assignmentReminderText}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {assignmentsLoading ? (
                <div className="space-y-3">
                  <div className="h-24 animate-pulse rounded-xl border border-border/70 bg-muted/30" />
                  <div className="h-24 animate-pulse rounded-xl border border-border/70 bg-muted/30" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                  No assignments found. Start by creating your first assignment for this course.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 xl:grid-cols-2">
                    {paginatedAssignments.map((assignment) => {
                      const statusMeta = assignmentStatusMeta(assignment.status);
                      const due = assignment.dueAt ? new Date(assignment.dueAt) : null;
                      const submitted = Number(assignment.submittedCount || 0);
                      const totalStudents = Number(assignment.totalStudents || 0);
                      const completionRate = Number(assignment.completionRate || 0);
                      const lateCount = Number(assignment.lateCount || 0);

                      return (
                        <div key={assignment._id} className={sharedSurfaceCardClass} style={sharedSurfaceCardShadow}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="font-semibold">{assignment.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {assignment.type === "written" ? "Written" : assignment.type === "file" ? "File Upload" : "Mixed (Text + File)"}
                              </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2">
                              <p>Due Date</p>
                              <p className="mt-0.5 font-medium text-foreground">{due ? due.toLocaleString() : "Not set"}</p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2">
                              <p>Submissions</p>
                              <p className="mt-0.5 font-medium text-foreground">{submitted}/{totalStudents}</p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Completion</span>
                              <span>{completionRate}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, completionRate))}%` }} />
                            </div>
                          </div>

                          {lateCount > 0 && (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                              <AlertTriangle className="h-3.5 w-3.5" /> {lateCount} late submissions
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditAssignment(assignment)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => openSubmissions(assignment)}>
                              <Users className="mr-2 h-4 w-4" /> View Submissions
                            </Button>
                            {assignment.status !== "active" ? (
                              <Button size="sm" onClick={() => changeAssignmentStatus(assignment, "publish")}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Publish
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => changeAssignmentStatus(assignment, "close")}>
                                <PauseCircle className="mr-2 h-4 w-4" /> Close
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeAssignment(assignment)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground">
                    <p>Page {assignmentPage} of {assignmentTotalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAssignmentPage((prev) => Math.max(1, prev - 1))} disabled={assignmentPage <= 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => setAssignmentPage((prev) => Math.min(assignmentTotalPages, prev + 1))} disabled={assignmentPage >= assignmentTotalPages}>Next</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={assignmentEditorOpen} onOpenChange={setAssignmentEditorOpen}>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingAssignmentId ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div className="space-y-3 rounded-xl border border-border/70 p-4">
                  <p className="text-sm font-semibold">Basic Info</p>
                  <Input
                    placeholder="Assignment Title"
                    value={assignmentForm.title}
                    onChange={(event) => setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Formatting: supports plain text and HTML tags.</span>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border/70 px-2 py-1 hover:bg-muted/40">
                      <Upload className="h-3.5 w-3.5" /> Insert Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => appendDescriptionImage(event.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <Textarea
                    placeholder="Description (supports plain text or HTML)"
                    value={assignmentForm.description}
                    onChange={(event) => setAssignmentForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={4}
                  />
                  <Textarea
                    placeholder="Instructions (optional)"
                    value={assignmentForm.instructions}
                    onChange={(event) => setAssignmentForm((prev) => ({ ...prev, instructions: event.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-border/70 p-4">
                  <p className="text-sm font-semibold">Assignment Type</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={() => setAssignmentForm((prev) => ({ ...prev, type: "written" }))} className={`rounded-lg border px-3 py-2 text-sm ${assignmentForm.type === "written" ? "border-primary bg-primary/10" : "border-border/70"}`}>
                      <FileText className="mb-1 h-4 w-4" /> Written
                    </button>
                    <button type="button" onClick={() => setAssignmentForm((prev) => ({ ...prev, type: "file" }))} className={`rounded-lg border px-3 py-2 text-sm ${assignmentForm.type === "file" ? "border-primary bg-primary/10" : "border-border/70"}`}>
                      <FolderUp className="mb-1 h-4 w-4" /> File Upload
                    </button>
                    <button type="button" onClick={() => setAssignmentForm((prev) => ({ ...prev, type: "mixed" }))} className={`rounded-lg border px-3 py-2 text-sm ${assignmentForm.type === "mixed" ? "border-primary bg-primary/10" : "border-border/70"}`}>
                      <Users className="mb-1 h-4 w-4" /> Mixed
                    </button>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-border/70 p-4">
                  <p className="text-sm font-semibold">Settings</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input type="date" value={assignmentForm.dueDate} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, dueDate: event.target.value }))} />
                    <Input type="time" value={assignmentForm.dueTime} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, dueTime: event.target.value }))} />
                    <Input type="number" placeholder="Total Marks" value={assignmentForm.totalMarks} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, totalMarks: event.target.value }))} />
                    <Input type="number" placeholder="Max File Size (MB)" value={assignmentForm.maxFileSizeMb} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, maxFileSizeMb: event.target.value }))} />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={assignmentForm.allowLateSubmission}
                      onChange={(event) => setAssignmentForm((prev) => ({ ...prev, allowLateSubmission: event.target.checked }))}
                    />
                    Allow Late Submission
                  </label>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Reference title" value={assignmentForm.referenceTitle} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, referenceTitle: event.target.value }))} />
                    <Input placeholder="Reference URL" value={assignmentForm.referenceUrl} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, referenceUrl: event.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => submitAssignment(false)} disabled={assignmentSubmitting}>Save Draft</Button>
                <Button onClick={() => submitAssignment(true)} disabled={assignmentSubmitting}>{assignmentSubmitting ? "Saving..." : "Publish Assignment"}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
            <DialogContent className="sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>{selectedAssignment?.title || "Submission Review"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs"><p className="text-muted-foreground">Total Students</p><p className="text-sm font-semibold">{submissionSummary.totalStudents}</p></div>
                  <div className="rounded-lg border border-border/70 bg-emerald-50 px-3 py-2 text-xs"><p className="text-emerald-700">Submitted</p><p className="text-sm font-semibold text-emerald-700">{submissionSummary.submitted}</p></div>
                  <div className="rounded-lg border border-border/70 bg-rose-50 px-3 py-2 text-xs"><p className="text-rose-700">Pending</p><p className="text-sm font-semibold text-rose-700">{submissionSummary.pending}</p></div>
                  <div className="rounded-lg border border-border/70 bg-orange-50 px-3 py-2 text-xs"><p className="text-orange-700">Late</p><p className="text-sm font-semibold text-orange-700">{submissionSummary.late}</p></div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Input className="w-28" placeholder="Bulk marks" value={bulkMarks} onChange={(event) => setBulkMarks(event.target.value)} />
                  <Input className="w-72" placeholder="Bulk feedback" value={bulkFeedback} onChange={(event) => setBulkFeedback(event.target.value)} />
                  <Button size="sm" variant="outline" onClick={applyBulkGrade}>Grade Selected</Button>
                  <Button size="sm" variant="outline" onClick={downloadAllSubmissionFiles}>Download All Files</Button>
                </div>

                {submissionsLoading ? (
                  <div className="h-28 animate-pulse rounded-xl border border-border/70 bg-muted/30" />
                ) : (
                  <div className="no-scrollbar max-h-[52vh] overflow-auto rounded-xl border border-border/70">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2">Select</th>
                          <th className="px-3 py-2">Student</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Submitted At</th>
                          <th className="px-3 py-2">Marks</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionRows.map((row) => {
                          const statusMeta = submissionStatusMeta(row.submissionStatus);
                          return (
                            <tr key={row.studentId} className="border-b border-border/60">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedSubmissionIds.includes(row.studentId)}
                                  onChange={(event) => {
                                    setSelectedSubmissionIds((prev) => event.target.checked ? [...prev, row.studentId] : prev.filter((id) => id !== row.studentId));
                                  }}
                                  disabled={row.submissionStatus === "pending"}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-medium">{row.studentName}</p>
                                <p className="text-xs text-muted-foreground">{row.email || "-"}</p>
                              </td>
                              <td className="px-3 py-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>{statusMeta.label}</span></td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-"}</td>
                              <td className="px-3 py-2">{row.marks == null ? "-" : row.marks}</td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openStudentSubmission(row.studentId)}>View Submission</Button>
                                  <Button size="sm" onClick={() => openStudentSubmission(row.studentId)}>Grade</Button>
                                  {row.files?.[0]?.url && (
                                    <Button size="sm" variant="ghost" onClick={() => window.open(row.files?.[0]?.url || "", "_blank")}>Download File</Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={studentSubmissionOpen} onOpenChange={setStudentSubmissionOpen}>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Student Submission View</DialogTitle>
              </DialogHeader>

              {studentSubmissionLoading ? (
                <div className="h-28 animate-pulse rounded-xl border border-border/70 bg-muted/30" />
              ) : studentSubmissionData ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="text-sm font-semibold">Student Info</p>
                    <div className="text-sm">
                      <p className="font-medium">{studentSubmissionData.student?.name || "Student"}</p>
                      <p className="text-xs text-muted-foreground">{studentSubmissionData.student?.email || "-"}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Submitted: {studentSubmissionData.submission?.submittedAt ? new Date(studentSubmissionData.submission.submittedAt).toLocaleString() : "Not submitted"}</p>
                      <p>Status: {studentSubmissionData.status}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-3 rounded-xl border border-border/70 p-3">
                    <p className="text-sm font-semibold">Submission Content</p>
                    {studentSubmissionData.submission?.writtenAnswer ? (
                      <div className="rounded-lg border border-border/70 bg-muted/10 p-3 text-sm whitespace-pre-wrap">
                        {studentSubmissionData.submission.writtenAnswer}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No written answer submitted.</p>
                    )}

                    {(studentSubmissionData.submission?.attachments || []).length > 0 && (
                      <div className="space-y-2">
                        {(studentSubmissionData.submission.attachments || []).map((file: any, index: number) => (
                          <button key={`${file.url}-${index}`} type="button" onClick={() => window.open(file.url, "_blank")} className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-left text-sm hover:bg-muted/40">
                            <span>{file.name || `Attachment ${index + 1}`}</span>
                            <span className="text-xs text-muted-foreground">Download</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                      <p className="text-sm font-semibold">Grading Panel</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input type="number" value={gradeMarks} onChange={(event) => setGradeMarks(event.target.value)} placeholder="Marks" />
                        <Input value={gradeFeedback} onChange={(event) => setGradeFeedback(event.target.value)} placeholder="Feedback" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => saveGrade(false)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Save Grade
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => saveGrade(true)}>
                          Return to Student
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  Submission not available.
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> Course Materials</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Search, filter, and manage files, videos, and links in one place.
                  </p>
                </div>
                <Button className="w-full lg:w-auto" onClick={openMaterialModal}>
                  <Plus className="mr-2 h-4 w-4" /> Add Material
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <Input
                    className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    placeholder="Search materials by title, link, or description..."
                    value={materialSearch}
                    onChange={(event) => setMaterialSearch(event.target.value)}
                  />
                </div>
                <select
                  className="h-11 rounded-xl border border-border/70 bg-background px-3 text-sm"
                  value={materialSort}
                  onChange={(event) => setMaterialSort(event.target.value as "latest" | "oldest")}
                >
                  <option value="latest">Latest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "pdf", label: "PDF" },
                    { key: "video", label: "Video" },
                    { key: "link", label: "Link" },
                    { key: "doc", label: "Doc" },
                  ].map((type) => (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => setMaterialFilter(type.key as typeof materialFilter)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${materialFilter === type.key ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-muted-foreground hover:bg-muted/40"}`}
                    >
                      {type.label}
                    </button>
                  ))}
                  {(materialFilter !== "all" || materialSearch.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMaterialFilter("all");
                        setMaterialSearch("");
                      }}
                      className="rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {materialCards.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {paginatedMaterials.map((material) => {
                      const kind = getMaterialKind(material);
                      const materialDescription = (material as any).description || "No description provided.";

                      return (
                        <div
                          key={material._id}
                          className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all hover:border-primary/40 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/80"
                          style={{ boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px" }}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                {kind === "video" ? <PlayCircle className="h-6 w-6" /> : kind === "pdf" ? <FileText className="h-6 w-6" /> : <Link2 className="h-6 w-6" />}
                              </div>

                              <div className="min-w-0 flex-1 space-y-2">
                                <p className="line-clamp-1 text-lg font-semibold leading-tight text-foreground">{material.title}</p>
                                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{materialDescription}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start lg:self-center">
                              <Button asChild variant="outline" className="h-10">
                                <a href={material.url} target="_blank" rel="noreferrer">
                                  <Eye className="mr-2 h-4 w-4" /> View
                                </a>
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <a href={material.url} target="_blank" rel="noreferrer" className="flex items-center">
                                      <Eye className="mr-2 h-4 w-4" /> View
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(material.url);
                                        toast({ title: "Link copied" });
                                      } catch {
                                        toast({ title: "Copy failed", description: "Could not copy the material link.", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    <Copy className="mr-2 h-4 w-4" /> Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openEditMaterialModal(material)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => deleteMaterial(material._id, material.title)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground">
                    <p>Page {materialPage} of {materialTotalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setMaterialPage((prev) => Math.max(1, prev - 1))} disabled={materialPage <= 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => setMaterialPage((prev) => Math.min(materialTotalPages, prev + 1))} disabled={materialPage >= materialTotalPages}>Next</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Paperclip className="h-6 w-6" />
                  </div>
                  <p className="text-lg font-semibold">No materials match your filters</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a different search, category, or type filter. You can also add a new resource for this course.
                  </p>
                  <Button className="mt-5" variant="outline" onClick={openMaterialModal}>
                    <Plus className="mr-2 h-4 w-4" /> Add Material
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={materialModalOpen} onOpenChange={setMaterialModalOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingMaterialId ? "Edit Material" : "Add Material"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Title"
                    value={materialForm.title}
                    onChange={(event) => setMaterialForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <select
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    value={materialForm.type}
                    onChange={(event) => {
                      const nextType = event.target.value as "pdf" | "doc" | "video" | "link";
                      setMaterialForm((prev) => ({
                        ...prev,
                        type: nextType,
                        url: nextType === "pdf" || nextType === "doc" ? "" : prev.url,
                      }));
                      setMaterialFile(null);
                    }}
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">Doc</option>
                    <option value="video">Video</option>
                    <option value="link">Link</option>
                  </select>
                  {(materialForm.type === "link" || materialForm.type === "video") && (
                    <Input
                      placeholder={materialForm.type === "link" ? "Paste direct link" : "Optional video link (or upload below)"}
                      value={materialForm.url}
                      onChange={(event) => setMaterialForm((prev) => ({ ...prev, url: event.target.value }))}
                      className="md:col-span-2"
                    />
                  )}
                </div>

                <Textarea
                  placeholder="Description (optional)"
                  value={materialForm.description}
                  onChange={(event) => setMaterialForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={4}
                />

                {(materialForm.type === "pdf" || materialForm.type === "doc" || materialForm.type === "video") && (
                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-sm font-semibold">Upload {materialForm.type.toUpperCase()} file to Cloudinary</p>
                    <Input
                      type="file"
                      accept={getMaterialAccept(materialForm.type)}
                      onChange={(event) => setMaterialFile(event.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {materialForm.type === "video"
                        ? "For Video type, you can upload a file or use a direct link above."
                        : `Please upload a ${materialForm.type.toUpperCase()} file.`}
                    </p>
                    {materialFile && <p className="text-xs text-muted-foreground">Selected: {materialFile.name}</p>}
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMaterialModalOpen(false);
                      resetMaterialForm();
                    }}
                    disabled={materialSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addMaterial} disabled={materialSubmitting}>
                    {materialSubmitting ? "Saving..." : editingMaterialId ? "Save Changes" : "Upload / Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Announcements</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{course.title}</p>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={announcementSearch}
                      onChange={(event) => setAnnouncementSearch(event.target.value)}
                      placeholder="Search announcements"
                      className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={announcementFilter}
                    onChange={(event) => setAnnouncementFilter(event.target.value as typeof announcementFilter)}
                  >
                    <option value="all">All</option>
                    <option value="pinned">Pinned</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={announcementSort}
                    onChange={(event) => setAnnouncementSort(event.target.value as typeof announcementSort)}
                  >
                    <option value="latest">Latest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={announcementUnreadOnly} onChange={(event) => setAnnouncementUnreadOnly(event.target.checked)} />
                  Unread by students
                </label>
                <label className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={announcementImportantOnly} onChange={(event) => setAnnouncementImportantOnly(event.target.checked)} />
                  Important only
                </label>
                {!announcementComposerOpen ? (
                  <Button size="sm" onClick={() => setAnnouncementComposerOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Announcement
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => submitAnnouncement("publish")} disabled={announcementSubmitting || !announcementForm.message.trim()}>
                    <Send className="mr-2 h-4 w-4" /> Post Now
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!announcementComposerOpen ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setAnnouncementComposerOpen(true)}
                    className="w-full rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/40"
                  >
                    Announce something to your students...
                  </button>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setAnnouncementComposerOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Create Announcement
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-xl border border-border/70 bg-background p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="Title (optional but recommended)"
                      value={announcementForm.title}
                      onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={announcementForm.priority}
                      onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, priority: event.target.value as typeof prev.priority }))}
                    >
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button type="button" size="sm" variant="outline" onClick={() => applyAnnouncementSnippet("**Bold**")}>Bold</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => applyAnnouncementSnippet("_Italic_")}>Italic</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => applyAnnouncementSnippet("- Bullet item")}>Bullet</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => applyAnnouncementSnippet("[Link title](https://)")}>Link</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => applyAnnouncementSnippet("😊")}>Emoji</Button>
                    </div>
                    <Textarea
                      rows={6}
                      placeholder="Write your announcement..."
                      value={announcementForm.message}
                      onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, message: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                    <p className="text-sm font-medium">Attachments (Cloudinary based)</p>
                    <Input
                      type="file"
                      multiple
                      accept="application/pdf,image/*,video/*"
                      onChange={(event) => setAnnouncementUploadFiles(Array.from(event.target.files || []))}
                    />
                    {announcementUploadFiles.length > 0 && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {announcementUploadFiles.map((file) => <p key={file.name}>{file.name}</p>)}
                      </div>
                    )}
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex gap-2">
                        <Input placeholder="Add link" value={announcementLinkInput} onChange={(event) => setAnnouncementLinkInput(event.target.value)} />
                        <Button type="button" variant="outline" onClick={() => addAnnouncementAttachmentLink("link")}>Add</Button>
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Add video URL" value={announcementVideoInput} onChange={(event) => setAnnouncementVideoInput(event.target.value)} />
                        <Button type="button" variant="outline" onClick={() => addAnnouncementAttachmentLink("video")}>Add</Button>
                      </div>
                    </div>
                    {announcementAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {announcementAttachments.map((item, index) => (
                          <button
                            key={`${item.url}-${index}`}
                            type="button"
                            onClick={() => setAnnouncementAttachments((prev) => prev.filter((_, idx) => idx !== index))}
                            className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground"
                          >
                            {item.type?.toUpperCase() || "LINK"}: {item.name || item.url.slice(0, 30)} ✕
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 rounded-lg border border-border/70 p-3">
                      <p className="text-sm font-medium">Audience targeting</p>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={announcementForm.audienceScope}
                        onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, audienceScope: event.target.value as typeof prev.audienceScope }))}
                      >
                        <option value="all">All students</option>
                        <option value="batch">Specific batch</option>
                        <option value="students">Specific students</option>
                      </select>
                      {announcementForm.audienceScope === "batch" && (
                        <Input
                          placeholder="Batch tags (comma separated)"
                          value={announcementForm.batchText}
                          onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, batchText: event.target.value }))}
                        />
                      )}
                      {announcementForm.audienceScope === "students" && (
                        <div className="max-h-28 space-y-1 overflow-auto rounded-md border border-border/60 p-2 text-xs">
                          {(courseStudentRows || []).map((entry) => {
                            const studentId = String(entry.studentId?._id || "");
                            if (!studentId) return null;
                            const selected = announcementForm.selectedStudentIds.includes(studentId);
                            return (
                              <label key={studentId} className="flex items-center gap-2">
                                <input type="checkbox" checked={selected} onChange={() => toggleAnnouncementAudienceStudent(studentId)} />
                                <span>{entry.studentId?.name || "Student"}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 rounded-lg border border-border/70 p-3">
                      <p className="text-sm font-medium">Scheduling and notifications</p>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={announcementForm.scheduleMode}
                        onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, scheduleMode: event.target.value as typeof prev.scheduleMode }))}
                      >
                        <option value="now">Post now</option>
                        <option value="scheduled">Schedule later</option>
                      </select>
                      {announcementForm.scheduleMode === "scheduled" && (
                        <Input
                          type="datetime-local"
                          value={announcementForm.scheduledFor}
                          onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, scheduledFor: event.target.value }))}
                        />
                      )}
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" checked={announcementForm.isPinned} onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, isPinned: event.target.checked }))} />
                        Pin to top
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" checked={announcementForm.notifyPush} onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, notifyPush: event.target.checked }))} />
                        Send push notification
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" checked={announcementForm.notifyEmail} onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, notifyEmail: event.target.checked }))} />
                        Send email notification
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" checked={announcementForm.notifySilent} onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, notifySilent: event.target.checked }))} />
                        Silent post
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => submitAnnouncement("draft")} disabled={announcementSubmitting}>Save Draft</Button>
                    <Button type="button" variant="outline" onClick={() => setAnnouncementPreviewOpen(true)} disabled={!announcementForm.message.trim()}>Preview</Button>
                    <Button type="button" onClick={() => submitAnnouncement("publish")} disabled={announcementSubmitting}>
                      <Send className="mr-2 h-4 w-4" /> {announcementSubmitting ? "Saving..." : "Publish"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => { resetAnnouncementComposer(); setAnnouncementComposerOpen(false); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {pinnedAnnouncementRows.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">📌 Pinned Announcements</p>
                  <div className="space-y-3">
                    {pinnedAnnouncementRows.map((item) => {
                      const seenCount = Array.isArray(item.seenBy) ? item.seenBy.length : 0;
                      const notSeenCount = Math.max(0, totalAnnouncementStudents - seenCount);
                      const isNew = Date.now() - new Date(item.createdAt || 0).getTime() < 24 * 60 * 60 * 1000;
                      return (
                        <div key={item._id} className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Teacher • {formatRelativeTime(item.createdAt)}</p>
                              <p className="text-base font-semibold">{item.title || "Untitled announcement"}</p>
                              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-muted px-2.5 py-1">👁 Seen: {seenCount}</span>
                                <span className="rounded-full bg-muted px-2.5 py-1">❌ Not seen: {notSeenCount}</span>
                                {isNew && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">🆕 New</span>}
                                {item.priority === "urgent" && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">🔴 Urgent</span>}
                                {item.priority === "important" && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">🟡 Important</span>}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => editAnnouncement(item)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
                              <Button size="sm" variant="outline" onClick={() => toggleAnnouncementPin(item)}><PinOff className="mr-1 h-4 w-4" />Unpin</Button>
                              <Button size="sm" variant="outline" onClick={() => duplicateAnnouncementCard(item._id)}><Copy className="mr-1 h-4 w-4" />Duplicate</Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeAnnouncementCard(item._id)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-semibold">Announcement Feed</p>
                {feedAnnouncementRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                    No announcements found for your current filters.
                  </div>
                ) : (
                  feedAnnouncementRows.map((item) => {
                    const seenCount = Array.isArray(item.seenBy) ? item.seenBy.length : 0;
                    const likeCount = Array.isArray(item.likedBy) ? item.likedBy.length : 0;
                    const commentCount = Array.isArray(item.comments) ? item.comments.length : 0;
                    const notSeenCount = Math.max(0, totalAnnouncementStudents - seenCount);
                    const isNew = Date.now() - new Date(item.createdAt || 0).getTime() < 24 * 60 * 60 * 1000;

                    return (
                      <div key={item._id} className="rounded-xl border border-border/70 bg-background p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{(item.createdBy?.name || "Teacher").slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">{item.createdBy?.name || "Teacher"} • {formatRelativeTime(item.createdAt)}</p>
                              {item.title && <p className="text-base font-semibold">{item.title}</p>}
                              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
                              {Array.isArray(item.attachments) && item.attachments.length > 0 && (
                                <div className="space-y-1.5">
                                  {item.attachments.map((file, index) => (
                                    <a
                                      key={`${file.url}-${index}`}
                                      href={file.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 text-xs text-primary underline-offset-4 hover:underline"
                                    >
                                      {file.type === "video" ? <PlayCircle className="h-4 w-4" /> : file.type === "pdf" || file.type === "image" ? <Paperclip className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                                      {file.name || file.url}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs">
                                {item.isPinned && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary"><Pin className="mr-1 inline h-3 w-3" />Pinned</span>}
                                {item.priority === "urgent" && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">🔴 Urgent</span>}
                                {item.priority === "important" && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">🟡 Important</span>}
                                {isNew && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">🆕 New</span>}
                                {item.status === "scheduled" && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">Scheduled</span>}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full bg-muted px-2.5 py-1">👁 Seen: {seenCount}</span>
                                <span className="rounded-full bg-muted px-2.5 py-1">❌ Not seen: {notSeenCount}</span>
                                <span className="rounded-full bg-muted px-2.5 py-1"><Heart className="mr-1 inline h-3 w-3" />{likeCount}</span>
                                <span className="rounded-full bg-muted px-2.5 py-1"><MessageCircle className="mr-1 inline h-3 w-3" />{commentCount}</span>
                                <span className="rounded-full bg-muted px-2.5 py-1"><Bell className="mr-1 inline h-3 w-3" />{item.notification?.push ? "Push" : "No push"}</span>
                                <span className="rounded-full bg-muted px-2.5 py-1"><Mail className="mr-1 inline h-3 w-3" />{item.notification?.email ? "Email" : "No email"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => editAnnouncement(item)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
                            <Button size="sm" variant="outline" onClick={() => toggleAnnouncementPin(item)}>
                              {item.isPinned ? <PinOff className="mr-1 h-4 w-4" /> : <Pin className="mr-1 h-4 w-4" />}
                              {item.isPinned ? "Unpin" : "Pin"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => duplicateAnnouncementCard(item._id)}><Copy className="mr-1 h-4 w-4" />Duplicate</Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeAnnouncementCard(item._id)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog open={announcementPreviewOpen} onOpenChange={setAnnouncementPreviewOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Announcement Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 rounded-xl border border-border/70 p-4">
                <p className="text-xs text-muted-foreground">Student view preview</p>
                {announcementForm.title && <p className="text-lg font-semibold">{announcementForm.title}</p>}
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{announcementForm.message}</p>
                {announcementAttachments.length > 0 && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {announcementAttachments.map((item, index) => (
                      <p key={`${item.url}-${index}`}>{item.type?.toUpperCase() || "LINK"}: {item.name || item.url}</p>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="leaderboard">
          <div className="space-y-5">
            <Card className="overflow-hidden border-slate-300 bg-slate-100 dark:border-cyan-500/20 dark:bg-slate-900">
              <CardContent className="relative p-5 md:p-6">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-amber-500/10 dark:from-cyan-500/20 dark:to-amber-500/20" />
                <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Course Leaderboard</p>
                    <h3 className="mt-1 text-2xl font-bold">Gamified Performance Tracking</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Rank students by weighted score with consistency bonus and late-submission penalty.</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                    Score = (Exam Accuracy x 70%) + (Assignment Accuracy x 30%) + Consistency Bonus - Late Penalty
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4 md:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {([
                      { key: "weekly", label: "Weekly" },
                      { key: "monthly", label: "Monthly" },
                      { key: "all", label: "All-time" },
                    ] as const).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setLeaderboardTimeRange(option.key)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${leaderboardTimeRange === option.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {([
                      { key: "overall", label: "Overall" },
                      { key: "exams", label: "Exams only" },
                      { key: "assignments", label: "Assignments only" },
                    ] as const).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setLeaderboardScoreType(option.key)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${leaderboardScoreType === option.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    placeholder="Search student by name or email..."
                    value={leaderboardSearch}
                    onChange={(event) => setLeaderboardSearch(event.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4" /> Top 3 Performers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {leaderboardView.top3.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Leaderboard data will appear once students submit exams and assignments.</p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-3">
                        {[1, 0, 2].map((positionIndex) => {
                          const row = leaderboardView.top3[positionIndex];
                          if (!row) return <div key={`empty-${positionIndex}`} className="hidden md:block" />;
                          const place = row.rank;
                          const isChampion = place === 1;
                          return (
                            <div
                              key={row.studentId}
                              className={`rounded-2xl border p-4 text-center ${isChampion ? "md:scale-105 border-amber-300 bg-amber-50/80 dark:border-amber-600/40 dark:bg-amber-500/10" : "border-border bg-card"}`}
                            >
                              <p className="text-xs font-semibold text-muted-foreground">{place === 1 ? "1st Place" : place === 2 ? "2nd Place" : "3rd Place"}</p>
                              <Avatar className="mx-auto mt-3 h-14 w-14 border border-border/70">
                                <AvatarImage src={row.avatar || ""} alt={row.studentName} />
                                <AvatarFallback>{row.studentName.slice(0, 1).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <p className="mt-3 text-sm font-semibold">{row.studentName}</p>
                              <p className="text-xs text-muted-foreground">Score {row.score.toFixed(1)}</p>
                              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
                                <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">Rank #{row.rank}</span>
                                {place === 1 && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Top Performer</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Leaderboard List</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {leaderboardAssignmentLoading || sharedCourseLeaderboardLoading ? (
                      <p className="text-sm text-muted-foreground">Syncing assignment analytics for leaderboard...</p>
                    ) : leaderboardView.filteredRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No students match this filter.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                          <thead>
                            <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                              <th className="px-2 py-2">Rank</th>
                              <th className="px-2 py-2">Student</th>
                              <th className="px-2 py-2">Score</th>
                              <th className="px-2 py-2">Completed Assignments</th>
                              <th className="px-2 py-2">Exams Given</th>
                              <th className="px-2 py-2">Accuracy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaderboardView.paginatedRows.map((row) => {
                              const isFocused = String(selectedCourseStudent?.studentId?._id || "") === row.studentId;
                              return (
                                <tr key={row.studentId} className={`border-b border-border/40 ${isFocused ? "bg-primary/10" : "hover:bg-muted/30"}`}>
                                  <td className="px-2 py-3 font-semibold">#{row.rank}</td>
                                  <td className="px-2 py-3">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8 border border-border/70">
                                        <AvatarImage src={row.avatar || ""} alt={row.studentName} />
                                        <AvatarFallback>{row.studentName.slice(0, 1).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{row.studentName}</p>
                                        <p className="text-xs text-muted-foreground">{row.studentEmail || "No email"}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-2 py-3">
                                    <div className="font-semibold">{row.score.toFixed(1)}</div>
                                    <div className="text-[11px] text-muted-foreground">+{row.bonus.toFixed(1)} bonus / -{row.penalty.toFixed(1)} penalty</div>
                                  </td>
                                  <td className="px-2 py-3">{row.completedAssignments}</td>
                                  <td className="px-2 py-3">{row.examsGiven}</td>
                                  <td className="px-2 py-3">
                                    <div>{row.accuracy.toFixed(1)}%</div>
                                    <div className="text-[11px] text-muted-foreground">Exam {row.examAccuracy.toFixed(1)}% • Assignment {row.assignmentAccuracy.toFixed(1)}%</div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">Page {leaderboardView.currentPage} of {leaderboardView.totalPages}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={leaderboardView.currentPage <= 1}
                          onClick={() => setLeaderboardPage((prev) => Math.max(1, prev - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={leaderboardView.currentPage >= leaderboardView.totalPages}
                          onClick={() => setLeaderboardPage((prev) => Math.min(leaderboardView.totalPages, prev + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherCourseDetails;
  
