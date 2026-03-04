import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { examsAPI, examResultsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, XCircle, ArrowLeft, RotateCcw, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseQuestionWithSubPoints, percentageToGrade } from "@/lib/utils";

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

  useEffect(() => {
    loadResultData();
  }, [examId, user]);

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
              questionText: q.questionTextBn || q.questionTextEn || q.questionText || "",
              parentPassage: q.questionTextBn || q.questionTextEn || q.questionText || "",
              image: q.image || null,
              subQuestions: (q.subQuestions || []).map((sq: any, idx: number) => ({
                id: `${q._id}-${idx}`,
                dbId: sq._id || null,
                image: sq.image || q.image || null,
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
  const correct = questions.filter((q) => result.answers[q.id] === q.correctAnswer).length;
  const wrong = questions.filter((q) => result.answers[q.id] && result.answers[q.id] !== q.correctAnswer).length;
  const skipped = questions.length - correct - wrong;

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
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, idx) => {
            // If this is a CQ parent with subQuestions, render grouped view
            if (q.subQuestions && Array.isArray(q.subQuestions)) {
              return (
                <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="rounded-xl border p-5 shadow-sm bg-white">
                  <div className="mb-3">
                    {/* parent image */}
                    {q.image && (
                      <div className="w-full flex justify-center bg-gray-50 py-3 mb-3 border border-border rounded">
                        <img src={q.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                      </div>
                    )}
                    {q.parentPassage ? (
                      <div className="font-medium leading-relaxed whitespace-pre-line">{q.parentPassage}</div>
                    ) : null}
                  </div>
                  <div className="space-y-4">
                    {q.subQuestions.map((sq: any, sidx: number) => {
                      const userAns = result.answers ? result.answers[sq.id] : undefined;
                      const isCorrect = userAns === sq.correctAnswer;
                      const isSkipped = !userAns;
                      // compute assigned mark from result.cqMarks if present
                      const assignedMarkRaw = (() => {
                        if (!result?.cqMarks) return undefined;
                        return result.cqMarks[sq.id] ?? result.cqMarks[sq.dbId] ?? result.cqMarks[`${q.id}-${sidx}`] ?? result.cqMarks[`${q.id}-${sidx}`];
                      })();
                      const assignedMark = typeof assignedMarkRaw !== 'undefined' && assignedMarkRaw !== null ? Number(assignedMarkRaw) : null;
                      const maxMark = typeof sq.maxMark !== 'undefined' && sq.maxMark !== null ? Number(sq.maxMark) : null;
                      return (
                        <div key={sq.id} className={`rounded-lg border p-4 ${isCorrect ? 'border-green-500/30 bg-green-50/50' : isSkipped ? 'border-gray-300 bg-gray-50' : 'border-red-500/30 bg-red-50/50'}`}>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-muted-foreground">উপ-প্রশ্ন {sidx+1}</span>
                                {isCorrect && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ সঠিক</span>}
                                {!isCorrect && !isSkipped && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">✗ ভুল</span>}
                                {isSkipped && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">বাদ</span>}
                              </div>
                              <div className="font-medium leading-relaxed">{sq.questionText}</div>
                              {/* sub-question image (if any) */}
                              {sq.image && (
                                <div className="mt-2 mb-3 flex justify-center">
                                  <img src={sq.image} alt="Sub-question" className="max-w-full h-auto max-h-48 object-contain rounded" />
                                </div>
                              )}
                            </div>
                            <div className="flex-none ml-4 flex items-center">
                              {assignedMark !== null ? (
                                <div className="flex items-center space-x-2">
                                  <div className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/30 font-semibold text-sm">{assignedMark}</div>
                                  {maxMark !== null ? (
                                    <div className="text-xs text-muted-foreground">/ {maxMark}</div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">নম্বর</div>
                                  )}
                                </div>
                              ) : (
                                <div className="px-3 py-1 rounded-full bg-gray-50 text-gray-700 border border-border text-xs">{isPending ? 'অপেক্ষা' : (maxMark !== null ? `/ ${maxMark}` : '-')}</div>
                              )}
                            </div>
                          </div>

                          {/* Options */}
                          {sq.options && sq.options.length > 0 && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sq.options.map((opt: any, i: number) => {
                                const optionText = typeof opt === 'string' ? opt : opt.text;
                                const isCorrectOption = (opt && opt.isCorrect) || optionText === sq.correctAnswer;
                                const isUserAnswer = userAns === optionText;
                                return (
                                  <div key={i} className={`px-4 py-2.5 rounded-lg border text-sm ${isCorrectOption ? 'border-green-500 bg-green-50 font-medium' : isUserAnswer && !isCorrectOption ? 'border-red-500 bg-red-50' : 'border-border bg-card'}`}>
                                    <div className="flex items-center justify-between">
                                      <span><span className="font-bold text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>{optionText}</span>
                                      {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                                      {isUserAnswer && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                            <div className="text-sm">
                              {isSkipped ? <span className="italic">আপনি উত্তর দেননি</span> : <><span className="font-medium">আপনার উত্তর:</span> <span className="font-bold">{userAns}</span></>}
                              {!isCorrect && !isSkipped && <div className="text-green-700 mt-1"><span className="font-medium">সঠিক উত্তর:</span> <span className="font-bold">{sq.correctAnswer}</span></div>}
                            </div>
                            {sq.explanation && (
                              <Button size="sm" variant="outline" onClick={() => setExpandedQuestion(`${sq.id}`)} className="text-xs">বিস্তারিত</Button>
                            )}
                          </div>
                          {expandedQuestion === sq.id && sq.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 border rounded">{sq.explanation}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            }

            // Regular question
            const userAns = result.answers ? result.answers[q.id] : undefined;
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
                        {parsed.mainQuestion && <p className="mb-3">{parsed.mainQuestion}</p>}
                        <div className="ml-4 space-y-2">
                          {parsed.subPoints.map((point, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-semibold min-w-[2.5rem] text-sm">{['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.'][i]}</span>
                              <span className="text-sm">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground font-medium leading-relaxed font-bangla">{q.questionText}</p>
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
                              {optionText}
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
                            <span className="font-medium">আপনার উত্তর:</span> <span className="font-bold">{userAns}</span>
                          </p>
                          {!isCorrect && (
                            <p className="text-green-700 dark:text-green-400 font-bangla">
                              <span className="font-medium">সঠিক উত্তর:</span> <span className="font-bold">{q.correctAnswer}</span>
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
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed font-bangla">{q.explanation}</p>
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
