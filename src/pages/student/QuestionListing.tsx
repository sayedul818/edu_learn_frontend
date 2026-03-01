import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {classesAPI, groupsAPI, subjectsAPI, chaptersAPI, topicsAPI, questionsAPI } from "@/services/api";
import {
  ArrowLeft, Search, ChevronLeft, ChevronRight,
  Info, BarChart3, Flag, Bookmark, CheckCircle, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 5;

const QuestionListing = () => {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Database data
  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState(subjectId || "");
  const [selectedChapter, setSelectedChapter] = useState(chapterId || "");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedQuestionType, setSelectedQuestionType] = useState("");
  const [selectedSubQuestionType, setSelectedSubQuestionType] = useState("");
  const [loading, setLoading] = useState(true);

  // Load all data from database
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [classesRes, groupsRes, subjectsRes, chaptersRes, topicsRes, questionsRes] = await Promise.all([
        classesAPI.getAll(),
        groupsAPI.getAll(),
        subjectsAPI.getAll(),
        chaptersAPI.getAll(),
        topicsAPI.getAll(),
        questionsAPI.getAll()
      ]);

      setClasses(classesRes.data || []);
      setGroups(groupsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setChapters(chaptersRes.data || []);
      setTopics(topicsRes.data || []);
      setDbQuestions(questionsRes.data || []);

      // Auto-populate if coming from QuestionBank
      if (subjectId) {
        setSelectedSubject(subjectId);
        const subj = (subjectsRes.data || []).find(s => s._id === subjectId);
        if (subj) {
          // Subject only has groupId, so get classId from the group
          const group = (groupsRes.data || []).find(g => g._id === (subj.groupId?._id || subj.groupId));
          if (group) {
            setSelectedClass(group.classId?._id || group.classId);
            setSelectedGroup(subj.groupId?._id || subj.groupId);
          }
        }
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

  // Compute available filters
  const availableGroups = groups.filter(g => (g.classId?._id || g.classId) === selectedClass);
  const availableSubjects = subjects.filter(s => {
    if (selectedGroup && (s.groupId?._id || s.groupId) !== selectedGroup) return false;
    return true;
  });
  const availableChapters = chapters.filter(c => (c.subjectId?._id || c.subjectId) === selectedSubject);
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

    // If filtering by sub-question type, only keep questions with matching sub-questions
    if (selectedSubQuestionType) {
      const hasMatchingSubQuestions = (q as any).subQuestions && Array.isArray((q as any).subQuestions) &&
        (q as any).subQuestions.some((sq: any) => sq.type === selectedSubQuestionType);
      if (!hasMatchingSubQuestions) return false;
    }

    // Search filter
    const textForSearch = (q.questionTextBn || q.questionText || q.questionTextEn || "").toString().toLowerCase();
    if (search && !textForSearch.includes(search.toLowerCase())) return false;

    return true;
  });

  // If sub-question type is selected, flatten sub-questions into display list
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

  // Pagination logic
  const totalPages = Math.ceil(displayItems.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const questions = displayItems.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedGroup, selectedSubject, selectedChapter, selectedTopic, selectedQuestionType, selectedSubQuestionType, search]);

  return (
    <div className="space-y-5 font-bangla">
      {/* Top Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Class */}
          <select
            value={selectedClass}
            onChange={(e) => {
              const newClass = e.target.value;
              setSelectedClass(newClass);
              setSelectedGroup("");
              setSelectedSubject("");
              setSelectedChapter("");
              setSelectedTopic("");
            }}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40"
          >
            <option value="">ক্লাস নির্বাচন করুন</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* Group */}
          <select
            value={selectedGroup}
            onChange={(e) => { 
              setSelectedGroup(e.target.value); 
              setSelectedSubject(""); 
              setSelectedChapter(""); 
              setSelectedTopic(""); 
            }}
            disabled={!selectedClass}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40 disabled:opacity-50"
          >
            <option value="">গ্রুপ নির্বাচন করুন</option>
            {availableGroups.map((g) => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>

          {/* Subject */}
          <select
            value={selectedSubject}
            onChange={(e) => { 
              setSelectedSubject(e.target.value); 
              setSelectedChapter(""); 
              setSelectedTopic(""); 
            }}
            disabled={!selectedGroup}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40 disabled:opacity-50"
          >
            <option value="">বিষয় নির্বাচন করুন</option>
            {availableSubjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          {/* Chapter */}
          <select
            value={selectedChapter}
            onChange={(e) => { 
              setSelectedChapter(e.target.value); 
              setSelectedTopic(""); 
            }}
            disabled={!selectedSubject}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40 disabled:opacity-50"
          >
            <option value="">অধ্যায় নির্বাচন করুন</option>
            {availableChapters.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* Topic */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            disabled={!selectedChapter}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40 disabled:opacity-50"
          >
            <option value="">টপিক নির্বাচন করুন</option>
            {availableTopics.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
            <input
              type="text"
              placeholder="প্রশ্ন খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40"
            />
          </div>
        </div>
      </div>

      {/* Question Type Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-success text-success text-sm font-medium hover:bg-success/5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          পিছনে
        </button>
        <button
          onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType(""); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            !selectedQuestionType && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          সব ধরনের প্রশ্ন
        </button>
        <button
          onClick={() => { setSelectedQuestionType("MCQ"); setSelectedSubQuestionType(""); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedQuestionType === "MCQ" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          MCQ
        </button>
        <button
          onClick={() => { setSelectedQuestionType("CQ"); setSelectedSubQuestionType(""); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedQuestionType === "CQ" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          CQ
        </button>
        <button
          onClick={() => { setSelectedQuestionType("গাণিতিক"); setSelectedSubQuestionType(""); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedQuestionType === "গাণিতিক" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          গাণিতিক
        </button>
        <button
          onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType("জ্ঞানমূলক"); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedSubQuestionType === "জ্ঞানমূলক" ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          জ্ঞানমূলক
        </button>
        <button
          onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType("অনুধাবনমূলক"); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedSubQuestionType === "অনুধাবনমূলক" ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          অনুধাবনমূলক
        </button>
        <button
          onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType("প্রয়োগমূলক"); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedSubQuestionType === "প্রয়োগমূলক" ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          প্রয়োগমূলক
        </button>
        <button
          onClick={() => { setSelectedQuestionType(""); setSelectedSubQuestionType("উচ্চতর দক্ষতা"); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedSubQuestionType === "উচ্চতর দক্ষতা" ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          উচ্চতর দক্ষতা
        </button>
        <button
          onClick={() => { setSelectedQuestionType("ছোট লিখিত/সংক্ষিপ্ত প্রশ্ন"); setSelectedSubQuestionType(""); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedQuestionType === "ছোট লিখিত/সংক্ষিপ্ত প্রশ্ন" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          ছোট লিখিত
        </button>
        <button
          onClick={() => { setSelectedQuestionType("বড় লিখিত/রচনামূলক প্রশ্ন"); setSelectedSubQuestionType(""); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedQuestionType === "বড় লিখিত/রচনামূলক প্রশ্ন" && !selectedSubQuestionType ? "bg-success text-white" : "bg-card border border-border hover:border-success"
          }`}
        >
          বড় লিখিত
        </button>
      </div>

      {/* Question Count */}
      <p className="text-sm text-muted-foreground">
        মোট <span className="font-bold text-foreground">{displayItems.length}</span> টি আইটেম (পৃষ্ঠা {currentPage} of {totalPages || 1})
      </p>

      {/* Warning Note */}
      <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
        <p className="text-xs text-destructive">
          প্রশ্নে কোনো ভুল পেলে রিপোর্ট বাটনে ক্লিক করে জানান। আমরা যত দ্রুত সম্ভব সংশোধন করবো।
        </p>
      </div>

      {/* Questions */}
      {loading ? (
        <BeautifulLoader message="ডাটা লোড করছি..." className="py-10" />
      ) : displayItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>কোনো প্রশ্ন খুঁজে পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((item, idx) => {
            const q: any = item.isSubQuestion ? item.parentQuestion : item;
            const isSubQuestionDisplay = !!item.isSubQuestion;

            return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-muted/30 rounded-xl border border-border p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {isSubQuestionDisplay ? `Sub-Question ${startIdx + idx + 1}` : `প্রশ্ন ${startIdx + idx + 1}`}
                    </span>
                    {q.examTypeId && (
                      <span className="px-2 py-0.5 bg-purple/10 text-purple text-[10px] font-bold rounded-full">
                        {typeof q.examTypeId === 'object' 
                          ? `${q.examTypeId.examName}${q.examTypeId.year ? ` - ${q.examTypeId.year}` : ''}`
                          : 'Exam'}
                      </span>
                    )}
                  </div>
                  {(() => {
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

                    const hasSubQuestions = q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0;
                    if (hasSubQuestions) {
                      const passage = q.questionTextBn || q.questionTextEn || q.questionText || '';
                      return (
                        <div>
                          {passage ? (
                            <div className="mb-4 rounded-lg bg-card border border-border text-foreground p-4 leading-relaxed text-sm">
                              <p className="whitespace-pre-line">{passage}</p>
                            </div>
                          ) : null}

                          <div className="space-y-3">
                            {q.subQuestions.map((sq: any, i: number) => (
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

                    return (
                      <p className="text-foreground font-medium leading-relaxed">
                        {q.questionTextBn || q.questionTextEn || q.questionText}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Options */}
              {q.options && Array.isArray(q.options) && !isSubQuestionDisplay && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm hover:border-success/50 hover:bg-success/5 transition-all cursor-pointer"
                    >
                      <span className="font-bold text-muted-foreground mr-2">
                        {String.fromCharCode(2453 + i)}.
                      </span>
                      {typeof opt === 'string' ? opt : opt.text || opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <Button
                  size="sm"
                  onClick={() => setExpandedAnswer(expandedAnswer === item._id ? null : item._id)}
                  className="bg-success hover:bg-success/90 text-white rounded-lg text-xs"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  {expandedAnswer === item._id ? "উত্তর লুকান" : "উত্তর ও সমাধান দেখুন"}
                </Button>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                    <Info className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                    <Flag className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Answer Expand */}
              <AnimatePresence>
                {expandedAnswer === item._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    <div className="space-y-3">
                      {!isSubQuestionDisplay && q.options && (
                        <div>
                          <p className="text-xs font-bold text-success mb-1">✓ সঠিক উত্তর</p>
                          <p className="text-sm text-foreground">
                            {q.options?.find((opt: any) => opt.isCorrect)?.text || "N/A"}
                          </p>
                        </div>
                      )}

                      {isSubQuestionDisplay ? (
                        <div>
                          <p className="text-xs font-bold text-success mb-1">✓ উত্তর</p>
                          <p className="text-sm text-foreground">{item.subQuestion.answerBn || item.subQuestion.answer || "N/A"}</p>
                        </div>
                      ) : (
                        <>
                          {q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-success mb-1">Sub-questions & Answers</p>
                              <div className="space-y-2">
                                {q.subQuestions.map((sq: any, i: number) => (
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

                      {q.explanation && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground mb-1">📝 ব্যাখ্যা</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {(() => {
            const maxVisible = 5;
            const startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            const endPage = Math.min(totalPages, startPage + maxVisible - 1);
            const pages = [];

            if (startPage > 1) {
              pages.push(
                <button
                  key="page-1"
                  onClick={() => setCurrentPage(1)}
                  className="h-9 w-9 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-all"
                >
                  1
                </button>
              );
              if (startPage > 2) {
                pages.push(
                  <span key="ellipsis-start" className="text-muted-foreground">...</span>
                );
              }
            }

            for (let p = startPage; p <= endPage; p++) {
              pages.push(
                <button
                  key={`page-${p}`}
                  onClick={() => setCurrentPage(p)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
                    currentPage === p
                      ? "bg-success text-white shadow-sm"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              );
            }

            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pages.push(
                  <span key="ellipsis-end" className="text-muted-foreground">...</span>
                );
              }
              pages.push(
                <button
                  key={`page-${totalPages}`}
                  onClick={() => setCurrentPage(totalPages)}
                  className="h-9 w-9 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-all"
                >
                  {totalPages}
                </button>
              );
            }

            return pages;
          })()}

          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionListing;
