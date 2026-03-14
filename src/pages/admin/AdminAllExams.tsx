import { useEffect, useMemo, useState } from "react";
import { examsAPI, questionsAPI, examResultsAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { parseQuestionWithSubPoints, renderMathToHtml, renderRichOrMathHtml } from "@/lib/utils";
import ExamCreationModal from "@/components/admin/ExamCreationModal";

type ExamQuestion = {
  _id: string;
  questionTextBn?: string;
  questionTextEn?: string;
  questionText?: string;
  options?: Array<{ text?: string } | string>;
  explanation?: string;
};

type Exam = {
  _id: string;
  title: string;
  duration: number;
  totalMarks: number;
  status?: "draft" | "live";
  questionIds?: ExamQuestion[];
  createdAt?: string;
  publishedAt?: string;
  description?: string;
  instructions?: string;
  warnings?: string;
  syllabus?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  marksPerQuestion?: number;
  negativeMarking?: boolean;
  negativeMarkValue?: number;
  questionNumbering?: string;
  questionPresentation?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  allowMultipleAttempts?: boolean;
  allowAnswerChange?: boolean;
  resultVisibility?: string;
  answerVisibility?: string;
  autoSubmit?: boolean;
};

const AdminAllExams = () => {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState<ExamQuestion[]>([]);
  const [tab, setTab] = useState<"live" | "previous">("live");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [regradeExamId, setRegradeExamId] = useState<string | null>(null);
  const [regrading, setRegrading] = useState(false);
  const [regradeResult, setRegradeResult] = useState<any>(null);
  const [regradeError, setRegradeError] = useState<string | null>(null);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response: any = await examsAPI.getAll();

      // Backend shape is typically: { success, count, data: Exam[] }
      // But keep this resilient so the page never crashes.
      const maybeArray =
        Array.isArray(response) ? response :
        Array.isArray(response?.data) ? response.data :
        Array.isArray(response?.data?.data) ? response.data.data :
        Array.isArray(response?.exams) ? response.exams :
        [];

      setExams(maybeArray);
    } catch (err) {
      console.error("Failed to load exams", err);
      toast({
        title: "Failed to load exams",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
    // load all questions once for preview resolution
    (async () => {
      try {
        const res: any = await questionsAPI.getAll();
        setAllQuestions(res.data || []);
      } catch (err) {
        console.error('Failed to load questions for preview:', err);
        setAllQuestions([]);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const listRaw = Array.isArray(exams) ? exams : [];
    let list = listRaw.slice();
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((e) => (e?.title || "").toLowerCase().includes(s));
    }
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);

    const asSortableString = (v: any) => {
      if (!v) return "";
      if (typeof v === "string") return v;
      try {
        return new Date(v).toISOString();
      } catch {
        return String(v);
      }
    };

    if (sortBy === "newest") list.sort((a, b) => asSortableString(b?.createdAt).localeCompare(asSortableString(a?.createdAt)));
    if (sortBy === "oldest") list.sort((a, b) => asSortableString(a?.createdAt).localeCompare(asSortableString(b?.createdAt)));
    if (sortBy === "title") list.sort((a, b) => (a?.title || "").localeCompare(b?.title || ""));
    return list;
  }, [exams, search, statusFilter, sortBy]);

  const live = filtered.filter((e) => e.status === "live");
  const previous = filtered.filter((e) => e.status !== "live");

  const toggleStatus = async (exam: Exam) => {
    try {
      // If publishing, require an explicit start date/time to avoid immediate live appearance
      if (exam.status !== "live") {
        if (!exam.startDate && !exam.startTime) {
          toast({
            title: "Set start date/time before publishing",
            description: "Please set a start date or time in the exam settings so students see it as Upcoming, not immediately Live.",
            variant: "destructive",
          });
          return;
        }
      }

      const response = exam.status === "live"
        ? await examsAPI.unpublish(exam._id)
        : await examsAPI.publish(exam._id);
      const updated = response.data;
      setExams((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      toast({
        title: updated.status === "live" ? "Exam published" : "Exam unpublished",
      });
    } catch (err) {
      console.error("Failed to toggle exam status", err);
      toast({
        title: "Failed to update exam",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const deleteExam = async (id: string) => {
    try {
      await examsAPI.delete(id);
      setExams((prev) => prev.filter((e) => e._id !== id));
      toast({ title: "Exam deleted" });
    } catch (err) {
      console.error("Failed to delete exam", err);
      toast({
        title: "Failed to delete exam",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getQuestionsForExam = (exam: Exam) => {
    const raw = exam.questionIds || [];
    // raw entries might be full question objects or ids. Keep CQ parent structure: return parent objects with `subQuestions` arrays
    const resolved: any[] = [];
    raw.forEach((entry: any) => {
      if (!entry) return;
      let qObj: any = null;
      if (typeof entry === 'string') {
        qObj = allQuestions.find((aq) => aq._id === entry || (aq as any).id === entry) || null;
      } else if (typeof entry === 'object') {
        qObj = entry;
      }

      if (!qObj) {
        resolved.push({ _id: String(entry), questionTextBn: "(question missing)" });
        return;
      }

      if (qObj.subQuestions && Array.isArray(qObj.subQuestions) && qObj.subQuestions.length > 0) {
        resolved.push({
          _id: qObj._id,
          questionTextBn: qObj.questionTextBn || qObj.questionText || "",
          parentPassage: qObj.questionTextBn || qObj.questionTextEn || qObj.questionText || "",
          subQuestions: (qObj.subQuestions || []).map((sq: any, idx: number) => ({
            _id: `${qObj._id}-${idx}`,
            label: sq.label,
            image: sq.image || qObj.image || null,
            questionTextBn: sq.questionTextBn || sq.questionTextEn || sq.questionText || sq.questionBn || "",
            options: sq.options || [],
            explanation: sq.explanation || qObj.explanation || "",
            type: sq.type,
          })),
        });
      } else {
        resolved.push(qObj);
      }
    });
    return resolved;
  };

  const openEdit = (exam: Exam) => {
    setEditExam(exam);
    setEditOpen(true);
  };

  const renderQuestionHeader = (index: number) => (
    <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">প্রশ্ন {index + 1}</span>
  );

  const renderStem = (question: any) => {
    const text = question.parentPassage || question.questionTextBn || question.questionTextEn || question.questionText || "";
    return text ? (
      <div className="rounded-lg bg-card border border-border text-foreground p-4 leading-relaxed text-sm">
        <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(text) }} />
      </div>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">All Exams</h1>
        <p className="text-muted-foreground">Manage all exams — split into Live and Previous for clarity.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input placeholder="Search by title" value={search} onChange={(e:any)=>setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <option value="all">All statuses</option>
            <option value="live">Live</option>
            <option value="draft">Draft</option>
          </select>
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setTab("live")} className={`px-4 py-2 rounded-lg ${tab === "live" ? "bg-success text-white" : "bg-card text-foreground"}`}>Live ({live.length})</button>
        <button onClick={() => setTab("previous")} className={`px-4 py-2 rounded-lg ${tab === "previous" ? "bg-success text-white" : "bg-card text-foreground"}`}>Previous ({previous.length})</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full">
            <BeautifulLoader message="Loading exams..." compact />
          </div>
        ) : (tab === "live" ? live : previous).length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No exams found for this selection.</p>
          </div>
        ) : (
          (tab === "live" ? live : previous).map((exam) => (
            <Card key={exam._id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-lg">{exam.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{exam.duration} mins • {exam.totalMarks} marks</p>
                  <p className="text-xs text-muted-foreground mt-2">{exam.createdAt ? `Created ${exam.createdAt}` : "No date"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${exam.status === "live" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{exam.status}</span>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" onClick={() => toggleStatus(exam)}>{exam.status === "live" ? "Unpublish" : "Publish"}</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(exam)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteExam(exam._id)}>Delete</Button>
                    <Dialog open={regradeExamId === exam._id} onOpenChange={(open) => { if (!open) { setRegradeExamId(null); setRegradeResult(null); setRegradeError(null); } }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary" onClick={() => setRegradeExamId(exam._id)}>Regrade Results</Button>
                      </DialogTrigger>
                      <DialogContent className="w-full sm:max-w-lg max-h-[60vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader>
                          <DialogTitle>Regrade Results</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">This will recompute MCQ marks using current correct answers and preserve any stored CQ marks. Students will see updated scores after this completes.</p>
                          {regrading ? (
                            <div className="py-4">
                              <BeautifulLoader message="Regrading results..." compact />
                            </div>
                          ) : regradeResult ? (
                            <div>
                              <p className="font-medium">Regraded {regradeResult.updatedCount || 0} result(s).</p>
                              {Array.isArray(regradeResult.updatedIds) && regradeResult.updatedIds.length > 0 && (
                                <div className="mt-2 text-sm text-muted-foreground max-h-40 overflow-y-auto">
                                  <p className="mb-1">Updated IDs:</p>
                                  <ul className="list-disc list-inside">
                                    {regradeResult.updatedIds.map((id:string)=> <li key={id} className="break-all">{id}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : regradeError ? (
                            <p className="text-sm text-destructive">{regradeError}</p>
                          ) : (
                            <p className="text-sm">Are you sure you want to regrade all results for <strong>{exam.title}</strong>?</p>
                          )}

                          <div className="flex items-center gap-2 justify-end">
                            {!regrading && !regradeResult && (
                              <Button size="sm" variant="ghost" onClick={() => { setRegradeExamId(null); }}>Cancel</Button>
                            )}
                            {!regrading && !regradeResult && (
                              <Button size="sm" onClick={async () => {
                                setRegrading(true); setRegradeError(null);
                                try {
                                  const resp:any = await examResultsAPI.regradeExam(exam._id);
                                  setRegradeResult(resp || { updatedCount: 0, updatedIds: [] });
                                  toast({ title: `Regraded ${resp?.updatedCount || 0} results` });

                                  // Clear known caches so clients fetch fresh data
                                  try {
                                    sessionStorage.removeItem('lastExamResult');
                                    for (const k of Object.keys(sessionStorage)) {
                                      if (k.startsWith('lastExamResult_')) sessionStorage.removeItem(k);
                                    }
                                    for (const k of Object.keys(localStorage)) {
                                      if (k.startsWith('examResults_') || k === 'examResults') localStorage.removeItem(k);
                                    }
                                  } catch (e) { /* ignore */ }

                                  // Refresh local exams list to reflect any changes
                                  await loadExams();
                                } catch (err:any) {
                                  console.error('Regrade failed', err);
                                  setRegradeError(err?.message || String(err));
                                  toast({ title: 'Regrade failed', description: err?.message || String(err), variant: 'destructive' });
                                } finally {
                                  setRegrading(false);
                                }
                              }}>Run Regrade</Button>
                            )}
                            {!regrading && regradeResult && (
                              <Button size="sm" onClick={() => { setRegradeExamId(null); setRegradeResult(null); }}>Close</Button>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog> 
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">Preview</Button>
                      </DialogTrigger>
                      <DialogContent className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader>
                          <DialogTitle>Exam Preview</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <h3 className="font-bold">{exam.title}</h3>
                          <p className="text-sm text-muted-foreground">{exam.duration} mins • {exam.totalMarks} marks</p>
                          <div className="mt-2 space-y-2">
                            {getQuestionsForExam(exam).map((q:any, i:number) => {
                              // If grouped CQ parent
                              if (q.subQuestions && Array.isArray(q.subQuestions)) {
                                return (
                                  <div key={q._id || i} className="p-3 border rounded-lg bg-card">
                                    {q.image ? (
                                      <div className="space-y-4 mb-3">
                                        <div className="flex flex-col lg:flex-row gap-4 items-start">
                                          <div className="w-full lg:w-40 pt-1 lg:flex-none">{renderQuestionHeader(i)}</div>
                                          <div className="w-full lg:flex-1 bg-gray-50 border border-border rounded-lg p-3 flex justify-center max-w-4xl mx-auto">
                                            <img src={q.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                                          </div>
                                          <div className="hidden lg:block lg:w-40 lg:flex-none" aria-hidden="true" />
                                        </div>
                                        {renderStem(q)}
                                      </div>
                                    ) : (
                                      <div className="mb-3">
                                        <div className="flex items-start gap-2 mb-3">{renderQuestionHeader(i)}<div className="flex-1 min-w-0" /></div>
                                        {renderStem(q)}
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      {q.subQuestions.map((sq:any, idx:number) => (
                                        <div key={sq._id} className="border-l-2 border-success/30 pl-3">
                                          <div className="flex items-start gap-2">
                                            <div className="w-6 flex-none font-semibold text-foreground text-base leading-tight">{sq.label || (['ক','খ','গ','ঘ'][idx] || `${idx+1}.`)}</div>
                                            <div className="flex-1">
                                                    <div className="text-foreground leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.questionTextBn || sq.questionTextEn || sq.questionText || sq.questionBn) }} />
                                                    {sq.image && (
                                                      <div className="mt-2 mb-2 flex justify-center">
                                                        <img src={sq.image} alt="Sub-question" className="max-w-full h-auto max-h-48 object-contain rounded" />
                                                      </div>
                                                    )}
                                              {sq.options && sq.options.length > 0 && (
                                                <ul className="mt-2 list-decimal list-inside text-sm">
                                                  {sq.options.map((opt:any, oidx:number)=>{
                                                    const t = typeof opt === "string" ? opt : opt.text;
                                                    return (<li key={oidx} dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(t) }} />);
                                                  })}
                                                </ul>
                                              )}
                                              {sq.explanation && <p className="text-xs text-muted-foreground mt-2" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.explanation) }} />}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }

                              // Fallback: regular single question
                              const questionText = q?.questionTextBn || q?.questionTextEn || q?.questionText || "(question missing)";
                              const parsed = parseQuestionWithSubPoints(questionText);
                              return (
                                <div key={q._id || i} className="p-3 border rounded-lg bg-card">
                                  {q.image ? (
                                    <div className="space-y-4 mb-3">
                                      <div className="flex flex-col lg:flex-row gap-4 items-start">
                                        <div className="w-full lg:w-40 pt-1 lg:flex-none">{renderQuestionHeader(i)}</div>
                                        <div className="w-full lg:flex-1 bg-gray-50 border border-border rounded-lg p-3 flex justify-center max-w-4xl mx-auto">
                                          <img src={q.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                                        </div>
                                        <div className="hidden lg:block lg:w-40 lg:flex-none" aria-hidden="true" />
                                      </div>
                                    </div>
                                  ) : null}
                                  {parsed.hasSubPoints ? (
                                    <div className="font-medium">
                                      {!q.image && <div className="mb-2">{renderQuestionHeader(i)}</div>}
                                      {parsed.mainQuestion && <p className="mb-2" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(parsed.mainQuestion) }} />}
                                      <div className="ml-4 space-y-1">
                                        {parsed.subPoints.map((point, idx) => (
                                                    <div key={idx} className="flex gap-2 text-sm">
                                                      <span className="font-semibold min-w-[2rem]">{['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.'][idx]}</span>
                                                      <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(point) }} />
                                                    </div>
                                                  ))}
                                      </div>
                                    </div>
                                    ) : (
                                    <div className="space-y-3">
                                      {!q.image && <div>{renderQuestionHeader(i)}</div>}
                                      <p className="font-medium" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(questionText) }} />
                                    </div>
                                  )}

                                  {q?.options && q.options.length > 0 && (
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {q.options.map((opt:any, idx:number) => {
                                        const text = typeof opt === 'string' ? opt : opt.text;
                                        return (
                                          <div key={idx} className="px-3 py-2 rounded border border-border bg-card text-sm">
                                            <span className="font-medium mr-2">{String.fromCharCode(65+idx)}.</span>
                                            <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(text) }} />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {q?.explanation && <p className="text-xs text-muted-foreground mt-2" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.explanation) }} />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ExamCreationModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initialExam={editExam}
        mode="edit"
        selectedQuestionIds={editExam?.questionIds?.map((q: any) => q._id || q) || []}
        onSuccess={(updated) => {
          if (!updated) return;
          setExams((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
          setEditOpen(false);
        }}
      />

    </div>
  );
};

export default AdminAllExams;
