import { useEffect, useMemo, useState } from "react";
import { classesAPI, groupsAPI, subjectsAPI, chaptersAPI, questionsAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { BookOpen, ChevronRight, ChevronDown } from "lucide-react";
import ExamCreationModal from "@/components/admin/ExamCreationModal";
import { renderRichOrMathHtml } from "@/lib/utils";

const ITEMS_PER_PAGE = 8;

const AdminExamBuilder = () => {
  const { toast } = useToast();

  // Database data
  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>("");

  // Load all data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, groupsRes, subjectsRes, chaptersRes, questionsRes] = await Promise.all([
        classesAPI.getAll(),
        groupsAPI.getAll(),
        subjectsAPI.getAll(),
        chaptersAPI.getAll(),
        questionsAPI.getAll()
      ]);

      setClasses(classesRes.data || []);
      setGroups(groupsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setChapters(chaptersRes.data || []);
      setDbQuestions(questionsRes.data || []);

      // Auto-select first class and group
      if (classesRes.data?.length > 0) {
        const firstClass = classesRes.data[0];
        setSelectedClassId(firstClass._id);

        const firstClassGroups = (groupsRes.data || []).filter((g: any) => (g.classId?._id || g.classId) === firstClass._id);
        if (firstClassGroups.length > 0) {
          setSelectedGroupId(firstClassGroups[0]._id);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast({ 
        title: "Failed to load data", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter data by selections
  const availableGroups = groups.filter(g => (g.classId?._id || g.classId) === selectedClassId);
  const availableSubjects = subjects.filter(s => (s.groupId?._id || s.groupId) === selectedGroupId);
  const availableChapters = selectedSubjectId ? chapters.filter(ch => (ch.subjectId?._id || ch.subjectId) === selectedSubjectId) : [];

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter questions from database
  const filteredQuestions = useMemo(() => {
    return dbQuestions.filter((q: any) => {
      if (selectedSubjectId && q.subjectId) {
        const qSubjectId = q.subjectId?._id || q.subjectId;
        if (qSubjectId !== selectedSubjectId) return false;
      }
      if (selectedChapterId && q.chapterId) {
        const qChapterId = q.chapterId?._id || q.chapterId;
        if (qChapterId !== selectedChapterId) return false;
      }
      if (selectedQuestionType && q.questionType !== selectedQuestionType) return false;
      if (search) {
        const text = ((q.questionTextBn || q.questionTextEn || q.questionText || q.questionBn) || "").toLowerCase();
        if (!text.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [dbQuestions, selectedSubjectId, selectedChapterId, selectedQuestionType, search]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE));
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const visible = filteredQuestions.slice(start, start + ITEMS_PER_PAGE);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questionMarksMap, setQuestionMarksMap] = useState<Record<string, number>>({});

  useEffect(() => { setCurrentPage(1); }, [selectedSubjectId, selectedChapterId, selectedQuestionType, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreateExam = () => {
    if (selectedIds.length === 0) return toast({ title: "No questions selected", description: "Select some questions first", variant: "destructive" });
    setPreviewOpen(true);
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [examCreationOpen, setExamCreationOpen] = useState(false);

  const handleProceedToCreate = () => {
    setPreviewOpen(false);
    setExamCreationOpen(true);
  };

  const handleExamCreationSuccess = () => {
    setSelectedIds([]);
    toast({ title: "পরীক্ষা তৈরি সফল!", description: "নতুন পরীক্ষা সফলভাবে তৈরি হয়েছে" });
  };

  const selectedQuestions = useMemo(() => {
    // Group selected questions: keep CQ parent objects with subQuestions array
    const map = new Map<string, any>();

    selectedIds.forEach((id) => {
      // explicit sub-question id like parentId-0
      if (typeof id === 'string' && id.includes('-')) {
        const parts = id.split('-');
        const idx = Number(parts.pop());
        const parentId = parts.join('-');
        const parent = dbQuestions.find((q: any) => q._id === parentId || q.id === parentId);
        if (!parent) return;
        const sq = parent.subQuestions && parent.subQuestions[idx];
        if (!sq) return;
        const key = parentId;
        if (!map.has(key)) {
          map.set(key, {
            _id: parent._id || parent.id,
            image: parent.image || null,
            questionTextBn: parent.questionTextBn || parent.questionText || "",
            parentPassage: parent.questionTextBn || parent.questionTextEn || parent.questionText || "",
            subQuestions: [],
          });
        }
        map.get(key).subQuestions.push({
          _id: `${parentId}-${idx}`,
          label: sq.label,
          questionTextBn: sq.questionTextBn || sq.questionTextEn || sq.questionText || sq.questionBn || "",
          image: sq.image || null,
          options: sq.options || [],
          explanation: sq.explanation || parent.explanation || "",
          type: sq.type,
        });
        return;
      }

      const found = dbQuestions.find((q: any) => q._id === id || q.id === id);
      if (!found) return;

      if (found.subQuestions && Array.isArray(found.subQuestions) && found.subQuestions.length > 0) {
        // full parent selected: include all subQuestions
        map.set(found._id, {
          _id: found._id,
          image: found.image || null,
          questionTextBn: found.questionTextBn || found.questionText || "",
          parentPassage: found.questionTextBn || found.questionTextEn || found.questionText || "",
          subQuestions: (found.subQuestions || []).map((sq: any, idx: number) => ({
            _id: `${found._id}-${idx}`,
            label: sq.label,
            questionTextBn: sq.questionTextBn || sq.questionTextEn || sq.questionText || sq.questionBn || "",
            image: sq.image || null,
            options: sq.options || [],
            explanation: sq.explanation || found.explanation || "",
            type: sq.type,
          })),
        });
      } else {
        // normal question
        map.set(found._id || found.id, found);
      }
    });

    return Array.from(map.values());
  }, [selectedIds, dbQuestions]);

  const totalMarks = useMemo(() => {
    if (!selectedIds || selectedIds.length === 0) return 0;
    let sum = 0;
    selectedQuestions.forEach((q: any) => {
      const id = q._id || q.id;
      const override = questionMarksMap[id];

      if (q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
        const marksForQuestion = typeof override !== 'undefined' ? override : (q.marks ?? 10);
        const count = q.subQuestions.length;
        const perSub = marksForQuestion / Math.max(1, count);
        sum += perSub * count;
      } else {
        const marksForQuestion = typeof override !== 'undefined' ? override : (q.marks ?? 1);
        sum += marksForQuestion;
      }
    });
    if (Number.isInteger(sum)) return sum;
    return Math.round(sum * 100) / 100;
  }, [selectedQuestions, questionMarksMap]);

  const selectedQuestionMarksArray = useMemo(() => {
    return selectedQuestions.map((q:any) => {
      const id = q._id || q.id;
      const dbQ = dbQuestions.find((x:any) => (x._id || x.id) === id);
      const defaultMarks = dbQ ? (dbQ.marks ?? (dbQ.subQuestions && dbQ.subQuestions.length > 0 ? 10 : 1)) : (q.subQuestions && q.subQuestions.length > 0 ? 10 : 1);
      const marks = typeof questionMarksMap[id] !== 'undefined' ? questionMarksMap[id] : defaultMarks;
      return { questionId: id, marks };
    });
  }, [selectedQuestions, questionMarksMap, dbQuestions]);

  const renderQuestionHeader = (index: number) => (
    <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">প্রশ্ন {index + 1}</span>
  );

  const renderStem = (question: any) => {
    const text = question.parentPassage || question.questionTextBn || question.questionTextEn || question.questionText || question.questionBn || "";
    return text ? (
      <div className="rounded-lg bg-card border border-border text-foreground p-4 leading-relaxed text-sm">
        <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(text) }} />
      </div>
    ) : null;
  };

  return (
    <div className="space-y-6 font-bangla pb-24">
      <div>
        <h1 className="text-2xl font-display font-bold">Create Exam</h1>
        <p className="text-muted-foreground mt-1">Select questions and create an exam</p>
      </div>

      {loading ? (
        <BeautifulLoader message="Loading data from database..." className="py-10" />
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={selectedClassId} 
              onChange={(e) => { 
                const val = e.target.value; 
                setSelectedClassId(val); 
                const newGroups = groups.filter(g => (g.classId?._id || g.classId) === val); 
                setSelectedGroupId(newGroups[0]?._id ?? ""); 
              }} 
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
            >
              {classes.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
            </select>
            <select 
              value={selectedGroupId} 
              onChange={(e) => setSelectedGroupId(e.target.value)} 
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
              disabled={availableGroups.length === 0}
            >
              {availableGroups.length === 0 ? (
                <option value="">No groups available - Create sections first!</option>
              ) : (
                availableGroups.map((g) => (<option key={g._id} value={g._id}>{g.name}</option>))
              )}
            </select>
            <div className="ml-auto flex items-center gap-2">
              <select 
                value={selectedQuestionType} 
                onChange={(e) => setSelectedQuestionType(e.target.value)}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
              >
                <option value="">All Types</option>
                <option value="MCQ">MCQ</option>
                <option value="CQ">CQ</option>
                <option value="গাণিতিক">গাণিতিক (Mathematical)</option>
                <option value="জ্ঞানমূলক">জ্ঞানমূলক (Knowledge-based)</option>
                <option value="অনুধাবনমূলক">অনুধাবনমূলক (Comprehension)</option>
                <option value="ছোট লিখিত/সংক্ষিপ্ত প্রশ্ন">ছোট লিখিত (Short written)</option>
                <option value="বড় লিখিত/রচনামূলক প্রশ্ন">বড় লিখিত (Long written)</option>
              </select>
              <Input placeholder="Search questions..." value={search} onChange={(e:any) => setSearch(e.target.value)} />
              <Button onClick={() => { setSelectedIds(filteredQuestions.map((q:any)=>q._id)); toast({ title: "Selected all visible" }); }}>Select All</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSubjects.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No subjects found for this group. Create sections first!</p>
              </div>
            ) : (
              availableSubjects.map((subject) => {
                const subjectChapters = availableChapters.filter(ch => (ch.subjectId?._id || ch.subjectId) === subject._id);
                const isExpanded = selectedSubjectId === subject._id;
                return (
                  <div key={subject._id} className={`bg-card rounded-xl border ${isExpanded?"border-success/50":"border-border"}`}>
                    <button onClick={() => setSelectedSubjectId(isExpanded ? null : subject._id)} className="w-full p-4 flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-bold">{subject.name}</div>
                          <div className="text-xs text-muted-foreground">{subjectChapters.length} chapters</div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        {subjectChapters.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">No chapters found</p>
                        ) : (
                          subjectChapters.map((ch) => (
                            <div key={ch._id} className="flex items-center justify-between py-2">
                              <button onClick={() => { setSelectedChapterId(ch._id); setCurrentPage(1); }} className="text-left flex-1">{ch.name}</button>
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Questions listing for selected chapter */}
          {selectedSubjectId && selectedChapterId && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing questions for <strong>{subjects.find(s=>s._id===selectedSubjectId)?.name}</strong> / <strong>{chapters.find(c=>c._id===selectedChapterId)?.name}</strong>
              </div>
          <div className="grid grid-cols-1 gap-3">
            {visible.map((q:any, idx:number) => (
              <div key={q._id} className="bg-muted/20 p-4 rounded-lg flex items-start gap-3">
                <div className="pt-1"><Checkbox checked={selectedIds.includes(q._id)} onCheckedChange={() => toggleSelect(q._id)} /></div>
                <div className="flex-1">
                  {q.image ? (
                    <div className="space-y-4">
                      <div className="flex flex-col lg:flex-row gap-4 items-start">
                        <div className="w-full lg:w-40 pt-1 lg:flex-none">{renderQuestionHeader(idx)}</div>
                        <div className="w-full lg:flex-1 bg-gray-50 border border-border rounded-lg p-3 flex justify-center max-w-4xl mx-auto">
                          <img src={q.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                        </div>
                        <div className="hidden lg:block lg:w-40 lg:flex-none" aria-hidden="true" />
                      </div>
                      {renderStem(q)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        {renderQuestionHeader(idx)}
                        <div className="flex-1 min-w-0" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.questionTextBn || q.questionTextEn || q.questionText || q.questionBn || "") }} />
                      </div>
                    </div>
                  )}

                  {/* If this question has subQuestions (CQ), render them */}
                  {q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {(q.subQuestions || []).map((sq:any, idx:number) => (
                        <div key={idx} className="border-l-2 border-success/30 pl-3">
                          <div className="flex items-start gap-2">
                            <div className="w-6 flex-none font-semibold text-foreground text-base leading-tight">{sq.label || (['ক','খ','গ','ঘ'][idx] || `${idx+1}.`)}</div>
                            <div className="flex-1">
                              <div className="text-foreground leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.questionTextBn || sq.questionTextEn || sq.questionText || sq.questionBn) }} />
                              {sq.image && (
                                <div className="mt-2 mb-2 flex justify-center">
                                  <img src={sq.image} alt="Sub-question" className="max-w-full h-auto max-h-48 object-contain rounded" />
                                </div>
                              )}
                              {sq.type && <div className="text-xs text-muted-foreground mt-1">Type: {sq.type}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    q.options && (<div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">{q.options.map((opt:any,i:number)=>(<div key={i} className="px-3 py-2 rounded border border-border text-sm"><span className="font-medium">{String.fromCharCode(65+i)}.</span> <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(opt.text || opt) }} /></div>))}</div>)
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination small */}
          <div className="flex items-center gap-2">
            <Button onClick={() => setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage===1}>Prev</Button>
            <div className="text-sm">Page {currentPage} / {totalPages}</div>
            <Button onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages}>Next</Button>
          </div>
        </div>
      )}

      {/* Bottom bar - centered and responsive */}
      <div className="fixed left-0 right-0 bottom-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-card rounded-xl px-4 py-3 border border-border shadow-sm flex-1 flex justify-center">
            <div className="text-sm text-center">
              Selected: <strong>{selectedIds.length}</strong>
              <span className="mx-3 inline-block" />
              Total Marks: <strong>{totalMarks}</strong>
            </div>
          </div>
          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <Button onClick={handleCreateExam} disabled={selectedIds.length===0}>Create Exam</Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog: show selected questions before creating exam */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Preview Selected Questions ({selectedIds.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedQuestions.map((q:any, i:number) => {
              const id = q._id || q.id;
              // default marks: prefer explicit override, else question.marks or CQ default
              const defaultMarks = (() => {
                const dbQ = dbQuestions.find((x:any) => (x._id || x.id) === id);
                if (dbQ) return dbQ.marks ?? (dbQ.subQuestions && dbQ.subQuestions.length > 0 ? 10 : 1);
                // for grouped preview entries constructed earlier, assume CQ parent => 10
                return q.subQuestions && q.subQuestions.length > 0 ? 10 : 1;
              })();

              return (
              <div key={id} className="bg-muted/10 p-3 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Grouped CQ parent with subQuestions */}
                    {q.subQuestions && Array.isArray(q.subQuestions) ? (
                      <div className="space-y-4">
                        {q.image ? (
                          <div className="flex flex-col lg:flex-row gap-4 items-start">
                            <div className="w-full lg:w-40 pt-1 lg:flex-none">{renderQuestionHeader(i)}</div>
                            <div className="w-full lg:flex-1 bg-gray-50 border border-border rounded-lg p-3 flex justify-center max-w-4xl mx-auto">
                              <img src={q.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                            </div>
                            <div className="hidden lg:block lg:w-40 lg:flex-none" aria-hidden="true" />
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">{renderQuestionHeader(i)}<div className="flex-1 min-w-0" /></div>
                        )}
                        {renderStem(q)}
                        <div className="mt-2 space-y-2">
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
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {sq.options.map((opt:any, oi:number)=>(<div key={oi} className="px-3 py-2 rounded border border-border text-sm"><span className="font-medium">{String.fromCharCode(65+oi)}.</span> <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(opt.text || opt) }} /></div>))}
                                    </div>
                                  )}
                                  {sq.explanation && <div className="mt-2 text-sm text-muted-foreground">Explanation: <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.explanation) }} /></div>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {q.image ? (
                          <div className="flex flex-col lg:flex-row gap-4 items-start">
                            <div className="w-full lg:w-40 pt-1 lg:flex-none">{renderQuestionHeader(i)}</div>
                            <div className="w-full lg:flex-1 bg-gray-50 border border-border rounded-lg p-3 flex justify-center max-w-4xl mx-auto">
                              <img src={q.image} alt="Question" className="max-w-full h-auto max-h-60 object-contain rounded" />
                            </div>
                            <div className="hidden lg:block lg:w-40 lg:flex-none" aria-hidden="true" />
                          </div>
                        ) : (
                          <div className="flex items-start gap-2"><span className="text-xs font-bold text-muted-foreground whitespace-nowrap">প্রশ্ন {i + 1}</span><div className="flex-1 min-w-0" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.questionTextBn || q.questionTextEn || q.questionText || q.questionBn) }} /></div>
                        )}
                        {q.image && renderStem(q)}
                        {q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {q.options.map((opt:any, idx:number) => (
                              <div key={idx} className="px-3 py-2 rounded border border-border bg-card text-sm"><span className="font-medium">{String.fromCharCode(65+idx)}.</span> <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(opt.text || opt) }} /></div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-sm text-muted-foreground">Explanation: <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(q.explanation || "-") }} /></div>
                      </div>
                    )}
                  </div>

                  <div className="w-28 flex-none text-right">
                    <div className="text-sm text-muted-foreground mb-1">Marks</div>
                    <Input
                      type="number"
                      value={typeof questionMarksMap[id] !== 'undefined' ? questionMarksMap[id] : defaultMarks}
                      onChange={(e:any) => {
                        const val = Number(e.target.value || 0);
                        setQuestionMarksMap((prev) => ({ ...prev, [id]: val }));
                      }}
                      className="w-full"
                      min={0}
                    />
                  </div>
                </div>
              </div>
              )
            })}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button onClick={handleProceedToCreate}>Proceed to Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exam Creation Modal */}
      <ExamCreationModal
        open={examCreationOpen}
        onOpenChange={setExamCreationOpen}
        selectedQuestionIds={selectedIds}
          selectedSubjectId={selectedSubjectId}
          selectedChapterId={selectedChapterId}
        selectedQuestionMarks={selectedQuestionMarksArray}
        onSuccess={handleExamCreationSuccess}
      />
        </div>
      )}
    </div>
  );
};

export default AdminExamBuilder;
