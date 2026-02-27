import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { examsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Clock, FileText, ShieldCheck, Timer, Play, ArrowLeft } from "lucide-react";

type Exam = {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  warnings?: string;
  duration: number;
  totalMarks: number;
  questionIds?: any[];
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  publishedAt?: string;
  marksPerQuestion?: number;
  negativeMarking?: boolean;
  negativeMarkValue?: number;
  questionNumbering?: "sequential" | "random";
  questionPresentation?: "all-at-once" | "one-by-one";
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  allowMultipleAttempts?: boolean;
  allowAnswerChange?: boolean;
  resultVisibility?: "immediate" | "after-exam-end" | "after-all-complete";
  answerVisibility?: "immediate" | "after-exam-end" | "never";
  autoSubmit?: boolean;
};

const ExamInstructions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  // Detect if accessed from upcoming exams
  const isUpcoming = (() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('upcoming') === 'true';
    }
    return false;
  })();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    if (!examId) return;
    try {
      setLoading(true);
      const response = await examsAPI.get(examId);
      setExam(response.data);
    } catch (err) {
      console.error("Failed to load exam", err);
      toast({
        title: "পরীক্ষা লোড করতে ব্যর্থ",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const questionCount = exam?.questionIds?.length || 0;

  const scheduleText = useMemo(() => {
    if (!exam) return "";
    if (!exam.startDate && !exam.startTime && !exam.publishedAt) return "নির্ধারিত নেই";
    const date = exam.startDate || (exam.publishedAt ? new Date(exam.publishedAt).toISOString().slice(0, 10) : "");
    const time = exam.startTime || (exam.publishedAt ? new Date(exam.publishedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "");
    return `${date} ${time}`.trim();
  }, [exam]);

  if (loading) {
    return (
      <div className="text-center py-20 text-muted-foreground">নির্দেশিকা লোড করছি...</div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20 text-muted-foreground">পরীক্ষা খুঁজে পাওয়া যায়নি</div>
    );
  }

  const inProgress = Boolean(sessionStorage.getItem(`examInProgress_${exam._id}`));
  const completed = (() => {
    try {
      const uid = user?.id || (user as any)?._id || 'anon';
      const key = `completedExams_${uid}`;
      const stored = localStorage.getItem(key) || localStorage.getItem("completedExams");
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.includes(exam._id);
    } catch (e) {
      console.error("Failed to read completed exams", e);
      return false;
    }
  })();
  const buildDateTime = (dateStr?: string, timeStr?: string, fallback?: string) => {
    if (dateStr && timeStr) {
      const dt = new Date(`${dateStr}T${timeStr}:00`);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    if (dateStr) {
      const dt = new Date(dateStr);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    if (fallback) {
      const dt = new Date(fallback);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  };

  const startAt = buildDateTime(exam.startDate, exam.startTime, exam.publishedAt);
  const endAt = buildDateTime(exam.endDate, exam.endTime);
  const computedEndAt = endAt || (startAt ? new Date(startAt.getTime() + exam.duration * 60000) : null);
  const hasEnded = computedEndAt ? Date.now() > computedEndAt.getTime() : false;
  const canAttempt = exam.allowMultipleAttempts !== false || !completed || hasEnded;
  // Access control: if exam.accessType === 'specific', ensure current user is listed
  const isAllowedByExam = (() => {
    try {
      if (!exam || (exam as any).accessType !== 'specific') return true;
      const allowed = (exam as any).allowedStudents || [];
      const uid = user?.id || (user as any)?._id;
      if (!uid) return false;
      return allowed.some((a: any) => String(a._id || a.id || a) === String(uid));
    } catch (e) {
      return true;
    }
  })();

  const canAttemptFinal = canAttempt && isAllowedByExam;

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-bangla">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate("/exams")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> ফিরে যান
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          {exam.description && <p className="text-white/80 mt-1">{exam.description}</p>}
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 rounded-xl border p-4">
              <Clock className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">পরীক্ষার সময়</p>
                <p className="font-semibold">{exam.duration} মিনিট</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-4">
              <FileText className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">মোট প্রশ্ন</p>
                <p className="font-semibold">{questionCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-4">
              <Timer className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">মোট নম্বর</p>
                <p className="font-semibold">{exam.totalMarks}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground">শুরু সময়</p>
            <p className="font-semibold">{scheduleText}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-emerald-200/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> নির্দেশিকা
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                {exam.instructions || "নির্দেশিকা দেওয়া হয়নি"}
              </CardContent>
            </Card>
            <Card className="border-amber-200/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> সতর্কতা
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                {exam.warnings || "সতর্কতা দেওয়া হয়নি"}
              </CardContent>
            </Card>
          </div>


          <div className="flex items-center gap-2">
            <Checkbox id="agree" checked={agreed} onCheckedChange={(val) => setAgreed(Boolean(val))} />
            <label htmlFor="agree" className="text-sm">আমি নির্দেশিকা পড়েছি</label>
          </div>

          <div className="flex justify-end">
            <Button
              className="gap-2"
              disabled={!agreed || !canAttemptFinal || isUpcoming}
              onClick={() => navigate(`/exam/${exam._id}`)}
            >
              <Play className="h-4 w-4" /> {inProgress ? "পরীক্ষা চালিয়ে যান" : "পরীক্ষা শুরু করুন"}
            </Button>
            {isUpcoming && (
              <p className="text-sm text-muted-foreground mt-2">পরীক্ষা শুরু করা যাবে না, কারণ এটি এখনও লাইভ হয়নি।</p>
            )}
          </div>
          {!canAttempt && (
            <p className="text-sm text-destructive">এই পরীক্ষাটি একবারই দেওয়া যাবে। আপনি ইতিমধ্যে অংশগ্রহণ করেছেন।</p>
          )}
          {!isAllowedByExam && (
            <p className="text-sm text-destructive">আপনি এই পরীক্ষায় অংশগ্রহণ করার জন্য অনুমোদিত নন।</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamInstructions;
