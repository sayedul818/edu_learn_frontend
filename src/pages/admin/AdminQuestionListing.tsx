import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { classesAPI, groupsAPI, subjectsAPI, chaptersAPI, topicsAPI, questionsAPI, examTypesAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { Search, ArrowLeft, CheckCircle, Info, BarChart3, Flag, Bookmark, BookOpen, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseQuestionWithSubPoints } from "@/lib/utils";

const ITEMS_PER_PAGE = 5;

const AdminQuestionListing = () => {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Database data
  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(subjectId || "");
  const [selectedChapter, setSelectedChapter] = useState(chapterId || "");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedQuestionType, setSelectedQuestionType] = useState("");
  const [selectedSubQuestionType, setSelectedSubQuestionType] = useState("");
  const [search, setSearch] = useState("");
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load all data from database
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [classesRes, groupsRes, subjectsRes, chaptersRes, topicsRes, questionsRes, examTypesRes] = await Promise.all([
        classesAPI.getAll(),
        groupsAPI.getAll(),
        subjectsAPI.getAll(),
        chaptersAPI.getAll(),
        topicsAPI.getAll(),
        questionsAPI.getAll(),
        examTypesAPI.getAll()
      ]);

      console.log('📚 Classes loaded:', classesRes.data?.length);
      console.log('📁 Groups loaded:', groupsRes.data?.length);
      console.log('📖 Subjects loaded:', subjectsRes.data?.length);
      console.log('📝 Chapters loaded:', chaptersRes.data?.length);
      console.log('🏷️ Topics loaded:', topicsRes.data?.length);
      console.log('❓ Questions loaded:', questionsRes.data?.length);

      setClasses(classesRes.data || []);
      setGroups(groupsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setChapters(chaptersRes.data || []);
      setTopics(topicsRes.data || []);
      setExamTypes(examTypesRes.data || []);
      setDbQuestions(questionsRes.data || []);

      // Auto-select if coming from params
      if (subjectId) {
        setSelectedSubject(subjectId);
      }
      if (chapterId) {
        setSelectedChapter(chapterId);
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

  // Compute available filters based on database data
  const availableGroups = groups.filter(g => (g.classId?._id || g.classId) === selectedClass);
  const availableSubjects = subjects.filter(s => (s.groupId?._id || s.groupId) === selectedGroup);
  const availableChapters = chapters.filter(ch => (ch.subjectId?._id || ch.subjectId) === selectedSubject);
  const availableTopics = topics.filter(t => (t.chapterId?._id || t.chapterId) === selectedChapter);

  // Filter questions from database
  const allQuestions = dbQuestions.filter((q: any) => {
    // Filter by topic if selected
    if (selectedTopic) {
      const qTopicId = q.topicId?._id || q.topicId;
      if (qTopicId !== selectedTopic) return false;
    }

    // Filter by chapter if selected
    if (selectedChapter && !selectedTopic) {
      const qChapterId = q.chapterId?._id || q.chapterId;
      if (qChapterId !== selectedChapter) return false;
    }

    // Filter by subject if selected
    if (selectedSubject && !selectedChapter) {
      const qSubjectId = q.subjectId?._id || q.subjectId;
      if (qSubjectId !== selectedSubject) return false;
    }

    // Filter by questionType if selected (but not sub-question type)
    if (selectedQuestionType && !selectedSubQuestionType && q.questionType !== selectedQuestionType) return false;

    // If filtering by sub-question type, only show questions with sub-questions
    if (selectedSubQuestionType) {
      const hasMatchingSubQuestions = (q as any).subQuestions && Array.isArray((q as any).subQuestions) && 
        (q as any).subQuestions.some((sq: any) => sq.type === selectedSubQuestionType);
      if (!hasMatchingSubQuestions) return false;
    }

    // Search filter
    const textForSearch = (q.questionTextBn || q.questionTextEn || q.questionBn || q.questionText || "").toString().toLowerCase();
    if (search && !textForSearch.includes(search.toLowerCase())) return false;

    return true;
  });

  // If sub-question type is selected, flatten sub-questions into the display list
  const displayItems = selectedSubQuestionType
    ? allQuestions.flatMap((q: any) => {
        const matchingSubQuestions = (q.subQuestions || []).filter((sq: any) => sq.type === selectedSubQuestionType);
        return matchingSubQuestions.map((sq: any, idx: number) => ({
          _id: `${q._id}-${idx}`,
          parentId: q._id,
          isSubQuestion: true,
          subQuestion: sq,
          parentQuestion: q,
        }));
      })
    : allQuestions;

  // Debug logging for question type filtering
  useEffect(() => {
    if (selectedQuestionType || selectedSubQuestionType) {
      console.log(`🔍 Filtering by question type: "${selectedQuestionType || selectedSubQuestionType}"`);
      console.log(`📊 Total questions in DB:`, dbQuestions.length);
      console.log(`📊 Matching items:`, displayItems.length);
      console.log(`📋 Sample question types in DB:`, [...new Set(dbQuestions.map((q: any) => q.questionType))]);
    }
  }, [selectedQuestionType, selectedSubQuestionType, dbQuestions, displayItems.length]);

  const totalPages = Math.ceil(displayItems.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const visible = displayItems.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [selectedClass, selectedGroup, selectedSubject, selectedChapter, selectedTopic, selectedQuestionType, selectedSubQuestionType, search]);

  // Editor
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  const openEditor = (id: string) => {
    // Check if this is a sub-question item
    const displayItem = displayItems.find((x) => x._id === id);
    if (!displayItem) return toast({ title: "Question not found" });
    
    // If it's a sub-question being displayed independently, edit the parent question
    const q = displayItem.isSubQuestion ? displayItem.parentQuestion : displayItem;
    
    // Normalize related ids to plain strings so selects work correctly
    const normalized = JSON.parse(JSON.stringify(q));
    normalized.chapterId = (q.chapterId && (q.chapterId._id || q.chapterId)) || "";
    normalized.subjectId = (q.subjectId && (q.subjectId._id || q.subjectId)) || "";
    normalized.topicId = (q.topicId && (q.topicId._id || q.topicId)) || "";
    normalized.groupId = (q.groupId && (q.groupId._id || q.groupId)) || "";
    normalized.classId = (q.classId && (q.classId._id || q.classId)) || "";
    setForm(normalized);
    setEditingId(q._id);
  };

  const saveEdit = async () => {
    if (!editingId || !form) return;
    try {
      // normalize ids before sending
      const payload = {
        ...form,
        chapterId: form.chapterId && (form.chapterId._id || form.chapterId),
        subjectId: form.subjectId && (form.subjectId._id || form.subjectId),
        topicId: form.topicId && (form.topicId._id || form.topicId),
      };
      const response = await questionsAPI.update(editingId, payload);
      console.log('✅ Question updated:', response.data);
      setDbQuestions((prev) => prev.map((q) => (q._id === editingId ? response.data : q)));
      setEditingId(null);
      toast({ title: "Question saved successfully!" });
    } catch (err) {
      console.error('❌ Error saving question:', err);
      toast({ 
        title: "Failed to save question", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      // Check if this is a sub-question item
      const displayItem = displayItems.find((x) => x._id === id);
      const actualId = displayItem?.isSubQuestion ? displayItem.parentId : id;
      
      await questionsAPI.delete(actualId);
      console.log('✅ Question deleted:', actualId);
      setDbQuestions((prev) => prev.filter((q) => q._id !== actualId));
      toast({ title: "Question deleted successfully!" });
    } catch (err) {
      console.error('❌ Error deleting question:', err);
      toast({ 
        title: "Failed to delete question", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-5 font-bangla">
      {loading ? (
        <BeautifulLoader message="Loading data from database..." className="py-10" />
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <select
            value={selectedClass}
            onChange={(e) => { const val = e.target.value; setSelectedClass(val); setSelectedGroup(""); setSelectedSubject(""); setSelectedChapter(""); }}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40"
          >
            <option value="">Select Class</option>
            {classes.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
          </select>

          <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedSubject(""); setSelectedChapter(""); }} disabled={!selectedClass} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40 disabled:opacity-50">
            <option value="">Select Group</option>
            {availableGroups.map((g) => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>

          <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setSelectedChapter(""); }} disabled={!selectedGroup} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40 disabled:opacity-50">
            <option value="">Select Subject</option>
            {availableSubjects.map((s) => (<option key={s._id} value={s._id}>{s.name}</option>))}
          </select>

          <select value={selectedChapter} onChange={(e) => { setSelectedChapter(e.target.value); setSelectedTopic(""); }} disabled={!selectedSubject} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40 disabled:opacity-50">
            <option value="">Select Chapter</option>
            {availableChapters.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
          </select>

          <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} disabled={!selectedChapter} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40 disabled:opacity-50">
            <option value="">Select Topic</option>
            {availableTopics.map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
          </select>

          <div className="flex flex-wrap gap-2 lg:col-span-6">
            <button
              onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType(""); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${!selectedQuestionType && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              All
            </button>
            <button
              onClick={() => { setSelectedQuestionType("MCQ"); setSelectedSubQuestionType(""); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedQuestionType === "MCQ" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              MCQ
            </button>
            <button
              onClick={() => { setSelectedQuestionType("CQ"); setSelectedSubQuestionType(""); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedQuestionType === "CQ" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              CQ
            </button>
            <button
              onClick={() => { setSelectedQuestionType("গাণিতিক"); setSelectedSubQuestionType(""); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedQuestionType === "গাণিতিক" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              গাণিতিক
            </button>
            <button
              onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType("জ্ঞানমূলক"); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedSubQuestionType === "জ্ঞানমূলক" ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              জ্ঞানমূলক
            </button>
            <button
              onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType("অনুধাবনমূলক"); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedSubQuestionType === "অনুধাবনমূলক" ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              অনুধাবনমূলক
            </button>
            <button
              onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType("প্রয়োগমূলক"); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedSubQuestionType === "প্রয়োগমূলক" ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              প্রয়োগমূলক
            </button>
            <button
              onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType("উচ্চতর দক্ষতা"); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedSubQuestionType === "উচ্চতর দক্ষতা" ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              উচ্চতর দক্ষতা
            </button>
            <button
              onClick={() => { setSelectedQuestionType("ছোট লিখিত/সংক্ষিপ্ত প্রশ্ন"); setSelectedSubQuestionType(""); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedQuestionType === "ছোট লিখিত/সংক্ষিপ্ত প্রশ্ন" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              ছোট লিখিত...
            </button>
            <button
              onClick={() => { setSelectedQuestionType("বড় লিখিত/রচনামূলক প্রশ্ন"); setSelectedSubQuestionType(""); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedQuestionType === "বড় লিখিত/রচনামূলক প্রশ্ন" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"}`}
            >
              বড় লিখিত...
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
            <input type="text" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40" />
          </div>
        </div>

      {allQuestions.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No questions found. Create questions or select a chapter to see results.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">{displayItems.length}</span> items (Page {currentPage} of {totalPages || 1})</p>

          <div className="space-y-4">
        {visible.map((item, idx) => {
          const q = item.isSubQuestion ? item.parentQuestion : item;
          const isSubQuestionDisplay = item.isSubQuestion;

          return (
          <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="bg-muted/30 rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isSubQuestionDisplay ? (
                    <span className="text-xs font-bold text-muted-foreground">Sub-Question {startIdx + idx + 1}</span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">প্রশ্ন {startIdx + idx + 1}</span>
                  )}
                </div>
                {(() => {
                  // If showing a sub-question from filter, display it differently
                  if (isSubQuestionDisplay) {
                    const sq = item.subQuestion;
                    return (
                      <div className="text-foreground leading-relaxed text-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="font-semibold">{sq.label || 'ক'}</div>
                          <div>{sq.questionTextBn || sq.questionTextEn}</div>
                          {sq.type && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                              {sq.type}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Check if question has subQuestions array
                  const hasSubQuestions = (q as any).subQuestions && Array.isArray((q as any).subQuestions) && (q as any).subQuestions.length > 0;

                  // For questions with subQuestions (CQ, জ্ঞানমূলক, etc.)
                  if (hasSubQuestions) {
                    const passage = (q as any).questionTextBn || (q as any).questionTextEn || '';
                    return (
                      <div>
                        {passage ? (
                          <div className="mb-4 rounded-lg bg-card border border-border text-foreground p-4 leading-relaxed text-sm">
                            <p className="whitespace-pre-line">{passage}</p>
                          </div>
                        ) : null}

                        <div className="space-y-3">
                          {(q as any).subQuestions.map((sq: any, i: number) => (
                            <div key={i} className="border-l-2 border-success/30 pl-3">
                              <div className="flex items-start gap-2">
                                <div className="w-6 flex-none font-semibold text-foreground text-base leading-tight">{sq.label || (['ক','খ','গ','ঘ','ঙ'][i] || `${i+1}.`)}</div>
                                <div className="flex-1 flex flex-wrap items-center gap-2">
                                  <div className="text-foreground leading-relaxed text-sm">{sq.questionTextBn || sq.questionTextEn}</div>
                                  {sq.type && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                                      {sq.type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // For regular questions without subQuestions
                  const questionText = (q as any).questionTextBn || (q as any).questionTextEn;
                  const parsed = parseQuestionWithSubPoints(questionText);

                  if (parsed.hasSubPoints) {
                    return (
                      <div className="text-foreground font-medium leading-relaxed">
                        {parsed.mainQuestion && <p className="mb-2">{parsed.mainQuestion}</p>}
                        <div className="ml-4 space-y-1">
                          {parsed.subPoints.map((point, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-semibold min-w-[2rem]">{['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.'][i]}</span>
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return <p className="text-foreground font-medium leading-relaxed">{questionText}</p>;
                })()}
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => openEditor(item._id)} className="bg-success hover:bg-success/90 text-white rounded-lg text-xs">Edit</Button>
              </div>
            </div>

            {/* Question Metadata Badges */}
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
              {/* Exam Type Badge (if exists) */}
              {(q as any).examTypeId && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  {typeof (q as any).examTypeId === "object" 
                    ? `${(q as any).examTypeId.examName}-${(q as any).examTypeId.year}`
                    : "Exam Type"
                  }
                </span>
              )}
                {/* Topic Badge (optional) */}
                {(() => {
                  const topicIdVal = (q as any).topicId?._id || (q as any).topicId;
                  const topicObj = topics.find((t) => (t._id === topicIdVal));
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${topicObj ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-100 text-gray-700"}`}>
                      <BookOpen className="w-3 h-3" />
                      {topicObj ? topicObj.name : "No topic"}
                    </span>
                  );
                })()}
            </div>

            {/* Options */}
            {(q as any).options && !isSubQuestionDisplay && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(q as any).options.map((opt: any, i: number) => (
                  <div key={i} className={`px-4 py-2.5 rounded-lg border text-sm transition-all ${opt.isCorrect ? "border-success/50 bg-success/5" : "border-border bg-card hover:border-success/50 hover:bg-success/5"}`}>
                    <span className="font-bold text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt.text}
                    {opt.isCorrect && <span className="ml-2 text-success font-bold">✓</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <Button size="sm" onClick={() => setExpandedAnswer(expandedAnswer === item._id ? null : item._id)} className="bg-success hover:bg-success/90 text-white rounded-lg text-xs">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                {expandedAnswer === item._id ? "Hide Answer" : "Show Answer & Solution"}
              </Button>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Info className="h-4 w-4" /></button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><BarChart3 className="h-4 w-4" /></button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Flag className="h-4 w-4" /></button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Bookmark className="h-4 w-4" /></button>
                <button onClick={() => deleteQuestion(item._id)} className="p-2 rounded-lg hover:bg-red-100 transition-colors text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            <AnimatePresence>
              {expandedAnswer === item._id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="mt-3 p-4 bg-success/5 border border-success/20 rounded-xl">
                    {!isSubQuestionDisplay && (q as any).options && (
                      <>
                        <p className="text-sm font-bold text-success mb-2">
                          Correct Answer: {(q as any).options.find((o: any) => o.isCorrect)?.text || "N/A"}
                        </p>
                      </>
                    )}

                    {isSubQuestionDisplay ? (
                      <div>
                        <p className="text-sm font-bold text-success mb-2">Answer:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.subQuestion.answerBn || item.subQuestion.answer || 'N/A'}</p>
                      </div>
                    ) : (
                      <>
                        {/* CQ answers */}
                        {(q as any).subQuestions && Array.isArray((q as any).subQuestions) && (q as any).subQuestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-bold text-success mb-2">Sub-questions & Answers:</p>
                            <div className="space-y-2">
                              {(q as any).subQuestions.map((sq: any, i: number) => (
                                <div key={i} className="text-sm">
                                  <div className="flex items-start gap-2">
                                    <span className="inline-block w-6 font-semibold text-foreground leading-tight">{sq.label || (i + 1) + '.'}</span>
                                    <div className="flex-1 flex flex-wrap items-center gap-2">
                                      {sq.type && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                                          {sq.type}
                                        </span>
                                      )}
                                      <span className="text-muted-foreground">{sq.answer || sq.answerBn || sq.answerEn || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">{(q as any).explanation || "No explanation provided"}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          );
        })}

        {visible.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{displayItems.length === 0 ? "কোনো প্রশ্ন পাওয়া যায়নি" : "এই পৃষ্ঠায় কোনো প্রশ্ন নেই"}</p>
            <p className="text-sm mt-1">অনুগ্রহ করে ফিল্টার পরিবর্তন করুন</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {displayItems.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
          {(() => {
            const MAX_VISIBLE = 5;
            let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE / 2));
            let endPage = Math.min(totalPages, startPage + MAX_VISIBLE - 1);
            if (endPage - startPage < MAX_VISIBLE - 1) startPage = Math.max(1, endPage - MAX_VISIBLE + 1);
            const pages = [];
            if (startPage > 1) { pages.push(<button key="page-1" onClick={() => setCurrentPage(1)} className="h-9 w-9 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-all">1</button>); if (startPage > 2) pages.push(<span key="ellipsis-start" className="text-muted-foreground">...</span>); }
            for (let p = startPage; p <= endPage; p++) pages.push(<button key={`page-${p}`} onClick={() => setCurrentPage(p)} className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${currentPage === p ? "bg-success text-white shadow-sm" : "border border-border hover:bg-muted"}`}>{p}</button>);
            if (endPage < totalPages) { if (endPage < totalPages - 1) pages.push(<span key="ellipsis-end" className="text-muted-foreground">...</span>); pages.push(<button key={`page-${totalPages}`} onClick={() => setCurrentPage(totalPages)} className="h-9 w-9 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-all">{totalPages}</button>); }
            return pages;
          })()}
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div>
                <Label>Question (Bengali)</Label>
                <Input value={form.questionTextBn ?? ""} onChange={(e) => setForm({ ...form, questionTextBn: e.target.value })} />
              </div>
              <div>
                <Label>Question (English)</Label>
                <Input value={form.questionTextEn ?? ""} onChange={(e) => setForm({ ...form, questionTextEn: e.target.value })} />
              </div>
              <div>
                <Label>Options (comma separated)</Label>
                <Input 
                  value={(form.options || []).map((opt: any) => opt.text || opt).join(", ")} 
                  onChange={(e) => setForm({ 
                    ...form, 
                    options: e.target.value.split(",").map((text: string) => ({
                      text: text.trim(),
                      isCorrect: false
                    }))
                  })} 
                />
              </div>
              <div>
                <Label>Mark Correct Answer</Label>
                <select 
                  value={form.options?.findIndex((opt: any) => opt.isCorrect) ?? -1}
                  onChange={(e) => setForm({
                    ...form,
                    options: form.options?.map((opt: any, idx: number) => ({
                      ...opt,
                      isCorrect: idx === parseInt(e.target.value)
                    }))
                  })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={-1}>Select correct answer</option>
                  {form.options?.map((opt: any, idx: number) => (
                    <option key={idx} value={idx}>{String.fromCharCode(65 + idx)}. {opt.text || opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Explanation</Label>
                <Input value={form.explanation || ""} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
              </div>
              <div>
                <Label>Sub-questions (for CQ)</Label>
                <div className="space-y-3">
                  {(form.subQuestions || []).map((sq: any, i: number) => (
                    <div key={i} className="border border-border rounded-lg p-3 bg-muted/20">
                      <div className="grid grid-cols-12 gap-2 items-start mb-2">
                        <Input
                          className="col-span-2"
                          placeholder="লেবেল"
                          value={sq.label || ''}
                          onChange={(e) => {
                            const copy = JSON.parse(JSON.stringify(form));
                            copy.subQuestions = copy.subQuestions || [];
                            copy.subQuestions[i] = { ...copy.subQuestions[i], label: e.target.value };
                            setForm(copy);
                          }}
                        />
                        <select
                          className="col-span-3 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          value={sq.type || ''}
                          onChange={(e) => {
                            const copy = JSON.parse(JSON.stringify(form));
                            copy.subQuestions = copy.subQuestions || [];
                            copy.subQuestions[i] = { ...copy.subQuestions[i], type: e.target.value };
                            setForm(copy);
                          }}
                        >
                          <option value="">-- Type --</option>
                          <option value="জ্ঞানমূলক">জ্ঞানমূলক</option>
                          <option value="অনুধাবনমূলক">অনুধাবনমূলক</option>
                          <option value="প্রয়োগমূলক">প্রয়োগমূলক</option>
                          <option value="উচ্চতর দক্ষতা">উচ্চতর দক্ষতা</option>
                        </select>
                        <Input
                          className="col-span-6"
                          placeholder="Sub-question (Bengali)"
                          value={sq.questionTextBn || ''}
                          onChange={(e) => {
                            const copy = JSON.parse(JSON.stringify(form));
                            copy.subQuestions = copy.subQuestions || [];
                            copy.subQuestions[i] = { ...copy.subQuestions[i], questionTextBn: e.target.value };
                            setForm(copy);
                          }}
                        />
                        <button
                          onClick={() => {
                            const copy = JSON.parse(JSON.stringify(form));
                            copy.subQuestions = copy.subQuestions || [];
                            copy.subQuestions.splice(i, 1);
                            setForm(copy);
                          }}
                          className="col-span-1 px-2 py-1 rounded-lg text-sm text-red-600 hover:bg-red-50"
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                      <Input
                        className="w-full"
                        placeholder="Answer (Bengali)"
                        value={sq.answerBn || sq.answer || ''}
                        onChange={(e) => {
                          const copy = JSON.parse(JSON.stringify(form));
                          copy.subQuestions = copy.subQuestions || [];
                          copy.subQuestions[i] = { ...copy.subQuestions[i], answerBn: e.target.value };
                          setForm(copy);
                        }}
                      />
                    </div>
                  ))}

                  <div>
                    <Button size="sm" onClick={() => {
                      const copy = JSON.parse(JSON.stringify(form));
                      copy.subQuestions = copy.subQuestions || [];
                      copy.subQuestions.push({ label: '', type: '', questionTextBn: '', questionTextEn: '', answerBn: '', answerEn: '', explanationBn: '' });
                      setForm(copy);
                    }}>+ Add Sub-question</Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Question Type</Label>
                  <select 
                    value={form.questionType || "MCQ"}
                    onChange={(e) => setForm({ ...form, questionType: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="CQ">CQ</option>
                    <option value="গাণিতিক">গাণিতিক (Mathematical)</option>
                    <option value="জ্ঞানমূলক">জ্ঞানমূলক (Knowledge-based)</option>
                    <option value="অনুধাবনমূলক">অনুধাবনমূলক (Comprehension)</option>
                    <option value="ছোট লিখিত/সংক্ষিপ্ত প্রশ্ন">ছোট লিখিত (Short written)</option>
                    <option value="বড় লিখিত/রচনামূলক প্রশ্ন">বড় লিখিত (Long written)</option>
                  </select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <select 
                    value={form.difficulty || "medium"}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Topic (optional)</Label>
                <select
                  value={form.topicId || ""}
                  onChange={(e) => setForm({ ...form, topicId: e.target.value })}
                  disabled={!form.chapterId}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- No topic --</option>
                  {topics.filter((t) => (t.chapterId?._id || t.chapterId) === (form.chapterId || selectedChapter)).map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Exam Type (Optional)</Label>
                <select 
                  value={form.examTypeId || ""}
                  onChange={(e) => setForm({ ...form, examTypeId: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- No Exam Type --</option>
                  {examTypes.map((et) => <option key={et._id} value={et._id}>{et.examCategory} - {et.examName} - {et.year}</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setEditingId(null)} variant="ghost">Cancel</Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
};

export default AdminQuestionListing;
