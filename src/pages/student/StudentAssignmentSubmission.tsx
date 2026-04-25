import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { coursesAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, FileText, CheckCircle2, Upload, Trash2 } from "lucide-react";

type Attachment = {
  name?: string;
  url?: string;
};

type AssignmentDetail = {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  type?: "written" | "file" | "mixed";
  status: "active" | "closed";
  dueAt?: string | null;
  allowLateSubmission?: boolean;
  totalMarks?: number;
  courseId: string;
  course?: { _id: string; title: string };
  submission?: {
    writtenAnswer?: string;
    attachments?: Attachment[];
    submittedAt?: string | null;
    marks?: number | null;
    feedback?: string;
    isLate?: boolean;
  } | null;
  submissionStatus?: "pending" | "submitted" | "late";
  referenceMaterials?: Array<{ title?: string; url?: string; type?: string }>;
};

const prettyDateTime = (value?: string | null) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString();
};

const StudentAssignmentSubmission = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const canSubmit = useMemo(() => assignment?.status === "active", [assignment?.status]);

  const loadAssignment = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const res = await coursesAPI.getMyAssignment(assignmentId);
      const data = res?.data as AssignmentDetail;
      setAssignment(data);
      setWrittenAnswer(data?.submission?.writtenAnswer || "");
      setAttachments(data?.submission?.attachments || []);
    } catch (error: any) {
      toast({ title: "Failed to load assignment", description: error?.message || "Please try again.", variant: "destructive" });
      navigate("/assignments", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const submit = async () => {
    if (!assignment || !assignmentId) return;
    setSaving(true);
    try {
      await coursesAPI.submitAssignment(assignment.courseId, assignmentId, {
        writtenAnswer,
        attachments,
      });

      toast({
        title: assignment.submission ? "Submission updated" : "Assignment submitted",
        description: "Your response has been saved successfully.",
      });

      await loadAssignment();
    } catch (error: any) {
      toast({ title: "Submission failed", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadSelectedFiles = async () => {
    if (!assignment || !assignmentId || !selectedFiles.length) return;
    setUploading(true);
    try {
      const res = await coursesAPI.uploadAssignmentAttachments(assignment.courseId, assignmentId, selectedFiles);
      const uploaded = Array.isArray(res?.data) ? res.data : [];
      setAttachments((prev) => [...prev, ...uploaded]);
      setSelectedFiles([]);
      toast({ title: "Files uploaded", description: `${uploaded.length} file(s) uploaded successfully.` });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Loading assignment...</CardContent>
      </Card>
    );
  }

  if (!assignment) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Assignment not found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/assignments")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Button>
        <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
          {assignment.status === "active" ? "Active" : "Closed"}
        </Badge>
      </div>

      {/* Beautiful assignment title header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/60 p-5 shadow-lg md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />
        
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <FileText className="h-3.5 w-3.5" /> {assignment.course?.title || "Course"}
          </p>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">{assignment.title}</h1>
          <p className="text-muted-foreground text-sm">{assignment.description || "No description provided."}</p>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80" style={{ boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px" }}>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Due date</p>
              <p className="mt-1 font-medium">{prettyDateTime(assignment.dueAt)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Total marks</p>
              <p className="mt-1 font-medium">{assignment.totalMarks ?? 100}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Submission type</p>
              <p className="mt-1 font-medium capitalize">{assignment.type || "written"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Instructions</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{assignment.instructions || "No instructions provided."}</p>
          </div>

          {!!assignment.referenceMaterials?.length && (
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="mb-2 text-xs text-muted-foreground">Reference materials</p>
              <div className="space-y-2">
                {assignment.referenceMaterials.map((item, idx) => (
                  <div key={`${item.url}-${idx}`} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {item.title || item.url}
                      </a>
                    ) : (
                      <span>{item.title || "Material"}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Your answer</p>
            <Textarea
              value={writtenAnswer}
              onChange={(event) => setWrittenAnswer(event.target.value)}
              placeholder="Write your answer here..."
              className="mt-2 min-h-[180px]"
              disabled={!canSubmit || saving}
            />
          </div>

          <div className="rounded-lg border border-border bg-background p-3 space-y-3">
            <p className="text-xs text-muted-foreground">Attachments (optional)</p>
            <input
              type="file"
              multiple
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
              disabled={!canSubmit || saving || uploading}
              className="block w-full text-sm"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {selectedFiles.length ? `${selectedFiles.length} file(s) selected` : "No files selected"}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={uploadSelectedFiles} disabled={!canSubmit || saving || uploading || !selectedFiles.length} className="gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Files"}
              </Button>
            </div>
            {!!attachments.length && (
              <div className="space-y-2">
                {attachments.map((item, idx) => (
                  <div key={`${item.url}-${idx}`} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                    <a href={item.url || "#"} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
                      {item.name || `Attachment ${idx + 1}`}
                    </a>
                    {canSubmit ? (
                      <button type="button" onClick={() => removeAttachment(idx)} className="ml-2 text-destructive" aria-label="Remove attachment">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {assignment.submission?.submittedAt ? `Last submitted: ${prettyDateTime(assignment.submission.submittedAt)}` : "Not submitted yet"}
            </div>
            <Button onClick={submit} disabled={!canSubmit || saving} className="gap-2">
              <Send className="h-4 w-4" />
              {saving ? "Saving..." : assignment.submission ? "Resubmit" : "Submit Assignment"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {assignment.submission && (
        <Card
          className="border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80"
          style={{ boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px" }}
        >
          <CardHeader>
            <CardTitle className="text-base">Teacher Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Marks: {assignment.submission.marks ?? "Pending"}</span>
            </div>
            <p className="text-muted-foreground">{assignment.submission.feedback || "No feedback yet."}</p>
            {assignment.submission.attachments?.length ? (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Submitted attachments</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {assignment.submission.attachments.map((item, idx) => (
                    <Button key={`${item.url}-${idx}`} variant="outline" size="sm" asChild>
                      <a href={item.url || "#"} target="_blank" rel="noreferrer">
                        {item.name || `Attachment ${idx + 1}`}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentAssignmentSubmission;
