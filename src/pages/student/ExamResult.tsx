import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { examsAPI, examResultsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, XCircle, ArrowLeft, RotateCcw, Trophy, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Paperclip, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isInlineGapPlaceholderCq, parseQuestionWithSubPoints, percentageToGrade, renderMathToHtml, renderRichOrMathHtml, shuffleWordBank, splitPipedColumns } from "@/lib/utils";

const ExamResult = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [resolvedExam, setResolvedExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [subjectStats, setSubjectStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [subjectHistory, setSubjectHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [resultAttachments, setResultAttachments] = useState<Record<string, any[]>>({});
  const [feedbackAttachments, setFeedbackAttachments] = useState<Record<string, any[]>>({});
  const [cqFilter, setCqFilter] = useState<'all' | 'answered' | 'skipped'>('all');

  // ----- FeedbackImageSlider: beautiful animated slider with lightbox -----
  const FeedbackImageSlider = ({ images, isTeacherFeedback = false }: { images: any[]; isTeacherFeedback?: boolean }) => {
    const [idx, setIdx] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    if (!images.length) return null;
    const safeIdx = Math.min(idx, images.length - 1);
    const img = images[safeIdx];
    const imgUrl = img?.dataUrl || img?.url || '';
    const isImage = (img?.type && img.type.startsWith('image/')) || /\.(jpg|jpeg|png|gif|webp)$/i.test(img?.name || '');
    const isPdf = img?.type === 'application/pdf' || /\.pdf$/i.test(img?.name || '');
    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-b border-indigo-100 dark:border-indigo-900/30">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 font-bangla">
              {isTeacherFeedback ? 'শিক্ষকের ফিডব্যাক' : 'আপলোড করা উত্তর'}
            </span>
          </div>
          {images.length > 1 && (
            <span className="ml-auto text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
              {safeIdx + 1} / {images.length}
            </span>
          )}
        </div>
        {/* Image area */}
        <div className="relative bg-slate-50 dark:bg-slate-900/50 min-h-[180px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isImage && imgUrl ? (
              <motion.div
                key={safeIdx}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center items-center w-full p-3"
              >
                <img
                  src={imgUrl}
                  alt={img?.name || `ছবি ${safeIdx + 1}`}
                  className="max-h-80 w-auto max-w-full object-contain rounded-lg cursor-zoom-in hover:brightness-95 transition-all shadow-sm"
                  onClick={() => setLightbox(true)}
                />
              </motion.div>
            ) : isPdf ? (
              <motion.div key={safeIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-5 w-full">
                <Paperclip className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                <span className="text-sm font-medium flex-1 font-bangla">{img?.name || 'PDF ফাইল'}</span>
                {imgUrl && <a href={imgUrl} download={img?.name || 'file.pdf'} className="text-xs text-indigo-600 hover:underline">Download</a>}
              </motion.div>
            ) : (
              <motion.div key={safeIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-5 w-full">
                <Paperclip className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                <span className="text-sm font-medium flex-1 font-bangla">{img?.name || `ফাইল ${safeIdx + 1}`}</span>
                {imgUrl && <a href={imgUrl} download={img?.name} className="text-xs text-indigo-600 hover:underline">Download</a>}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Prev / Next arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setIdx(i => Math.max(0, i - 1))}
                disabled={safeIdx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-border shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-all z-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIdx(i => Math.min(images.length - 1, i + 1))}
                disabled={safeIdx === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-border shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-all z-10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        {/* Footer: filename + dot indicators */}
        {(img?.name || images.length > 1) && (
          <div className="px-4 py-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
            {img?.name && <span className="text-xs text-muted-foreground truncate flex-1 font-bangla">{img.name}</span>}
            {images.length > 1 && (
              <div className="flex items-center gap-1 ml-auto">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-200 ${i === safeIdx ? 'w-5 bg-indigo-500' : 'w-1.5 bg-indigo-200 dark:bg-indigo-700 hover:bg-indigo-400'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {/* Lightbox */}
        <AnimatePresence>
          {lightbox && isImage && imgUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightbox(false)}
            >
              <motion.img
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={imgUrl}
                alt={img?.name || 'ছবি'}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                onClick={e => e.stopPropagation()}
              />
              <button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors border border-white/20"
                onClick={() => setLightbox(false)}
              >
                <X className="h-5 w-5" />
              </button>
              {images.length > 1 && (
                <div className="absolute bottom-6 flex items-center gap-3">
                  <button
                    onClick={e => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); }}
                    disabled={safeIdx === 0}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-white text-sm font-medium px-2">{safeIdx + 1} / {images.length}</span>
                  <button
                    onClick={e => { e.stopPropagation(); setIdx(i => Math.min(images.length - 1, i + 1)); }}
                    disabled={safeIdx === images.length - 1}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  useEffect(() => {
    loadResultData();
  }, [examId, user]);

  // Load attachments: merge result.attachments (backend URLs) with localStorage dataURLs
  useEffect(() => {
    if (!result || !examId) return;
    const map: Record<string, any[]> = {};
    const feedbackMap: Record<string, any[]> = {};

    const normalizeAttachmentKey = (rawKey: string) => {
      // Group child attachment keys (e.g. parentId-0) under the parent CQ id.
      const key = String(rawKey);
      const parent = questions.find(
        (q: any) => q.subQuestions && Array.isArray(q.subQuestions) && (String(q.id) === key || key.startsWith(`${String(q.id)}-`))
      );
      return parent ? String(parent.id) : key;
    };

    const pushAttachments = (rawKey: string, value: any) => {
      const key = normalizeAttachmentKey(rawKey);
      const list = Array.isArray(value) ? value : [value];
      if (!map[key]) map[key] = [];
      map[key].push(...list);
    };

    const pushFeedbackAttachments = (rawKey: string, value: any) => {
      const key = normalizeAttachmentKey(rawKey);
      const list = Array.isArray(value) ? value : [value];
      if (!feedbackMap[key]) feedbackMap[key] = [];
      feedbackMap[key].push(...list);
    };

    if (result.attachments && typeof result.attachments === 'object') {
      Object.entries(result.attachments).forEach(([k, a]: any) => {
        pushAttachments(k, a);
      });
    }

    if (result.feedbackAttachments && typeof result.feedbackAttachments === 'object') {
      Object.entries(result.feedbackAttachments).forEach(([k, a]: any) => {
        pushFeedbackAttachments(k, a);
      });
    }

    // merge localStorage fallback (dataURLs saved by TakeExam)
    try {
      const uid = user?.id || (user as any)?._id || 'anon';
      const stored = localStorage.getItem(`examAttachments_${uid}_${examId}`);
      if (stored) {
        const local = JSON.parse(stored) as Record<string, any>;
        Object.entries(local).forEach(([k, a]: any) => {
          pushAttachments(k, a);
        });
      }
    } catch (_e) {
      // ignore parse/storage errors
    }

    setResultAttachments(map);
    setFeedbackAttachments(feedbackMap);
  }, [result, examId, user, questions]);

  const loadResultData = async () => {
    try {
      setLoading(true);
      
      // Load result: prefer sessionStorage (immediate), then localStorage map, then backend
      let resultData: any = null;
      try {
        const uid = user?.id || (user as any)?._id || 'anon';
        const resultStr = sessionStorage.getItem(`lastExamResult_${uid}`) || sessionStorage.getItem("lastExamResult");
        if (resultStr) {
          const parsed = JSON.parse(resultStr);
          if (parsed && String(parsed.examId) === String(examId)) resultData = parsed;
        }
      } catch (e) {
        /* ignore parse errors */
      }

      // fallback to localStorage map (saved by TakeExam)
      if (!resultData) {
        try {
          const uid = user?.id || (user as any)?._id || 'anon';
          const key = `examResults_${uid}`;
          const stored = localStorage.getItem(key) || localStorage.getItem('examResults');
          if (stored) {
            const map = JSON.parse(stored);
            if (map && map[examId]) resultData = map[examId];
          }
        } catch (e) {
          // ignore
        }
      }

      // final fallback: ask backend for my results and pick the one for this exam
      if (!resultData) {
        try {
          const mineRes = await examResultsAPI.getMine();
          let myResults = Array.isArray(mineRes) ? mineRes : (mineRes.data || []);
          const uid = user?.id || (user as any)?._id || null;
          if (uid) myResults = myResults.filter((r: any) => String(r.studentId?._id || r.studentId || r.student || uid) === String(uid));
          const found = myResults.find((r: any) => {
            const id = r.examId?._id || r.examId || r.exam?._id || r.exam;
            return String(id) === String(examId);
          });
          if (found) resultData = found;
        } catch (e) {
          // ignore
        }
      }

      if (!resultData) {
        setLoading(false);
        return;
      }

      setResult(resultData);
      
      // Check if this is a self-test exam
      const selfExamKey = `selfExam_${examId}`;
      const selfExamData = sessionStorage.getItem(selfExamKey);
      
      let examForStats: any = null;
      if (selfExamData) {
        // Self-test exam - load from sessionStorage
        const parsed = JSON.parse(selfExamData);
        setResolvedExam(parsed.exam);
        setQuestions(parsed.questions || []);
        examForStats = parsed.exam;
      } else {
        // Database exam - load from API
        const response = await examsAPI.get(examId);
        const dbExam = response.data;
        
        if (!dbExam) {
          toast({
            title: "পরীক্ষা খুঁজে পাওয়া যাচ্ছে না",
            variant: "destructive",
          });
          return;
        }
        
        // Transform for display (include subject if available)
        const transformedExam = {
          id: dbExam._id,
          title: dbExam.title,
          duration: dbExam.duration,
          totalMarks: dbExam.totalMarks,
          subject: dbExam.subjectId && (dbExam.subjectId.name || dbExam.subjectId),
          subjectId: dbExam.subjectId?._id || dbExam.subjectId,
        };
        
        const transformedQuestions = (dbExam.questionIds || []).map((q: any) => {
          // If CQ parent with subQuestions, transform accordingly
          if (q && q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
            // determine parent total marks from exam.questionMarks, question.marks, or default 10
            const parentTotalMarks = (dbExam.questionMarks && Array.isArray(dbExam.questionMarks))
              ? (dbExam.questionMarks.find((m: any) => String(m.questionId) === String(q._id))?.marks ?? q.marks ?? 10)
              : (q.marks ?? 10);

            const count = q.subQuestions.length || 1;
            const perSubMax = parentTotalMarks / Math.max(1, count);

            return {
              id: q._id,
              boardYear: q.boardYear || "",
              questionType: q.questionType || "",
              questionText: q.questionTextBn || q.questionTextEn || q.questionText || "",
              parentPassage: q.questionTextBn || q.questionTextEn || q.questionText || "",
              image: q.image || null,
              subQuestions: (q.subQuestions || []).map((sq: any, idx: number) => ({
                id: `${q._id}-${idx}`,
                dbId: sq._id || null,
                // Keep child image scoped to child only; avoid repeating parent image for every child.
                image: sq.image || null,
                questionText: sq.questionTextBn || sq.questionTextEn || sq.questionText || "",
                options: sq.options || [],
                correctAnswer: sq.options?.find((opt: any) => opt.isCorrect)?.text || "",
                explanation: sq.explanation || q.explanation || "",
                label: sq.label || (['ক','খ','গ','ঘ'][idx] || `${idx+1}.`),
                type: sq.type || null,
                // max mark for this sub-question (may be fractional)
                maxMark: perSubMax,
              })),
              explanation: q.explanation || "",
              // store parent total for reference
              parentTotalMarks,
            };
          }

          // Regular question
          return {
            id: q._id,
            image: q.image || null,
            boardYear: q.boardYear || "",
            questionType: q.questionType || "",
            questionText: q.questionTextBn || q.questionTextEn || q.questionText || "",
            options: q.options || [],
            correctAnswer: q.options?.find((opt: any) => opt.isCorrect)?.text || "",
            explanation: q.explanation || "",
          };
        });
        
        setResolvedExam(transformedExam);
        setQuestions(transformedQuestions);
        examForStats = transformedExam;
      }
      // After loading resolvedExam and result, fetch history/stats
        try {
        // Try backend first
        const mineRes = await examResultsAPI.getMine();
        let myResults = Array.isArray(mineRes) ? mineRes : (mineRes.data || []);
        const uid = user?.id || (user as any)?._id || null;
        if (uid) myResults = myResults.filter((r: any) => String(r.studentId?._id || r.studentId || r.student || uid) === String(uid));
        const related: any[] = [];
        for (const r of myResults) {
          // r may include populated exam in `examId`
          const examObj = r.examId || r.exam || r.dbExam || null;
          let subjId = null;
          if (examObj) {
            if (examObj.subjectId && typeof examObj.subjectId === 'object') subjId = examObj.subjectId._id || examObj.subjectId;
            else subjId = examObj.subjectId || null;
          }
          if (examForStats && subjId && examForStats.subjectId && String(subjId) === String(examForStats.subjectId)) {
            const perc = r.percentage ?? (r.score ? Math.round((r.score / (r.totalMarks || 1)) * 100) : 0);
            related.push({ ...r, percentage: perc, exam: examObj });
          }
        }
        const recent = related.sort((a,b) => new Date(b.completedAt || b.createdAt || 0).getTime() - new Date(a.completedAt || a.createdAt || 0).getTime()).slice(0,5);
        const avg = recent.length ? Math.round(recent.reduce((s, it) => s + (it.percentage || 0), 0) / recent.length) : 0;
        setSubjectHistory(recent);
        setSubjectStats({ average: avg, count: related.length });
      } catch (e) {
        // Fallback to localStorage-based history
        try {
          const uid = user?.id || (user as any)?._id || 'anon';
          const key = `examResults_${uid}`;
          const stored = localStorage.getItem(key) || localStorage.getItem('examResults');
          const resultsMap = stored ? JSON.parse(stored) : {};
          const related: any[] = [];
          for (const [eid, res] of Object.entries(resultsMap)) {
            try {
              const exResp = await examsAPI.get(String(eid));
              const ex = exResp.data;
              let subjId = null;
              if (ex) {
                if (ex.subjectId && typeof ex.subjectId === 'object') subjId = ex.subjectId._id || ex.subjectId;
                else subjId = ex.subjectId || null;
              }
              if (examForStats && subjId && examForStats.subjectId && String(subjId) === String(examForStats.subjectId)) {
                const resData = res as any;
                const perc = resData.percentage ?? (resData.score ? Math.round((resData.score / (resData.totalMarks || 1)) * 100) : 0);
                related.push({ exam: ex, ...resData, percentage: perc });
              }
            } catch (ee) {
              // ignore per-exam fetch errors
            }
          }
          const recent = related.sort((a,b) => new Date(b.completedAt || b.createdAt || 0).getTime() - new Date(a.completedAt || a.createdAt || 0).getTime()).slice(0,5);
          const avg = related.length ? Math.round(related.reduce((s, it) => s + (it.percentage || 0), 0) / related.length) : 0;
          setSubjectHistory(recent);
          setSubjectStats({ average: avg, count: related.length });
        } catch (ee) {
          // final fallback: empty
          setSubjectHistory([]);
          setSubjectStats({ average: 0, count: 0 });
        }
      }
    } catch (err) {
      console.error("Failed to load result data:", err);
      toast({
        title: "ফলাফল লোড করতে ব্যর্থ",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 font-bangla">
        <BeautifulLoader message="ফলাফল লোড করছি..." className="max-w-md mx-auto" />
      </div>
    );
  }

  if (!resolvedExam || !result) {
    return (
      <div className="text-center py-20 font-bangla">
        <p className="text-muted-foreground mb-4">No result found</p>
        <Button onClick={() => navigate("/exams")}>Back to Exams</Button>
      </div>
    );
  }

  const isPending = Boolean(result?.pendingEvaluation);
  const answers = result?.answers || {};
  const mcqQuestions = questions.filter((q) => !q.subQuestions || q.subQuestions.length === 0);
  const cqQuestions = questions.filter((q) => q.subQuestions && q.subQuestions.length > 0);
  const hasMcq = mcqQuestions.length > 0;
  const hasCqOnly = cqQuestions.length > 0 && mcqQuestions.length === 0;
  const cqStatus = (result?.cqStatus && typeof result.cqStatus === 'object') ? result.cqStatus : {};
  const cqAnsweredCount = cqQuestions.filter((q) => cqStatus[q.id] === 'answered').length;
  const cqSkippedCount = cqQuestions.filter((q) => cqStatus[q.id] === 'skipped').length;
  const correct = mcqQuestions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const wrong = mcqQuestions.filter((q) => answers[q.id] && answers[q.id] !== q.correctAnswer).length;
  const skipped = mcqQuestions.length - correct - wrong;
  const reviewQuestions = questions.filter((q) => {
    const isCQ = q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0;
    if (!isCQ) return cqFilter === 'all';
    if (cqFilter === 'all') return true;
    return cqStatus[q.id] === cqFilter;
  });

  const safePercentage = Number(result?.percentage) || 0;
  const grade = percentageToGrade(safePercentage);
  // map grade to color
  const gradeColor = (() => {
    switch (grade) {
      case 'A+': return 'text-success';
      case 'A':
      case 'A-': return 'text-success';
      case 'B': return 'text-warning';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      default: return 'text-destructive';
    }
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-bangla p-4">
      {/* Score card */}
      <Card className="text-center shadow-lg">
        <CardContent className="p-8">
          <Trophy className={`h-16 w-16 mx-auto mb-4 ${gradeColor}`} />
          <h1 className="text-3xl font-display font-bold mb-1">পরীক্ষা সম্পন্ন হয়েছে!</h1>
          <p className="text-muted-foreground mb-6 text-lg">{resolvedExam.title}</p>

          {isPending ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-warning">Under Review</div>
              <div className="text-sm text-muted-foreground">Your submission is under manual evaluation. You will be notified when the result is published.</div>
            </div>
          ) : (
            <>
              <div className={`text-6xl font-display font-bold ${gradeColor} mb-2`}>{Number(safePercentage).toFixed(2)}%</div>
              <div className={`text-2xl font-bold ${gradeColor}`}>গ্রেড: {grade}</div>
            </>
          )}

            {/* Marks breakdown: compute MCQ / CQ breakdown using result and question metadata */}
            {(() => {
              // sum assigned CQ marks from result.cqMarks
              const cqAssigned = questions.reduce((s: number, q: any) => {
                if (!q.subQuestions || !Array.isArray(q.subQuestions)) return s;
                return s + q.subQuestions.reduce((ss: number, sq: any, idx: number) => {
                  const sidCandidates = [sq.id, sq.dbId, `${q.id}-${idx}`, `${q.id}-${idx}`];
                  let val = undefined;
                  if (result?.cqMarks) {
                    for (const k of sidCandidates) {
                      if (k && typeof result.cqMarks[k] !== 'undefined') { val = result.cqMarks[k]; break; }
                    }
                  }
                  return ss + (typeof val !== 'undefined' && val !== null ? Number(val) : 0);
                }, 0);
              }, 0);

              // sum max marks for CQ subquestions (we populated sq.maxMark earlier)
              const cqMax = questions.reduce((s: number, q: any) => {
                if (!q.subQuestions || !Array.isArray(q.subQuestions)) return s;
                return s + q.subQuestions.reduce((ss: number, sq: any) => ss + (Number(sq.maxMark || 0)), 0);
              }, 0);

              const totalMax = Number(result?.totalMarks || resolvedExam?.totalMarks || (cqMax + questions.filter(q => !q.subQuestions).length * 1));
              const mcqMax = Math.max(0, totalMax - cqMax);
              // number of MCQ questions
              const mcqCount = questions.filter(q => !q.subQuestions).length;
              // compute MCQ score from current correct answers to reflect live changes (admin edits)
              const mcqCorrectCount = questions.filter(q => !q.subQuestions && result.answers[q.id] === q.correctAnswer).length;
              const perMcqMark = mcqCount > 0 ? (mcqMax / mcqCount) : 0;
              const mcqScoreComputed = Math.max(0, mcqCorrectCount * perMcqMark);
              // fallback to stored result.score-derived MCQ if no answers present
              const mcqScoreFromResult = Math.max(0, Number(result?.score || 0) - cqAssigned);
              const mcqScore = Number.isFinite(mcqScoreComputed) && mcqCount > 0 ? mcqScoreComputed : mcqScoreFromResult;

              // total displayed score = computed MCQ + assigned CQ marks
              const displayedTotal = Number(mcqScore) + Number(cqAssigned);

              return (
                <div className="mt-6">
                  <div className="max-w-3xl mx-auto p-4 border border-border rounded-lg bg-card">
                    <div className="text-sm font-medium text-muted-foreground">Marks Breakdown</div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3 rounded-md bg-muted/10 text-center">
                        <div className="text-sm text-muted-foreground">MCQ Marks</div>
                        <div className="text-lg font-semibold text-foreground">{Number(mcqScore).toFixed(2)} / {Number(mcqMax).toFixed(2)}</div>
                      </div>
                      <div className="p-3 rounded-md bg-muted/10 text-center">
                        <div className="text-sm text-muted-foreground">CQ Marks</div>
                        <div className="text-lg font-semibold text-foreground">{Number(cqAssigned).toFixed(2)} / {Number(cqMax).toFixed(2)}</div>
                      </div>
                      <div className="p-3 rounded-md bg-muted/10 text-center">
                        <div className="text-sm text-muted-foreground">Total Marks</div>
                        <div className="text-lg font-semibold text-foreground">{Number(displayedTotal).toFixed(2)} / {Number(totalMax).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {hasMcq && (
            <div className="flex justify-center gap-8 mt-8 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-2xl">{correct}</span>
                <span className="text-muted-foreground mt-1">সঠিক</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-red-600 dark:text-red-400 font-bold text-2xl">{wrong}</span>
                <span className="text-muted-foreground mt-1">ভুল</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-600 dark:text-gray-400 font-bold text-2xl">{skipped}</span>
                <span className="text-muted-foreground mt-1">বাদ</span>
              </div>
            </div>
            )}

            {hasCqOnly && (
            <div className="flex justify-center gap-8 mt-8 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-2xl">{cqAnsweredCount}</span>
                <span className="text-muted-foreground mt-1 font-bangla">উত্তর দিয়েছে</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-orange-600 dark:text-orange-400 font-bold text-2xl">{cqSkippedCount}</span>
                <span className="text-muted-foreground mt-1 font-bangla">স্কিপ করেছে</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-foreground font-bold text-2xl">{cqQuestions.length}</span>
                <span className="text-muted-foreground mt-1 font-bangla">মোট প্রশ্ন</span>
              </div>
            </div>
            )}

          <div className="flex gap-3 justify-center mt-8">
            <Button variant="outline" onClick={() => navigate("/exams")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> সকল পরীক্ষা
            </Button>
            <Button onClick={() => navigate("/results")}>
              সকল ফলাফল দেখুন
            </Button>
          </div>
        </CardContent>
      </Card>

        

      {/* Answer review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bangla">উত্তরপত্র পর্যালোচনা (Answer Review)</CardTitle>
          {cqQuestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant={cqFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCqFilter('all')}
                className="font-bangla"
              >
                সব প্রশ্ন ({questions.length})
              </Button>
              <Button
                variant={cqFilter === 'answered' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCqFilter('answered')}
                className="font-bangla"
              >
                উত্তর প্রশ্ন ({cqAnsweredCount})
              </Button>
              <Button
                variant={cqFilter === 'skipped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCqFilter('skipped')}
                className="font-bangla"
              >
                স্কিপ প্রশ্ন ({cqSkippedCount})
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {reviewQuestions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground font-bangla">
              {cqFilter === 'answered' && 'উত্তর দেওয়া কোনও প্রশ্ন পাওয়া যায়নি'}
              {cqFilter === 'skipped' && 'স্কিপ করা কোনও প্রশ্ন পাওয়া যায়নি'}
              {cqFilter === 'all' && 'দেখানোর মতো প্রশ্ন নেই'}
            </div>
          )}
          {reviewQuestions.map((q, idx) => {
            // ── CQ parent with sub-questions ──────────────────────────────
            if (q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
              // Aggregate assigned marks for the header total
              const totalCQAssigned = q.subQuestions.reduce((sum: number, sq: any, sidx: number) => {
                if (!result?.cqMarks) return sum;
                const val = result.cqMarks[sq.id] ?? result.cqMarks[sq.dbId] ?? result.cqMarks[`${q.id}-${sidx}`];
                return sum + (typeof val !== 'undefined' && val !== null ? Number(val) : 0);
              }, 0);
              const parentTotalMax = q.parentTotalMarks ?? q.subQuestions.reduce((s: number, sq: any) => s + (Number(sq.maxMark) || 0), 0);
              const hasCQMarks = result?.cqMarks && q.subQuestions.some((sq: any, sidx: number) =>
                typeof (result.cqMarks[sq.id] ?? result.cqMarks[sq.dbId] ?? result.cqMarks[`${q.id}-${sidx}`]) !== 'undefined'
              );
              const isFillBlanksCq = q.subQuestions.some((sq: any) => String(sq?.type || '').toLowerCase().includes('fill blank'));
              const isMakeSentencesCq = q.subQuestions.some((sq: any) => /make\s*sentences?/.test(String(sq?.type || sq?.subQuestionType || '').toLowerCase()));
              const isInlineGapCq = isInlineGapPlaceholderCq(q.subQuestions);
              const fillBlankWordBank = isFillBlanksCq
                ? shuffleWordBank(q.subQuestions
                    .map((sq: any) => (sq.correctAnswer || sq.answerEn || sq.answerBn || '').toString().trim())
                    .filter((w: string) => w.length > 0)
                    .filter((w: string, i: number, arr: string[]) => arr.findIndex((x) => x.toLowerCase() === w.toLowerCase()) === i), String(q?.id || idx))
                : [];
              const makeSentenceRows = isMakeSentencesCq
                ? q.subQuestions.map((sq: any, i: number) => ({
                    label: sq.label || String.fromCharCode(97 + i),
                    cols: splitPipedColumns(sq.questionText || sq.questionTextEn || sq.questionTextBn || "", 3),
                  }))
                : [];
              // Attachments (teacher feedback + original uploads merged)
              const qFeedbackAtts = feedbackAttachments[q.id] || [];
              const qOriginalAtts = resultAttachments[q.id] || [];
              const mergedCount = Math.max(qFeedbackAtts.length, qOriginalAtts.length);
              const qAtts = Array.from({ length: mergedCount }, (_, i) => qFeedbackAtts[i] || qOriginalAtts[i]).filter(Boolean);
              const hasTeacherFeedback = qFeedbackAtts.some(Boolean);

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-card"
                >
                  {/* ── Header bar ── */}
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full font-bangla">সৃজনশীল</span>
                      <span className="text-white font-bold text-sm font-bangla">প্রশ্ন {idx + 1}</span>
                    </div>
                    {hasCQMarks ? (
                      <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
                        <span className="text-white font-bold text-sm tabular-nums">{Number(totalCQAssigned).toFixed(0)}</span>
                        <span className="text-white/70 text-xs font-bangla">/ {Number(parentTotalMax).toFixed(0)} নম্বর</span>
                      </div>
                    ) : (
                      <span className="text-white/80 text-xs bg-white/10 px-2.5 py-1 rounded-full font-bangla">
                        {isPending ? 'মূল্যায়ন বাকি' : `মোট ${Number(parentTotalMax).toFixed(0)} নম্বর`}
                      </span>
                    )}
                  </div>

                  {/* ── Parent passage ── */}
                  {q.parentPassage && (
                    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                      {q.image && (
                        <div className="w-full flex justify-center mb-3">
                          <img src={q.image} alt="প্রশ্নের ছবি" className="max-w-full h-auto max-h-60 object-contain rounded-lg border border-border" />
                        </div>
                      )}
                      {isFillBlanksCq ? (
                        <div className="rounded-lg border border-border bg-white dark:bg-slate-950 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <p className="text-foreground font-semibold leading-snug text-base">
                              {String(idx + 1).padStart(2, '0')}. Fill in the blanks with the words from the box.
                            </p>
                            {q.boardYear ? <span className="text-pink-600 dark:text-pink-300 font-bold text-sm">[{q.boardYear}]</span> : null}
                          </div>

                          {fillBlankWordBank.length > 0 && (
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

                          <div className="text-foreground leading-loose text-base font-serif" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.parentPassage) }} />
                        </div>
                      ) : isMakeSentencesCq ? (
                        <div className="rounded-lg border border-border bg-white dark:bg-slate-950 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <p className="text-foreground font-semibold leading-snug text-base" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.parentPassage || "Make sentences from the table.") }} />
                            {q.boardYear ? <span className="text-pink-600 dark:text-pink-300 font-bold text-sm">[{q.boardYear}]</span> : null}
                          </div>
                          <div className="overflow-x-auto">
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
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-violet-400 to-indigo-400 self-stretch min-h-[1rem]" />
                          <div className="font-medium leading-relaxed text-foreground font-bangla text-sm" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.parentPassage) }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Sub-questions ── */}
                  {!isFillBlanksCq && !isMakeSentencesCq && !isInlineGapCq && <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {q.subQuestions.map((sq: any, sidx: number) => {
                      const userAns = answers[sq.id];
                      const assignedMarkRaw = (() => {
                        if (!result?.cqMarks) return undefined;
                        return result.cqMarks[sq.id] ?? result.cqMarks[sq.dbId] ?? result.cqMarks[`${q.id}-${sidx}`];
                      })();
                      const assignedMark = typeof assignedMarkRaw !== 'undefined' && assignedMarkRaw !== null ? Number(assignedMarkRaw) : null;
                      const maxMark = typeof sq.maxMark !== 'undefined' && sq.maxMark !== null ? Number(sq.maxMark) : null;
                      const markPct = assignedMark !== null && maxMark ? assignedMark / maxMark : null;
                      const markBadgeClass =
                        markPct !== null
                          ? markPct >= 0.8
                            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300'
                            : markPct >= 0.5
                            ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                            : markPct > 0
                            ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                            : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400';
                      const bengaliLabels = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ'];
                      const label = sq.label || bengaliLabels[sidx] || `${sidx + 1}`;
                      return (
                        <div key={sq.id} className="px-5 py-4">
                          <div className="flex gap-3">
                            {/* Bengali label circle */}
                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-base font-bold font-bangla mt-0.5 ring-2 ring-indigo-200 dark:ring-indigo-800">
                              {label}
                            </div>
                            {/* Question text + options + explanation */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium leading-relaxed text-foreground font-bangla" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.questionText) }} />
                              {sq.image && (
                                <div className="mt-2 flex justify-start">
                                  <img src={sq.image} alt="উপ-প্রশ্নের ছবি" className="max-w-full h-auto max-h-48 object-contain rounded-lg border border-border" />
                                </div>
                              )}
                              {sq.options && sq.options.length > 0 && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {sq.options.map((opt: any, i: number) => {
                                    const optionText = typeof opt === 'string' ? opt : opt.text;
                                    const isCorrectOption = (opt && opt.isCorrect) || optionText === sq.correctAnswer;
                                    const isUserAnswer = userAns === optionText;
                                    return (
                                      <div key={i} className={`px-3 py-2 rounded-lg border text-sm font-bangla ${
                                        isCorrectOption
                                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20 font-medium'
                                          : isUserAnswer && !isCorrectOption
                                          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                          : 'border-border bg-muted/30'
                                      }`}>
                                        <div className="flex items-center justify-between gap-2">
                                          <span>
                                            <span className="font-bold text-muted-foreground mr-1.5">{String.fromCharCode(65 + i)}.</span>
                                            <span dangerouslySetInnerHTML={{ __html: renderMathToHtml(optionText) }} />
                                          </span>
                                          {isCorrectOption && <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />}
                                          {isUserAnswer && !isCorrectOption && <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {sq.explanation && (
                                <div className="mt-3">
                                  <button
                                    onClick={() => setExpandedQuestion(expandedQuestion === sq.id ? null : sq.id)}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bangla flex items-center gap-1"
                                  >
                                    {expandedQuestion === sq.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    {expandedQuestion === sq.id ? 'ব্যাখ্যা লুকান' : 'ব্যাখ্যা দেখুন'}
                                  </button>
                                  <AnimatePresence>
                                    {expandedQuestion === sq.id && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-bangla text-blue-800 dark:text-blue-200" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.explanation) }} />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                            {/* ── Mark badge ── */}
                            <div className={`flex-shrink-0 min-w-[72px] flex flex-col items-center justify-center px-2 py-2.5 rounded-xl border-2 self-start ${markBadgeClass}`}>
                              {assignedMark !== null ? (
                                <span className="text-2xl font-bold leading-none tabular-nums">
                                  {Number(assignedMark) % 1 === 0 ? Number(assignedMark).toFixed(0) : Number(assignedMark).toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-xs font-medium opacity-60 font-bangla text-center leading-tight px-1">
                                  {isPending ? 'অপেক্ষা' : '—'}
                                </span>
                              )}
                              <span className="text-[10px] opacity-40 mt-1 font-bangla">নম্বর</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>}

                  {/* ── Teacher feedback image slider ── */}
                  {qAtts.length > 0 && (
                    <div className="px-4 pb-4">
                      <FeedbackImageSlider images={qAtts} isTeacherFeedback={hasTeacherFeedback} />
                    </div>
                  )}
                </motion.div>
              );
            }

            // Regular (MCQ) question
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correctAnswer;
            const isSkipped = !userAns;
            const parsed = parseQuestionWithSubPoints(q.questionText);

            return (
              <motion.div 
                key={q.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.03 }}
                className={`rounded-xl border p-5 shadow-sm transition-all ${
                  isCorrect ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : 
                  isSkipped ? "border-gray-300 bg-gray-50 dark:bg-gray-900/20" : 
                  "border-red-500/30 bg-red-50/50 dark:bg-red-950/20"
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-muted-foreground font-bangla">প্রশ্ন {idx + 1}</span>
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3" />
                          সঠিক
                        </span>
                      )}
                      {!isCorrect && !isSkipped && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                          <XCircle className="h-3 w-3" />
                          ভুল
                        </span>
                      )}
                      {isSkipped && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                          বাদ দেওয়া
                        </span>
                      )}
                    </div>
                    {/* question image for regular question */}
                    {q.image && (
                      <div className="w-full flex justify-center mb-3">
                        <img src={q.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                      </div>
                    )}
                    {parsed.hasSubPoints ? (
                      <div className="text-foreground font-medium leading-relaxed font-bangla">
                        {parsed.mainQuestion && <p className="mb-3" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(parsed.mainQuestion) }} />}
                        <div className="ml-4 space-y-2">
                          {parsed.subPoints.map((point, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-semibold min-w-[2.5rem] text-sm">{['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.'][i]}</span>
                              <span className="text-sm" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(point) }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground font-medium leading-relaxed font-bangla" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.questionText) }} />
                    )}
                  </div>
                </div>

                {/* Options Grid */}
                {q.options && q.options.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt: any, i: number) => {
                      const optionText = opt.text || opt;
                      const isCorrectOption = opt.isCorrect || optionText === q.correctAnswer;
                      const isUserAnswer = userAns === optionText;
                      
                      return (
                        <div 
                          key={i} 
                          className={`px-4 py-2.5 rounded-lg border text-sm transition-all font-bangla ${
                            isCorrectOption 
                              ? "border-green-500 bg-green-50 dark:bg-green-950/30 font-medium" 
                              : isUserAnswer && !isCorrectOption
                              ? "border-red-500 bg-red-50 dark:bg-red-950/30" 
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>
                              <span className="font-bold text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                              <span dangerouslySetInnerHTML={{ __html: renderMathToHtml(optionText) }} />
                            </span>
                            {isCorrectOption && (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" />
                            )}
                            {isUserAnswer && !isCorrectOption && (
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Status Summary */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm space-y-1">
                      {isSkipped ? (
                        <p className="text-gray-600 dark:text-gray-400 font-bangla">
                          <span className="font-medium">আপনার উত্তর:</span> <span className="italic">বাদ দেওয়া হয়েছে</span>
                        </p>
                      ) : (
                        <>
                          <p className={`font-bangla ${isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                            <span className="font-medium">আপনার উত্তর:</span> <span className="font-bold" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(userAns) }} />
                          </p>
                          {!isCorrect && (
                            <p className="text-green-700 dark:text-green-400 font-bangla">
                              <span className="font-medium">সঠিক উত্তর:</span> <span className="font-bold" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.correctAnswer) }} />
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    
                    {q.explanation && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)} 
                        className="text-xs font-bangla"
                      >
                        {expandedQuestion === q.id ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5 mr-1" />
                            ব্যাখ্যা লুকান
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5 mr-1" />
                            ব্যাখ্যা দেখুন
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Explanation (Expandable) */}
                <AnimatePresence>
                  {expandedQuestion === q.id && q.explanation && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: "auto", opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }} 
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 font-bangla">ব্যাখ্যা:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed font-bangla" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.explanation) }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamResult;
