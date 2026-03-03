import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examsAPI, examResultsAPI } from "@/services/api";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from "lucide-react";
import { parseQuestionWithSubPoints } from "@/lib/utils";

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Load exam data on mount
  useEffect(() => {
    if (!examId) {
      setIsLoading(false);
      return;
    }

    try {
      sessionStorage.setItem(`examInProgress_${examId}`, JSON.stringify({ startedAt: new Date().toISOString() }));
    } catch (e) {
      console.error("Failed to mark exam in progress", e);
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
        setExam(parsed.exam);
        setQuestions(parsed.questions || []);
        setTimeLeft((parsed.exam?.duration || 0) * 60);
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
                  image: sq.image || q.image || null,
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
              questionText: parentPassage,
              options,
              correctAnswer: normalizedOptions.find((opt: any) => opt.isCorrect)?.text || "",
              explanation: q.explanation || "",
              marks: transformedExam.marksPerQuestion,
            });
          }
        });

        const orderedQuestions = transformedExam.shuffleQuestions ? shuffleArray(transformedQuestions) : transformedQuestions;

        setExam(transformedExam);
        setQuestions(orderedQuestions);
        setTimeLeft((dbExam.duration || 0) * 60);
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

  const handleFileSelect = (qid: string, file?: File | null) => {
    if (!file) {
      setUploadedFiles((s) => ({ ...s, [qid]: null }));
      return;
    }
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (!allowed.includes(file.type)) {
      toast({ title: "Unsupported file format", description: "Only JPG, PNG and PDF are allowed", variant: "destructive" });
      return;
    }
    if (file.size > maxBytes) {
      toast({ title: "File too large", description: "Max file size is 10MB", variant: "destructive" });
      return;
    }
    setUploadedFiles((s) => ({ ...s, [qid]: file }));
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
    if (questions.length > 0) {
      setCurrentQ(0);
    }
  }, [questions.length]);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
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
      timeTaken,
      completedAt: new Date().toISOString(),
      pendingEvaluation: hasCQ,
    };

    // Build attachments: upload files to Cloudinary if available, else fall back to data-URL
    let attachmentsPayload: Record<string, { name: string; type: string; url?: string; dataUrl?: string }> = {};
    try {
      // import helper lazily to avoid loading when not needed
      const { uploadFileToCloudinary } = await import('@/services/cloudinary');
      for (const qid of Object.keys(uploadedFiles)) {
        const f = uploadedFiles[qid];
        if (!f) continue;
        try {
          // attempt Cloudinary upload
          try {
            const url = await uploadFileToCloudinary(f);
            attachmentsPayload[qid] = { name: f.name, type: f.type, url };
            continue;
          } catch (uploadErr) {
            console.warn('Cloudinary upload failed, falling back to data-URL', uploadErr);
            const dataUrl = await fileToDataUrl(f);
            attachmentsPayload[qid] = { name: f.name, type: f.type, dataUrl };
          }
        } catch (e) {
          console.error('Failed to prepare attachment for', qid, e);
        }
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
  }, [answers, exam, questions, submitted, timeLeft, examId, navigate, uploadedFiles, user, toast]);

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
  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeft < 60;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Timer bar */}
      <div className={`flex items-center justify-between p-4 rounded-xl ${isUrgent ? "bg-destructive/10 border border-destructive/30" : "bg-card border border-border"}`}>
        <div>
          <p className="font-display font-bold text-lg">{exam.title}</p>
          <p className="text-sm text-muted-foreground">{answeredCount}/{questions.length} answered</p>
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
                  {/* Question image (parent) */}
                  {qq.image && (
                    <div className="w-full flex justify-center bg-gray-50 py-3 mb-3 border border-border rounded">
                      <img src={qq.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                    </div>
                  )}

                  {qq.parentPassage ? (
                    <div className="mb-4 rounded-lg bg-card border border-border text-foreground p-4 leading-relaxed text-sm">
                      <p className="whitespace-pre-line">{qq.parentPassage}</p>
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
                            <div className="mb-2">{sq.questionText}</div>
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
                                      {optText}
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
                                  {parsed.mainQuestion && <p className="mb-3">{parsed.mainQuestion}</p>}
                                  <div className="ml-4 space-y-2">
                                    {parsed.subPoints.map((point: any, i: number) => (
                                      <div key={i} className="flex gap-2">
                                        <span className="font-semibold min-w-[2.5rem] text-base">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i]}</span>
                                        <span className="text-base">{point}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-lg font-medium mb-6">{qq.questionText}</p>
                              )}
                            </>
                          );
                        }
                        if (parsed.hasSubPoints) {
                      return (
                        <div className="text-lg font-medium mb-6">
                          {parsed.mainQuestion && <p className="mb-3">{parsed.mainQuestion}</p>}
                          <div className="ml-4 space-y-2">
                            {parsed.subPoints.map((point: any, i: number) => (
                              <div key={i} className="flex gap-2">
                                <span className="font-semibold min-w-[2.5rem] text-base">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i]}</span>
                                <span className="text-base">{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return <p className="text-lg font-medium mb-6">{qq.questionText}</p>;
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
                            {optText}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {qq.subQuestions && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Upload written answer for this passage (optional)</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={async (e) => {
                      const f = e.target.files?.[0] || null;
                      handleFileSelect(qq.id, f || undefined);
                    }}
                    className="block w-full text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Supported formats: JPG, PNG, PDF • Max file size: 10MB</p>
                  {uploadedFiles[qq.id] && (
                    <div className="mt-2 flex items-center justify-between bg-muted/10 p-2 rounded">
                      <div className="text-sm">{uploadedFiles[qq.id]?.name}</div>
                      <button className="text-xs text-destructive" onClick={() => handleFileSelect(qq.id, null)}>Remove</button>
                    </div>
                  )}
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
        <Button className="w-full max-w-md bg-success hover:bg-success/90 text-white font-bold text-base py-6 rounded-xl transition-all hover:scale-[1.02]" onClick={() => setShowConfirm(true)}>
          Submit Exam
        </Button>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
              <h3 className="text-lg font-display font-bold">Submit Exam?</h3>
              <p className="text-sm text-muted-foreground">
                You answered {answeredCount} of {questions.length} questions.
                {answeredCount < questions.length && " Unanswered questions will be marked as skipped."}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Go Back</Button>
                <Button className="flex-1" onClick={handleSubmit}>Submit</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TakeExam;
