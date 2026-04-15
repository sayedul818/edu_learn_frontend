import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examsAPI, examResultsAPI } from "@/services/api";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from "lucide-react";
import { isInlineGapPlaceholderCq, parseQuestionWithSubPoints, renderMathToHtml, renderRichOrMathHtml, shuffleWordBank, splitPipedColumns } from "@/lib/utils";

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id || (user as any)?._id || "anon";
  const examDraftKey = examId ? `examDraft_${userId}_${examId}` : null;
  const startedAtRef = useRef<string>(new Date().toISOString());

  type UploadedFileEntry = {
    name: string;
    type: string;
    dataUrl: string;
  };

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFileEntry[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // CQ questions: track which parent question ids the student has marked as answered or skipped
  const [cqStatus, setCqStatus] = useState<Record<string, 'answered' | 'skipped'>>({}); // parentId -> status

  const shuffleArray = <T,>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const normalizeBool = (value: unknown, fallback: boolean) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
    }
    return fallback;
  };

  const restoreDraftState = useCallback((questionCount: number, defaultTimeLeft: number) => {
    if (!examDraftKey) return false;

    try {
      const raw = localStorage.getItem(examDraftKey);
      if (!raw) return false;

      const draft = JSON.parse(raw);
      if (!draft || draft.submitted) return false;

      const updatedAtMs = draft.updatedAt ? new Date(draft.updatedAt).getTime() : Date.now();
      const elapsedSec = Math.max(0, Math.floor((Date.now() - updatedAtMs) / 1000));
      const savedTimeLeft = Number(draft.timeLeft);
      const restoredTimeLeft = Number.isFinite(savedTimeLeft)
        ? Math.max(0, savedTimeLeft - elapsedSec)
        : defaultTimeLeft;

      const safeAnswers = draft.answers && typeof draft.answers === "object" ? draft.answers : {};
      const safeFlagged = Array.isArray(draft.flagged) ? draft.flagged : [];
      const safeUploads = draft.uploadedFiles && typeof draft.uploadedFiles === "object" ? draft.uploadedFiles : {};
      const safeCqStatus = draft.cqStatus && typeof draft.cqStatus === "object" ? draft.cqStatus : {};
      const savedQ = Number(draft.currentQ);
      const clampedQ = Number.isFinite(savedQ)
        ? Math.min(Math.max(0, savedQ), Math.max(0, questionCount - 1))
        : 0;

      if (draft.startedAt) startedAtRef.current = String(draft.startedAt);

      setAnswers(safeAnswers);
      setFlagged(new Set(safeFlagged));
      setUploadedFiles(safeUploads);
      setCqStatus(safeCqStatus);
      setCurrentQ(clampedQ);
      setTimeLeft(restoredTimeLeft);

      return true;
    } catch (e) {
      console.error("Failed to restore exam draft", e);
      return false;
    }
  }, [examDraftKey]);

  // Load exam data on mount
  useEffect(() => {
    if (!examId) {
      setIsLoading(false);
      return;
    }

    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setIsLoading(true);

      // First check sessionStorage for self-created exams
      const selfExamKey = `selfExam_${examId}`;
      const selfExamData = sessionStorage.getItem(selfExamKey);
      
      if (selfExamData) {
        const parsed = JSON.parse(selfExamData);
        const loadedQuestions = parsed.questions || [];
        const defaultTimeLeft = (parsed.exam?.duration || 0) * 60;

        setExam(parsed.exam);
        setQuestions(loadedQuestions);

        const restored = restoreDraftState(loadedQuestions.length, defaultTimeLeft);
        if (!restored) {
          setAnswers({});
          setFlagged(new Set());
          setUploadedFiles({});
          setCurrentQ(0);
          setTimeLeft(defaultTimeLeft);
        }
      } else {
        // Try to load from database API
        const response = await examsAPI.get(examId);
        const dbExam = response.data;
        
        if (!dbExam) {
          toast({
            title: "পরীক্ষা খুঁজে পাওয়া যাচ্ছে না",
            variant: "destructive",
          });
          return;
        }

        // Transform database exam to format expected by TakeExam
        const transformedExam = {
          id: dbExam._id,
          title: dbExam.title,
          duration: dbExam.duration,
          totalMarks: dbExam.totalMarks || (dbExam.questionIds || []).length * (dbExam.marksPerQuestion || 1),
          questionIds: (dbExam.questionIds || []).map((q: any) => q._id),
          marksPerQuestion: dbExam.marksPerQuestion ?? 1,
          negativeMarking: normalizeBool(dbExam.negativeMarking, false),
          negativeMarkValue: dbExam.negativeMarkValue ?? 0,
          questionNumbering: dbExam.questionNumbering || "sequential",
          questionPresentation: dbExam.questionPresentation || "all-at-once",
          shuffleQuestions: normalizeBool(dbExam.shuffleQuestions, false),
          shuffleOptions: normalizeBool(dbExam.shuffleOptions, false),
          allowMultipleAttempts: normalizeBool(dbExam.allowMultipleAttempts, false),
          allowAnswerChange: normalizeBool(dbExam.allowAnswerChange, true),
          resultVisibility: dbExam.resultVisibility || "immediate",
          answerVisibility: dbExam.answerVisibility || "after-exam-end",
          autoSubmit: normalizeBool(dbExam.autoSubmit, true),
        };

        // Build question objects. If a question has subQuestions (CQ), expand each sub-question
        // into its own entry so students will see and answer each sub-item separately.
        const transformedQuestions: any[] = [];
        (dbExam.questionIds || []).forEach((q: any) => {
          const parentPassage = q.questionTextBn || q.questionTextEn || q.questionText || "";

            if (q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
              // keep parent question and embed subQuestions as an array so we render them together
              const subs = q.subQuestions.map((sq: any, i: number) => {
                const text = sq.questionTextBn || sq.questionTextEn || sq.questionText || "";
                const rawOptions = sq.options || [];
                const normalizedOptions = rawOptions.map((opt: any) => (typeof opt === 'string' ? { text: opt } : opt));
                const options = transformedExam.shuffleOptions ? shuffleArray(normalizedOptions) : normalizedOptions;
                return {
                  id: `${q._id}-${i}`,
                  dbId: sq._id || null,
                  image: sq.image || null,
                  questionText: text,
                  options,
                  correctAnswer: (normalizedOptions.find((opt: any) => opt.isCorrect)?.text) || (sq.answer || sq.answerBn || sq.answerEn) || "",
                  explanation: sq.explanation || sq.explanationBn || q.explanation || "",
                  marks: sq.marks ?? transformedExam.marksPerQuestion,
                  label: sq.label,
                  type: sq.type,
                };
              });

              transformedQuestions.push({
                id: q._id,
                image: q.image || null,
                boardYear: q.boardYear || "",
                questionType: q.questionType || "",
                parentPassage: parentPassage || undefined,
                subQuestions: subs,
              });
            } else {
            const rawOptions = q.options || [];
            const normalizedOptions = rawOptions.map((opt: any) => (typeof opt === 'string' ? { text: opt } : opt));
            const options = transformedExam.shuffleOptions ? shuffleArray(normalizedOptions) : normalizedOptions;
            transformedQuestions.push({
              id: q._id,
              image: q.image || null,
              boardYear: q.boardYear || "",
              questionType: q.questionType || "",
              questionText: parentPassage,
              options,
              correctAnswer: normalizedOptions.find((opt: any) => opt.isCorrect)?.text || "",
              explanation: q.explanation || "",
              marks: transformedExam.marksPerQuestion,
            });
          }
        });

        const orderedQuestions = transformedExam.shuffleQuestions ? shuffleArray(transformedQuestions) : transformedQuestions;

        const defaultTimeLeft = (dbExam.duration || 0) * 60;

        setExam(transformedExam);
        setQuestions(orderedQuestions);

        const restored = restoreDraftState(orderedQuestions.length, defaultTimeLeft);
        if (!restored) {
          setAnswers({});
          setFlagged(new Set());
          setUploadedFiles({});
          setCurrentQ(0);
          setTimeLeft(defaultTimeLeft);
        }
      }
    } catch (err) {
      console.error("Failed to load exam:", err);
      toast({
        title: "পরীক্ষা লোড করতে ব্যর্থ",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const dataUrlToFile = async (dataUrl: string, fileName: string, mimeType?: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const finalType = mimeType || blob.type || "application/octet-stream";
    return new File([blob], fileName, { type: finalType });
  };

  const handleFileSelect = async (qid: string, files?: File[] | null) => {
    if (!files || files.length === 0) {
      setUploadedFiles((s) => ({ ...s, [qid]: [] }));
      return;
    }

    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    const maxBytes = 10 * 1024 * 1024; // 10MB
    const validFiles: File[] = [];

    for (const file of files) {
      if (!allowed.includes(file.type)) {
        toast({ title: "Unsupported file format", description: `${file.name}: only JPG, PNG and PDF are allowed`, variant: "destructive" });
        continue;
      }
      if (file.size > maxBytes) {
        toast({ title: "File too large", description: `${file.name}: max file size is 10MB`, variant: "destructive" });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const entries: UploadedFileEntry[] = [];
    for (const file of validFiles) {
      try {
        const dataUrl = await fileToDataUrl(file);
        entries.push({
          name: file.name,
          type: file.type || "application/octet-stream",
          dataUrl,
        });
      } catch (e) {
        console.error("Failed to prepare selected file", e);
      }
    }

    if (entries.length === 0) return;
    setUploadedFiles((s) => ({ ...s, [qid]: entries }));
  };

  useEffect(() => {
    if (!exam || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, submitted]);

  useEffect(() => {
    if (questions.length === 0) return;
    setCurrentQ((prev) => (prev >= 0 && prev < questions.length ? prev : 0));
  }, [questions.length]);
  
  useEffect(() => {
    if (!examId || !exam || isLoading || submitted || !examDraftKey) return;

    const draft = {
      examId,
      userId,
      startedAt: startedAtRef.current,
      updatedAt: new Date().toISOString(),
      currentQ,
      answers,
      flagged: Array.from(flagged),
      uploadedFiles,
      cqStatus,
      timeLeft,
      submitted: false,
    };

    try {
      localStorage.setItem(examDraftKey, JSON.stringify(draft));
      sessionStorage.setItem(
        `examInProgress_${examId}`,
        JSON.stringify({ startedAt: startedAtRef.current, updatedAt: draft.updatedAt })
      );
    } catch (e) {
      console.error("Failed to persist exam draft", e);
    }
  }, [examId, exam, isLoading, submitted, examDraftKey, userId, currentQ, answers, flagged, uploadedFiles, cqStatus, timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    setShowConfirm(false);
    // Mark exam as completed (user-scoped)
    try {
      const uid = user?.id || (user as any)?._id || 'anon';
      const compKey = `completedExams_${uid}`;
      const stored = localStorage.getItem(compKey) || localStorage.getItem("completedExams");
      const completed = stored ? JSON.parse(stored) : [];
      if (!completed.includes(examId)) {
        completed.push(examId);
        localStorage.setItem(compKey, JSON.stringify(completed));
      }
    } catch (e) {
      console.error("Failed to save completed exam", e);
    }
    // Detect CQ (written) sub-questions. If any parent with subQuestions exists, mark result as pending evaluation
    const hasCQ = questions.some((q) => Array.isArray(q.subQuestions) && q.subQuestions.length > 0);
    const totalMarks = exam?.totalMarks || 0;
    let score = 0;
    let percentage = 0;

    if (!hasCQ) {
      // Calculate score only when there are no written sub-questions
      questions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) score += q.marks;
        else if (answers[q.id] && exam?.negativeMarking) score -= exam.negativeMarkValue;
      });
      percentage = totalMarks > 0 ? Math.round((Math.max(0, score) / totalMarks) * 100) : 0;
    }

    const timeTaken = (exam?.duration || 0) * 60 - timeLeft;
    const result: any = {
      examId,
      score: hasCQ ? null : Math.max(0, score),
      totalMarks,
      percentage: hasCQ ? null : percentage,
      answers,
      cqStatus,
      timeTaken,
      completedAt: new Date().toISOString(),
      pendingEvaluation: hasCQ,
    };

    // Build attachments: upload files to Cloudinary if available, else fall back to data-URL
    let attachmentsPayload: Record<string, { name: string; type: string; url?: string; dataUrl?: string } | Array<{ name: string; type: string; url?: string; dataUrl?: string }>> = {};
    try {
      // import helper lazily to avoid loading when not needed
      const { uploadFileToCloudinary } = await import('@/services/cloudinary');
      for (const qid of Object.keys(uploadedFiles)) {
        const files = uploadedFiles[qid] || [];
        if (!files.length) continue;

        const uploadedEntries: Array<{ name: string; type: string; url?: string; dataUrl?: string }> = [];

        for (const f of files) {
          try {
            const fileObj = await dataUrlToFile(f.dataUrl, f.name, f.type);
            // attempt Cloudinary upload
            try {
              const url = await uploadFileToCloudinary(fileObj);
              uploadedEntries.push({ name: f.name, type: f.type, url });
              continue;
            } catch (uploadErr) {
              console.warn('Cloudinary upload failed, falling back to data-URL', uploadErr);
              uploadedEntries.push({ name: f.name, type: f.type, dataUrl: f.dataUrl });
            }
          } catch (e) {
            console.error('Failed to prepare attachment for', qid, e);
            uploadedEntries.push({ name: f.name, type: f.type, dataUrl: f.dataUrl });
          }
        }

        if (uploadedEntries.length === 1) attachmentsPayload[qid] = uploadedEntries[0];
        else if (uploadedEntries.length > 1) attachmentsPayload[qid] = uploadedEntries;
      }
    } catch (e) {
      console.error('Failed preparing attachments', e);
    }

    // Submit result to backend; include pendingEvaluation flag and attachments
    let savedResult: any = null;
    try {
      const resp = await examResultsAPI.submit({
        examId,
        answers,
        cqStatus,
        score: result.score,
        totalMarks,
        percentage: result.percentage,
        timeTaken,
        pendingEvaluation: result.pendingEvaluation,
        attachments: Object.keys(attachmentsPayload).length > 0 ? attachmentsPayload : undefined,
      });
      savedResult = resp?.data || resp;
    } catch (e) {
      console.error("Failed to submit result to backend", e);
      savedResult = result;
    }

    // If this was a self-created exam (local), keep sessionStorage so ExamResult can load instantly.
    try {
      const selfExamKey = `selfExam_${examId}`;
      const selfExamData = sessionStorage.getItem(selfExamKey);
      if (selfExamData) {
        const uid = user?.id || (user as any)?._id || 'anon';
        try {
          sessionStorage.setItem(`lastExamResult_${uid}`, JSON.stringify(savedResult || result));
        } catch (e) {
          sessionStorage.setItem('lastExamResult', JSON.stringify(savedResult || result));
        }
        // keep local copy for self exams
        const key = `examResults_${uid}`;
        try {
          const storedResults = localStorage.getItem(key) || localStorage.getItem('examResults');
          const results = storedResults ? JSON.parse(storedResults) : {};
          results[examId] = savedResult || result;
          localStorage.setItem(key, JSON.stringify(results));
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    // Persist uploaded files for manual evaluation later (store as data URLs)
    try {
      const uid = user?.id || (user as any)?._id || 'anon';
      const attachmentsKey = `examAttachments_${uid}_${examId}`;
      if (Object.keys(attachmentsPayload).length > 0) {
        try {
          localStorage.setItem(attachmentsKey, JSON.stringify(attachmentsPayload));
        } catch (e) {
          console.error('Failed to persist attachments', e);
        }
      }
    } catch (e) {
      console.error('Error while persisting attachments', e);
    }

    try {
      sessionStorage.removeItem(`examInProgress_${examId}`);
      if (examDraftKey) {
        localStorage.removeItem(examDraftKey);
      }
    } catch (e) {
      console.error("Failed to clear exam in progress", e);
    }

    // Notify user when manual evaluation is required
    if (hasCQ) {
      toast({ title: "Exam submitted successfully.", description: "Result is under preparation. Please wait for admin evaluation.", variant: "default" });
      // Do not show the result page — return student to exams list
      navigate('/exams');
      return;
    }
    // For auto-evaluated exams, go to the result page
    navigate(`/exam-result/${examId}`);
  }, [answers, cqStatus, exam, questions, submitted, timeLeft, examId, navigate, uploadedFiles, user, toast, examDraftKey]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !submitted && exam && exam.autoSubmit !== false) {
      handleSubmit();
    }
  }, [timeLeft, submitted, exam, handleSubmit]);

  if (isLoading) {
    return (
      <div className="py-20">
        <BeautifulLoader message="পরীক্ষা লোড করছি..." className="max-w-md mx-auto" />
      </div>
    );
  }
  if (!exam) return <div className="text-center py-20 text-muted-foreground">পরীক্ষা খুঁজে পাওয়া যাচ্ছে না</div>;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  // MCQ: count distinct question ids in answers; CQ: count parent ids in cqStatus
  const mcqQuestionIds = new Set(questions.filter(q => !q.subQuestions || q.subQuestions.length === 0).map(q => q.id));
  const mcqAnsweredCount = Object.keys(answers).filter(k => mcqQuestionIds.has(k)).length;
  const cqMarkedCount = Object.keys(cqStatus).length;
  const answeredCount = mcqAnsweredCount + cqMarkedCount;
  const totalCQQuestions = questions.filter(q => q.subQuestions && q.subQuestions.length > 0).length;
  const isUrgent = timeLeft < 60;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {submitted && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <BeautifulLoader message="পরীক্ষা সাবমিট হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন" className="w-full" />
          </div>
        </div>
      )}

      {/* Timer bar */}
      <div className={`flex items-center justify-between p-4 rounded-xl ${isUrgent ? "bg-destructive/10 border border-destructive/30" : "bg-card border border-border"}`}>
        <div>
          <p className="font-display font-bold text-lg">{exam.title}</p>
          <p className="text-sm text-muted-foreground font-bangla">
          {mcqAnsweredCount > 0 && <span>MCQ: {mcqAnsweredCount}/{questions.length - totalCQQuestions}</span>}
          {mcqAnsweredCount > 0 && totalCQQuestions > 0 && <span className="mx-1.5 opacity-40">•</span>}
          {totalCQQuestions > 0 && <span>CQ: {cqMarkedCount}/{totalCQQuestions} চিহ্নিত</span>}
          {mcqAnsweredCount === 0 && totalCQQuestions === 0 && <span>{answeredCount}/{questions.length} answered</span>}
        </p>
        </div>
        <div className={`flex items-center gap-2 text-lg font-mono font-bold ${isUrgent ? "text-destructive animate-pulse-soft" : "text-foreground"}`}>
          <Clock className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {(exam.questionPresentation === "one-by-one" ? [questions[currentQ]].filter(Boolean) : questions).map((qq, idx) => (
          <Card key={qq.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Question {exam.questionPresentation === "one-by-one" ? currentQ + 1 : idx + 1} of {questions.length}</span>
                <button
                  onClick={() => { const n = new Set(flagged); flagged.has(qq.id) ? n.delete(qq.id) : n.add(qq.id); setFlagged(n); }}
                  className={`flex items-center gap-1 text-sm ${flagged.has(qq.id) ? "text-warning" : "text-muted-foreground hover:text-warning"}`}>
                  <Flag className="h-4 w-4" /> {flagged.has(qq.id) ? "Flagged" : "Flag"}
                </button>
              </div>

              {qq.subQuestions ? (
                <div>
                  {(() => {
                    const isFillBlanksCq = Array.isArray(qq.subQuestions)
                      && qq.subQuestions.length > 0
                      && qq.subQuestions.some((sq: any) => String(sq?.type || '').toLowerCase().includes('fill blank'));
                    const fillBlankWordBank = isFillBlanksCq
                      ? shuffleWordBank(qq.subQuestions
                          .map((sq: any) => (sq.correctAnswer || sq.answerEn || sq.answerBn || '').toString().trim())
                          .filter((w: string) => w.length > 0)
                          .filter((w: string, i: number, arr: string[]) => arr.findIndex((x) => x.toLowerCase() === w.toLowerCase()) === i), String(qq?.id || examId || idx))
                      : [];
                    const isMakeSentencesCq = Array.isArray(qq.subQuestions)
                      && qq.subQuestions.length > 0
                      && qq.subQuestions.some((sq: any) => /make\s*sentences?/.test(String(sq?.type || sq?.subQuestionType || '').toLowerCase()));
                    const isInlineGapCq = Array.isArray(qq.subQuestions) && isInlineGapPlaceholderCq(qq.subQuestions);
                    const makeSentenceRows = isMakeSentencesCq
                      ? qq.subQuestions.map((sq: any, i: number) => ({
                          label: sq.label || String.fromCharCode(97 + i),
                          cols: splitPipedColumns(sq.questionText || sq.questionTextEn || sq.questionTextBn || "", 3),
                        }))
                      : [];

                    if (!isFillBlanksCq && !isMakeSentencesCq) return null;

                    return (
                      <div className="mb-4 rounded-lg border border-border bg-white dark:bg-slate-950 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <p className="text-foreground font-semibold leading-snug text-base">
                            {String(exam.questionPresentation === "one-by-one" ? currentQ + 1 : idx + 1).padStart(2, '0')}. Fill in the blanks with the words from the box.
                          </p>
                          {qq.boardYear ? <span className="text-pink-600 dark:text-pink-300 font-bold text-sm">[{qq.boardYear}]</span> : null}
                        </div>

                        {isFillBlanksCq && fillBlankWordBank.length > 0 && (
                          <div className="overflow-x-auto mb-4">
                            <table className="w-full border-collapse text-center text-sm">
                              <tbody>
                                {Array.from({ length: Math.ceil(fillBlankWordBank.length / 5) }).map((_, rowIndex) => {
                                  const rowWords = fillBlankWordBank.slice(rowIndex * 5, rowIndex * 5 + 5);
                                  return (
                                    <tr key={rowIndex}>
                                      {rowWords.map((word: string, colIndex: number) => (
                                        <td key={`${rowIndex}-${colIndex}`} className="border border-border px-2 py-1.5 font-medium">
                                          <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(word) }} />
                                        </td>
                                      ))}
                                      {Array.from({ length: Math.max(0, 5 - rowWords.length) }).map((__, emptyIndex) => (
                                        <td key={`empty-${rowIndex}-${emptyIndex}`} className="border border-border px-2 py-1.5" />
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {qq.parentPassage ? (
                          <div className="text-foreground leading-loose text-base font-serif" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(qq.parentPassage) }} />
                        ) : null}

                        {isMakeSentencesCq && (
                          <div className="overflow-x-auto mt-3">
                            <table className="w-full border-collapse text-sm">
                              <tbody>
                                {makeSentenceRows.map((row: any, rowIndex: number) => (
                                  <tr key={rowIndex}>
                                    <td className="border border-border px-2 py-1.5 w-16 font-semibold">({row.label})</td>
                                    <td className="border border-border px-2 py-1.5" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(row.cols[0]) }} />
                                    <td className="border border-border px-2 py-1.5" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(row.cols[1]) }} />
                                    <td className="border border-border px-2 py-1.5" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(row.cols[2]) }} />
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const isFillBlanksCq = Array.isArray(qq.subQuestions)
                      && qq.subQuestions.length > 0
                      && qq.subQuestions.some((sq: any) => String(sq?.type || '').toLowerCase().includes('fill blank'));
                    const isMakeSentencesCq = Array.isArray(qq.subQuestions)
                      && qq.subQuestions.length > 0
                      && qq.subQuestions.some((sq: any) => /make\s*sentences?/.test(String(sq?.type || sq?.subQuestionType || '').toLowerCase()));
                    const isInlineGapCq = Array.isArray(qq.subQuestions) && isInlineGapPlaceholderCq(qq.subQuestions);
                    if (isFillBlanksCq || isMakeSentencesCq || isInlineGapCq) return null;

                    return (
                      <>
                        {/* Question image (parent) */}
                        {qq.image && (
                          <div className="w-full flex justify-center bg-gray-50 py-3 mb-3 border border-border rounded">
                            <img src={qq.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                          </div>
                        )}

                        {qq.parentPassage ? (
                          <div className="mb-4 rounded-lg bg-card border border-border text-foreground p-4 leading-relaxed text-sm">
                            <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(qq.parentPassage) }} />
                          </div>
                        ) : null}

                        <div className="space-y-3">
                          {qq.subQuestions.map((sq: any, sidx: number) => (
                            <div key={sq.id || sidx} className="mb-4">
                              <div className="text-lg font-medium mb-2 flex items-start gap-3">
                                <div className="font-semibold min-w-[2.5rem]">{sq.label || ['ক','খ','গ','ঘ'][sidx] || `${sidx+1}.`}</div>
                                <div className="flex-1">
                                  {/* Sub-question image (falls back to parent image) */}
                                  {sq.image && (
                                    <div className="w-full flex justify-center mb-2">
                                      <img src={sq.image} alt="Sub-question" className="max-w-full h-auto max-h-48 object-contain rounded" />
                                    </div>
                                  )}
                                  <div className="mb-2"><span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.questionText) }} /></div>
                                  {sq.options && (
                                    <div className="space-y-2">
                                      {sq.options.map((opt: any, oi: number) => {
                                        const optText = typeof opt === 'string' ? opt : opt.text;
                                        const isSelected = answers[sq.id] === optText;
                                        const isLocked = exam.allowAnswerChange === false && Boolean(answers[sq.id]) && !isSelected;
                                        return (
                                          <button
                                            key={oi}
                                            disabled={isLocked}
                                            onClick={() => setAnswers({ ...answers, [sq.id]: optText })}
                                            className={`w-full text-left p-3 rounded-xl border text-sm ${isSelected ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/50 hover:bg-muted/50'} ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                                          >
                                            <span className="font-bold mr-3">{String.fromCharCode(65 + oi)}</span>
                                            <span dangerouslySetInnerHTML={{ __html: renderMathToHtml(optText) }} />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  {(() => {
                        const parsed = parseQuestionWithSubPoints(qq.questionText);
                        // question image for regular (non-passage) question
                        if (qq.image) {
                          return (
                            <>
                              <div className="w-full flex justify-center mb-3">
                                <img src={qq.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                              </div>
                              {parsed.hasSubPoints ? (
                                <div className="text-lg font-medium mb-6">
                                  {parsed.mainQuestion && <p className="mb-3" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(parsed.mainQuestion) }} />}
                                  <div className="ml-4 space-y-2">
                                    {parsed.subPoints.map((point: any, i: number) => (
                                      <div key={i} className="flex gap-2">
                                        <span className="font-semibold min-w-[2.5rem] text-base">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i]}</span>
                                        <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(point) }} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-lg font-medium mb-6" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(qq.questionText) }} />
                              )}
                            </>
                          );
                        }
                        if (parsed.hasSubPoints) {
                      return (
                        <div className="text-lg font-medium mb-6">
                          {parsed.mainQuestion && <p className="mb-3" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(parsed.mainQuestion) }} />}
                          <div className="ml-4 space-y-2">
                                {parsed.subPoints.map((point: any, i: number) => (
                                      <div key={i} className="flex gap-2">
                                        <span className="font-semibold min-w-[2.5rem] text-base">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i]}</span>
                                        <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(point) }} />
                                      </div>
                                    ))}
                          </div>
                        </div>
                      );
                    }
                    return <p className="text-lg font-medium mb-6" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(qq.questionText) }} />;
                  })()}

                  {/* Render options for MCQ / option-based questions */}
                  {qq.options && qq.options.length > 0 && (
                    <div className="space-y-2">
                      {qq.options.map((opt: any, oi: number) => {
                        const optText = typeof opt === 'string' ? opt : opt.text;
                        const isSelected = answers[qq.id] === optText;
                        const isLocked = exam.allowAnswerChange === false && Boolean(answers[qq.id]) && !isSelected;
                        return (
                          <button
                            key={oi}
                            disabled={isLocked}
                            onClick={() => setAnswers({ ...answers, [qq.id]: optText })}
                            className={`w-full text-left p-3 rounded-xl border text-sm ${isSelected ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/50 hover:bg-muted/50'} ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <span className="font-bold mr-3">{String.fromCharCode(65 + oi)}</span>
                            <span dangerouslySetInnerHTML={{ __html: renderMathToHtml(optText) }} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {qq.subQuestions && (
                <div className="mt-4 space-y-4">
                  {/* File upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2 font-bangla">উত্তরের ছবি / ফাইল আপলোড করুন (ঐচ্ছিক)</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        handleFileSelect(qq.id, files);
                      }}
                      className="block w-full text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF • সর্বোচ্চ ১০MB • একাধিক ফাইল নির্বাচন করা যাবে</p>
                    {(uploadedFiles[qq.id] || []).length > 0 && (
                      <div className="mt-2 space-y-2">
                        {(uploadedFiles[qq.id] || []).map((file, fileIdx) => (
                          <div key={`${file.name}-${fileIdx}`} className="flex items-center justify-between bg-muted/10 p-2 rounded">
                            <div className="text-sm truncate pr-2">{file.name}</div>
                            <button
                              className="text-xs text-destructive"
                              onClick={() => {
                                const next = [...(uploadedFiles[qq.id] || [])];
                                next.splice(fileIdx, 1);
                                setUploadedFiles((s) => ({ ...s, [qq.id]: next }));
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button className="text-xs text-destructive" onClick={() => handleFileSelect(qq.id, [])}>Remove all</button>
                      </div>
                    )}
                  </div>

                  {/* Answered / Skip toggle buttons */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2 font-bangla">এই প্রশ্নের জন্য আপনার অবস্থান চিহ্নিত করুন:</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setCqStatus((prev) => {
                            if (prev[qq.id] === 'answered') { const { [qq.id]: _, ...rest } = prev; return rest; }
                            return { ...prev, [qq.id]: 'answered' };
                          })
                        }
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold font-bangla transition-all ${
                          cqStatus[qq.id] === 'answered'
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:border-green-400 hover:text-green-600'
                        }`}
                      >
                        {cqStatus[qq.id] === 'answered' ? '✓ উত্তর দিয়েছি' : 'উত্তর দিয়েছি'}
                      </button>
                      <button
                        onClick={() =>
                          setCqStatus((prev) => {
                            if (prev[qq.id] === 'skipped') { const { [qq.id]: _, ...rest } = prev; return rest; }
                            return { ...prev, [qq.id]: 'skipped' };
                          })
                        }
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold font-bangla transition-all ${
                          cqStatus[qq.id] === 'skipped'
                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:border-orange-300 hover:text-orange-600'
                        }`}
                      >
                        {cqStatus[qq.id] === 'skipped' ? '⚠ এড়িয়ে যাচ্ছি' : 'এড়িয়ে যাচ্ছি'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {exam.questionPresentation === "one-by-one" && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={currentQ === 0}
            onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
          >
            আগের প্রশ্ন
          </Button>
          <Button
            variant="outline"
            disabled={currentQ >= questions.length - 1}
            onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
          >
            পরের প্রশ্ন
          </Button>
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-center pb-8">
        <Button
          disabled={submitted}
          className="w-full max-w-md bg-success hover:bg-success/90 text-white font-bold text-base py-6 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={() => setShowConfirm(true)}
        >
          {submitted ? "Submitting..." : "Submit Exam"}
        </Button>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
              <h3 className="text-lg font-display font-bold">Submit Exam?</h3>
              <div className="text-sm text-muted-foreground space-y-1 font-bangla">
                {questions.length - totalCQQuestions > 0 && (
                  <p>MCQ: <span className="font-semibold text-foreground">{mcqAnsweredCount}</span> / {questions.length - totalCQQuestions} টি উত্তর দিয়েছেন</p>
                )}
                {totalCQQuestions > 0 && (
                  <p>সৃজনশীল: <span className="font-semibold text-foreground">{cqMarkedCount}</span> / {totalCQQuestions} টি চিহ্নিত
                    {cqMarkedCount < totalCQQuestions && <span className="text-warning"> ({totalCQQuestions - cqMarkedCount} টি চিহ্নিত নেই)</span>}
                  </p>
                )}
                {answeredCount < questions.length && totalCQQuestions === 0 && (
                  <p>Unanswered questions will be marked as skipped.</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={submitted}>Go Back</Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={submitted}>{submitted ? "Submitting..." : "Submit"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TakeExam;
