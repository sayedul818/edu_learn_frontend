import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { classesAPI, groupsAPI, subjectsAPI, chaptersAPI, questionsAPI } from "@/services/api";
import { ChevronDown, Minus, Plus, BookOpen, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SelfTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Database data
  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data from database
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
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
      setAllQuestions(questionsRes.data || []);
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

  // Config state - reset to first available class/group
  const [config, setConfig] = useState({
    classType: "",
    group: "",
    examStandard: "board",
    questionType: "mcq",
    questionCount: 25,
    examTime: 50,
    negativeMark: 0,
    markPerQuestion: 1,
  });

  // Subject/chapter selection
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({});
  const [selectedChapters, setSelectedChapters] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Auto-set first class/group when data loads
  useEffect(() => {
    if (classes.length > 0 && !config.classType) {
      setConfig(prev => ({ ...prev, classType: classes[0]._id }));
    }
  }, [classes]);

  // available groups depend on selected class (memoized to avoid unstable deps)
  const availableGroups = useMemo(
    () => groups.filter((g) => (g.classId?._id || g.classId) === config.classType),
    [groups, config.classType]
  );

  // Auto-set first group when class changes
  useEffect(() => {
    if (config.classType && availableGroups.length > 0 && config.group !== availableGroups[0]._id) {
      setConfig((prev) => ({ ...prev, group: availableGroups[0]._id }));
    }
  }, [config.classType, availableGroups]);

  // Confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);

  const updateConfig = (key: string, value: string | number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const stepper = (key: string, val: number, min = 0, max = 200) => {
    updateConfig(key, Math.max(min, Math.min(max, val)));
  };

  const toggleSubject = (subjectId: string) => {
    const newVal = !selectedSubjects[subjectId];
    setSelectedSubjects((prev) => ({ ...prev, [subjectId]: newVal }));
    const subject = subjects.find((s) => s._id === subjectId);
    if (subject) {
      const chapterUpdates: Record<string, boolean> = {};
      const subjectChapters = chapters.filter(c => (c.subjectId?._id || c.subjectId) === subject._id);
      subjectChapters.forEach((ch) => { chapterUpdates[ch._id] = newVal; });
      setSelectedChapters((prev) => ({ ...prev, ...chapterUpdates }));
    }
  };

  const toggleChapter = (subjectId: string, chapterId: string) => {
    const newVal = !selectedChapters[chapterId];
    setSelectedChapters((prev) => ({ ...prev, [chapterId]: newVal }));

    // Update parent subject state
    const subject = subjects.find((s) => s._id === subjectId);
    if (subject) {
      const updatedChapters = { ...selectedChapters, [chapterId]: newVal };
      const subjectChapters = chapters.filter(c => (c.subjectId?._id || c.subjectId) === subject._id);
      const allSelected = subjectChapters.every((ch) => updatedChapters[ch._id]);
      const someSelected = subjectChapters.some((ch) => updatedChapters[ch._id]);
      setSelectedSubjects((prev) => ({ ...prev, [subjectId]: allSelected || someSelected }));
    }
  };

  const isSubjectIndeterminate = (subjectId: string) => {
    const subject = subjects.find((s) => s._id === subjectId);
    if (!subject) return false;
    const subjectChapters = chapters.filter(c => (c.subjectId?._id || c.subjectId) === subject._id);
    const selectedCount = subjectChapters.filter((ch) => selectedChapters[ch._id]).length;
    return selectedCount > 0 && selectedCount < subjectChapters.length;
  };

  const totalMarks = config.questionCount * config.markPerQuestion;

  const selectedChapterCount = Object.values(selectedChapters).filter(Boolean).length;
  const canStart = config.questionCount > 0 && selectedChapterCount > 0;

  const selectedSubjectNames = useMemo(() => {
    const selectedChapterIds = Object.keys(selectedChapters).filter((id) => selectedChapters[id]);
    const relatedSubjects = new Set<string>();
    selectedChapterIds.forEach(chId => {
      const ch = chapters.find(c => c._id === chId);
      if (ch) {
        const subj = subjects.find(s => s._id === (ch.subjectId?._id || ch.subjectId));
        if (subj) relatedSubjects.add(subj.name);
      }
    });
    return Array.from(relatedSubjects);
  }, [selectedChapters, chapters, subjects]);

  const handleStart = () => {
    if (canStart) setShowConfirm(true);
  };

  const confirmStart = () => {
    setShowConfirm(false);
    // Build self-test exam from selected chapters + config
    const selectedChapterIds = Object.keys(selectedChapters).filter((id) => selectedChapters[id]);
    // gather candidate questions
    let candidates = allQuestions.filter((q) => selectedChapterIds.includes(q.chapterId?._id || q.chapterId));
    // filter by exam standard if not 'practice' (practice keeps all types)
    if (config.examStandard && config.examStandard !== "practice") {
      // Note: Filter by exam type if needed based on your schema
    }

    // shuffle candidates
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, config.questionCount);

    const examId = `self-${Date.now()}`;
    const exam = {
      id: examId,
      title: `Self Test - ${selectedSubjectNames.join(", ") || "Custom"}`,
      duration: config.examTime,
      totalMarks: config.questionCount * config.markPerQuestion,
      negativeMarking: !!config.negativeMark,
      negativeMarkValue: config.negativeMark,
      questionIds: picked.map((q) => q._id),
      createdBy: "self",
      status: "published",
      createdAt: new Date().toISOString(),
    };

    // transform picked questions to format expected by TakeExam
    const questionsForExam = picked.map((q) => ({
      id: q._id,
      questionText: q.questionTextBn || q.questionTextEn || q.questionText,
      options: q.options,
      correctAnswer: q.options?.find((opt: any) => opt.isCorrect)?.text || "",
      explanation: q.explanation || "",
      marks: config.markPerQuestion,
    }));

    // store in sessionStorage so TakeExam can load
    sessionStorage.setItem(`selfExam_${examId}`, JSON.stringify({ exam, questions: questionsForExam }));
    navigate(`/exam/${examId}`);
  };

  return (
    <div className="space-y-6 font-bangla max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">🎯 সেলফ টেস্ট</h1>
        <p className="text-sm text-muted-foreground mt-1">
          নিজের মতো করে পরীক্ষা তৈরি করো এবং অনুশীলন করো
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-muted/40 rounded-2xl p-5 border border-border">
        <h2 className="font-bold text-foreground mb-4">পরীক্ষার সেটিংস</h2>
        {loading ? (
          <div className="text-center text-muted-foreground py-8">ডাটা লোড করছি...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Class */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ক্লাস</label>
              <select
                value={config.classType}
                onChange={(e) => {
                  const newClass = e.target.value;
                  updateConfig("classType", newClass);
                  const newGroups = groups.filter(g => (g.classId?._id || g.classId) === newClass);
                  updateConfig("group", newGroups[0]?._id ?? "");
                  setSelectedSubjects({});
                  setSelectedChapters({});
                  setExpandedSubjects({});
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40"
              >
                <option value="">ক্লাস নির্বাচন করুন</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Group */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">গ্রুপ</label>
              <select
                value={config.group}
                onChange={(e) => updateConfig("group", e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40"
              >
                <option value="">গ্রুপ নির্বাচন করুন</option>
                {availableGroups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

          {/* Exam Standard */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">পরীক্ষার মান</label>
            <select
              value={config.examStandard}
              onChange={(e) => updateConfig("examStandard", e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40"
            >
              <option value="board">Board Exam</option>
              <option value="admission">Admission</option>
              <option value="practice">Practice</option>
            </select>
          </div>

          {/* Question Type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">প্রশ্নের ধরন</label>
            <select
              value={config.questionType}
              onChange={(e) => updateConfig("questionType", e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40"
            >
              <option value="mcq">MCQ</option>
              <option value="cq">CQ</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          {/* Question Count */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              প্রশ্ন সংখ্যা <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepper("questionCount", config.questionCount - 5, 5)}
                className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={config.questionCount}
                onChange={(e) => stepper("questionCount", Number(e.target.value), 1)}
                className="flex-1 text-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-success/40"
              />
              <button
                onClick={() => stepper("questionCount", config.questionCount + 5)}
                className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Exam Time */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              পরীক্ষার সময় (মিনিট) <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepper("examTime", config.examTime - 5, 5)}
                className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={config.examTime}
                onChange={(e) => stepper("examTime", Number(e.target.value), 1)}
                className="flex-1 text-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-success/40"
              />
              <button
                onClick={() => stepper("examTime", config.examTime + 5)}
                className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Negative Marks */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">নেগেটিভ মার্ক</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepper("negativeMark", config.negativeMark - 0.25, 0, 2)}
                className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={config.negativeMark}
                readOnly
                className="flex-1 text-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold"
              />
              <button
                onClick={() => stepper("negativeMark", config.negativeMark + 0.25, 0, 2)}
                className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mark Per Question */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              প্রতি প্রশ্নের নম্বর <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepper("markPerQuestion", config.markPerQuestion - 1, 1, 10)}
                className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={config.markPerQuestion}
                readOnly
                className="flex-1 text-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold"
              />
              <button
                onClick={() => stepper("markPerQuestion", config.markPerQuestion + 1, 1, 10)}
                className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Total marks display */}
          <div className="flex items-end">
            <div className="w-full rounded-xl bg-success/10 border border-success/20 px-4 py-2.5 text-center">
              <p className="text-xs text-success mb-0.5">মোট নম্বর</p>
              <p className="text-lg font-bold text-success">
                {config.questionCount} × {config.markPerQuestion} = {totalMarks}
              </p>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Subject Selection */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="font-bold text-foreground mb-4">📖 বিষয়ভিত্তিক প্রশ্ন</h2>
        {loading ? (
          <div className="text-center text-muted-foreground py-8">ডাটা লোড করছি...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects
              .filter((s) => {
                if (config.group && (s.groupId?._id || s.groupId) !== config.group) return false;
                return true;
              })
              .map((subject) => {
              const isExpanded = expandedSubjects[subject._id];
              const isIndeterminate = isSubjectIndeterminate(subject._id);
              const isChecked = selectedSubjects[subject._id] && !isIndeterminate;

              return (
                <div
                  key={subject._id}
                  className={`self-start rounded-xl border-2 transition-all duration-300 ${
                    isExpanded ? "border-success/50" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <Checkbox
                      checked={isIndeterminate ? "indeterminate" : isChecked}
                      onCheckedChange={() => toggleSubject(subject._id)}
                      className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">
                        {subject.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {chapters.filter(c => (c.subjectId?._id || c.subjectId) === subject._id).length}টি অধ্যায়
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedSubjects((prev) => ({ ...prev, [subject._id]: !prev[subject._id] }))}
                      className="p-1"
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </button>
                  </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-0.5">
                        <div className="border-t border-border pt-2">
                          {chapters.filter(ch => (ch.subjectId?._id || ch.subjectId) === subject._id).map((chapter) => (
                            <label
                              key={chapter._id}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-success/5 cursor-pointer transition-colors"
                            >
                              <Checkbox
                                checked={!!selectedChapters[chapter._id]}
                                onCheckedChange={() => toggleChapter(subject._id, chapter._id)}
                                className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                              />
                              <span className="text-sm text-foreground flex-1 truncate">
                                {chapter.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Start Button */}
      <div className="flex justify-center pb-8">
        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full max-w-md bg-success hover:bg-success/90 text-white font-bold text-base py-6 rounded-xl transition-all disabled:bg-muted disabled:text-muted-foreground hover:scale-[1.02]"
        >
          পরীক্ষা শুরু করো
        </Button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">📋 পরীক্ষার সারাংশ</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">নির্বাচিত বিষয়</span>
                  <span className="font-medium text-foreground text-right max-w-[60%]">
                    {selectedSubjectNames.join(", ") || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">প্রশ্ন সংখ্যা</span>
                  <span className="font-bold text-foreground">{config.questionCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">মোট নম্বর</span>
                  <span className="font-bold text-success">{totalMarks}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">সময়</span>
                  <span className="font-bold text-foreground">{config.examTime} মিনিট</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">নেগেটিভ মার্ক</span>
                  <span className="font-bold text-foreground">{config.negativeMark}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl"
                >
                  বাতিল
                </Button>
                <Button
                  onClick={confirmStart}
                  className="flex-1 bg-success hover:bg-success/90 text-white rounded-xl"
                >
                  শুরু করো
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelfTest;
