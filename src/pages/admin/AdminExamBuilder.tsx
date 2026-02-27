import { useEffect, useMemo, useState } from "react";
import { classesAPI, groupsAPI, subjectsAPI, chaptersAPI, questionsAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, ChevronRight, ChevronDown } from "lucide-react";
import ExamCreationModal from "@/components/admin/ExamCreationModal";

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
        const text = ((q.questionTextBn || q.questionTextEn) || "").toLowerCase();
        if (!text.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [dbQuestions, selectedSubjectId, selectedChapterId, selectedQuestionType, search]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE));
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const visible = filteredQuestions.slice(start, start + ITEMS_PER_PAGE);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
    return selectedIds.map((id) => dbQuestions.find((q:any) => q._id === id)).filter(Boolean);
  }, [selectedIds, dbQuestions]);

  return (
    <div className="space-y-6 font-bangla pb-24">
      <div>
        <h1 className="text-2xl font-display font-bold">Create Exam</h1>
        <p className="text-muted-foreground mt-1">Select questions and create an exam</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading data from database...</p>
      ) : (
        <>
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
            {visible.map((q:any) => (
              <div key={q._id} className="bg-muted/20 p-4 rounded-lg flex items-start gap-3">
                <div className="pt-1"><Checkbox checked={selectedIds.includes(q._id)} onCheckedChange={() => toggleSelect(q._id)} /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between"><div className="font-medium">{q.questionTextBn || q.questionTextEn}</div></div>
                  {q.options && (<div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">{q.options.map((opt:any,i:number)=>(<div key={i} className="px-3 py-2 rounded border border-border text-sm"><span className="font-medium">{String.fromCharCode(65+i)}.</span> {opt.text}</div>))}</div>)}
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
              Total Marks: <strong>{selectedIds.length}</strong>
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
            {selectedQuestions.map((q:any, i:number) => (
              <div key={q._id} className="bg-muted/10 p-3 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium mb-1">{i+1}. {q.questionTextBn || q.questionTextEn}</div>
                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt:any, idx:number) => (
                          <div key={idx} className="px-3 py-2 rounded border border-border bg-card text-sm"><span className="font-medium">{String.fromCharCode(65+idx)}.</span> {opt.text}</div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-sm text-muted-foreground">Explanation: {q.explanation || "-"}</div>
                  </div>
                </div>
              </div>
            ))}
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
        onSuccess={handleExamCreationSuccess}
      />
        </>
      )}
    </div>
  );
};

export default AdminExamBuilder;
