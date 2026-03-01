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

        const transformedQuestions = (dbExam.questionIds || []).map((q: any) => {
          const rawOptions = q.options || [];
          const normalizedOptions = rawOptions.map((opt: any) => {
            if (typeof opt === "string") return { text: opt };
            return opt;
          });
          const options = transformedExam.shuffleOptions ? shuffleArray(normalizedOptions) : normalizedOptions;
          return {
            id: q._id,
            questionText: q.questionTextBn || q.questionTextEn || "",
            options,
            correctAnswer: normalizedOptions.find((opt: any) => opt.isCorrect)?.text || "",
            explanation: q.explanation || "",
            marks: transformedExam.marksPerQuestion,
          };
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
    // Calculate score
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) score += q.marks;
      else if (answers[q.id] && exam?.negativeMarking) score -= exam.negativeMarkValue;
    });
    const totalMarks = exam?.totalMarks || 0;
    const percentage = totalMarks > 0 ? Math.round((Math.max(0, score) / totalMarks) * 100) : 0;
    const timeTaken = (exam?.duration || 0) * 60 - timeLeft;
    const result = {
      examId,
      score: Math.max(0, score),
      totalMarks,
      percentage,
      answers,
      timeTaken,
      completedAt: new Date().toISOString()
    };
    // Submit result to backend. For self-created exams we still keep local session copy so result page loads instantly.
    let savedResult: any = null;
    try {
      const resp = await examResultsAPI.submit({
        examId,
        answers,
        score: Math.max(0, score),
        totalMarks,
        percentage,
        timeTaken,
      });
      // resp expected shape: { success: true, data: result }
      savedResult = resp?.data || resp;
    } catch (e) {
      console.error("Failed to submit result to backend", e);
      // fall back to client-side storage so user doesn't lose result
      savedResult = result;
    }

    // If this was a self-created exam (local), keep sessionStorage so ExamResult can load immediately.
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
    // savedResult already handled above
    try {
      sessionStorage.removeItem(`examInProgress_${examId}`);
    } catch (e) {
      console.error("Failed to clear exam in progress", e);
    }
    navigate(`/exam-result/${examId}`);
  }, [answers, exam, questions, submitted, timeLeft, examId, navigate]);

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

              {(() => {
                const parsed = parseQuestionWithSubPoints(qq.questionText);
                
                if (parsed.hasSubPoints) {
                  return (
                    <div className="text-lg font-medium mb-6">
                      {parsed.mainQuestion && <p className="mb-3">{parsed.mainQuestion}</p>}
                      <div className="ml-4 space-y-2">
                        {parsed.subPoints.map((point, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="font-semibold min-w-[2.5rem] text-base">{['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.'][i]}</span>
                            <span className="text-base">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                return <p className="text-lg font-medium mb-6">{qq.questionText}</p>;
              })()}

              {qq.options && (
                <div className="space-y-3">
                  {qq.options.map((opt: any, i: number) => {
                    const optText = typeof opt === "string" ? opt : opt.text;
                    const isSelected = answers[qq.id] === optText;
                    const isLocked = exam.allowAnswerChange === false && Boolean(answers[qq.id]) && !isSelected;
                    return (
                      <button
                        key={i}
                        disabled={isLocked}
                        onClick={() => setAnswers({ ...answers, [qq.id]: optText })}
                        className={`w-full text-left p-4 rounded-xl border text-sm transition-all ${
                          isSelected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50 hover:bg-muted/50"
                        } ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <span className="font-bold mr-3">{String.fromCharCode(65 + i)}</span>
                        {optText}
                      </button>
                    );
                  })}
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
