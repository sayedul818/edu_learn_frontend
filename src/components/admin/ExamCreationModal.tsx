import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { examsAPI, subjectsAPI, chaptersAPI, topicsAPI, classesAPI, groupsAPI, usersAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, BarChart3, FileEdit } from "lucide-react";

type ExamCreationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQuestionIds?: string[];
  initialExam?: any;
  mode?: "create" | "edit";
  onSuccess?: (exam?: any) => void;
};

const ExamCreationModal = ({ open, onOpenChange, selectedQuestionIds = [], initialExam, mode = "create", onSuccess }: ExamCreationModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("edit");
  const [saving, setSaving] = useState(false);

  // Tab 1: Edit - Basic Information
  const [examTitle, setExamTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [warnings, setWarnings] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [duration, setDuration] = useState(30);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  // Subject, Chapter, Topic
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [pendingSubjectId, setPendingSubjectId] = useState<string>("");
  const [pendingChapterId, setPendingChapterId] = useState<string>("");
  const [pendingTopicId, setPendingTopicId] = useState<string>("");

  // Class Selection
  const [classId, setClassId] = useState("");
  const [groups, setGroups] = useState<any[]>([]);

  const [groupId, setGroupId] = useState("");
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    // Fetch subjects for selected class and group
    if (!classId && !groupId) { setSubjects([]); setSubjectId(""); return; }
    (async () => {
      try {
        // subjectsAPI.getAll expects an optional groupId string.
        // If groupId is present, use it. If only classId is present,
        // fetch all subjects and filter locally by classId.
        if (groupId) {
          const res = await subjectsAPI.getAll(groupId);
          setSubjects(res.data || []);
        } else if (classId) {
          const res = await subjectsAPI.getAll();
          const all = res.data || [];
          const filtered = all.filter((s: any) => (s.classId?._id || s.classId) === classId);
          setSubjects(filtered);
        }
        // apply pending subject id (from initialExam) after subjects loaded
        if (pendingSubjectId) {
          setSubjectId(pendingSubjectId);
          setPendingSubjectId("");
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
        setSubjects([]);
      }
    })();
  }, [classId, groupId]);

  useEffect(() => {
    // Fetch chapters for selected subject
    if (!subjectId) { setChapters([]); setChapterId(""); return; }
    (async () => {
      try {
        // chaptersAPI.getAll expects an optional subjectId string
        const res = await chaptersAPI.getAll(subjectId);
        setChapters(res.data || []);
        // apply pending chapter id after chapters loaded
        if (pendingChapterId) {
          setChapterId(pendingChapterId);
          setPendingChapterId("");
        }
      } catch (err) {
        console.error('Failed to fetch chapters:', err);
        setChapters([]);
      }
    })();
  }, [subjectId]);

  useEffect(() => {
    // Fetch topics for selected chapter
    if (!chapterId) { setTopics([]); setTopicId(""); return; }
    (async () => {
      try {
        const res = await topicsAPI.getAll(chapterId);
        setTopics(res.data || []);
        // apply pending topic id after topics loaded
        if (pendingTopicId) {
          setTopicId(pendingTopicId);
          setPendingTopicId("");
        }
      } catch (err) {
        console.error('Failed to fetch topics:', err);
        setTopics([]);
      }
    })();
  }, [chapterId]);

  useEffect(() => {
    // Fetch classes
    (async () => {
      const res = await classesAPI.getAll();
      setClasses(res.data || []);
    })();
  }, []);

  useEffect(() => {
    // Fetch groups for selected class
    if (!classId) { setGroups([]); setGroupId(""); return; }
    (async () => {
      const res = await groupsAPI.getAll(classId);
      setGroups(res.data || []);
    })();
  }, [classId]);

  // Tab 2: Settings
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState(0);
  const [questionNumbering, setQuestionNumbering] = useState("sequential");
  const [questionPresentation, setQuestionPresentation] = useState("all-at-once");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false);
  const [allowAnswerChange, setAllowAnswerChange] = useState(true);
  const [resultVisibility, setResultVisibility] = useState("immediate");
  const [answerVisibility, setAnswerVisibility] = useState("after-exam-end");
  const [autoSubmit, setAutoSubmit] = useState(true);

  // Access control: who can attempt
  const [accessType, setAccessType] = useState<'all' | 'specific'>('all');
  const [allowedStudents, setAllowedStudents] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const effectiveQuestionIds = useMemo(() => {
    if (selectedQuestionIds.length > 0) return selectedQuestionIds;
    if (initialExam?.questionIds?.length) {
      return initialExam.questionIds.map((q: any) => q._id || q);
    }
    return [];
  }, [selectedQuestionIds, initialExam]);

  const totalMarks = effectiveQuestionIds.length * marksPerQuestion;

  useEffect(() => {
    if (!open || !initialExam || mode !== "edit") return;
    setExamTitle(initialExam.title || "");
    setDescription(initialExam.description || "");
    setInstructions(initialExam.instructions || "");
    setWarnings(initialExam.warnings || "");
    setSyllabus(initialExam.syllabus || "");
    setDuration(initialExam.duration || 30);
    setStartDate(initialExam.startDate ? String(initialExam.startDate).slice(0, 10) : "");
    setStartTime(initialExam.startTime || "");
    setEndDate(initialExam.endDate ? String(initialExam.endDate).slice(0, 10) : "");
    setEndTime(initialExam.endTime || "");
    setMarksPerQuestion(initialExam.marksPerQuestion ?? 1);
    setNegativeMarking(Boolean(initialExam.negativeMarking));
    setNegativeMarkValue(initialExam.negativeMarkValue ?? 0);
    setQuestionNumbering(initialExam.questionNumbering || "sequential");
    setQuestionPresentation(initialExam.questionPresentation || "all-at-once");
    setShuffleQuestions(Boolean(initialExam.shuffleQuestions));
    setShuffleOptions(Boolean(initialExam.shuffleOptions));
    setAllowMultipleAttempts(Boolean(initialExam.allowMultipleAttempts));
    setAllowAnswerChange(initialExam.allowAnswerChange !== false);
    setResultVisibility(initialExam.resultVisibility || "immediate");
    setAnswerVisibility(initialExam.answerVisibility || "after-exam-end");
    setAutoSubmit(initialExam.autoSubmit !== false);
    // prefer class/group first so dependent dropdowns fetch correctly
    setClassId(
      initialExam.classId?._id || initialExam.classId || initialExam.class?._id || initialExam.class || ""
    );
    setGroupId(
      initialExam.groupId?._id || initialExam.groupId || initialExam.group?._id || initialExam.group || ""
    );

    const desiredSubjectId = initialExam.subjectId?._id || initialExam.subjectId || initialExam.subject?._id || initialExam.subject || "";
    const desiredChapterId = initialExam.chapterId?._id || initialExam.chapterId || initialExam.chapter?._id || initialExam.chapter || "";
    const desiredTopicId = initialExam.topicId?._id || initialExam.topicId || initialExam.topic?._id || initialExam.topic || "";

    // set pending ids to apply after lists are loaded
    setPendingSubjectId(desiredSubjectId);
    setPendingChapterId(desiredChapterId);
    setPendingTopicId(desiredTopicId);
    // access control
    setAccessType(initialExam.accessType || 'all');
    // allowedStudents may be populated objects or ids
    const allowed = (initialExam.allowedStudents || []).map((s: any) => (s && (s._id || s.id)) || s).filter(Boolean);
    setAllowedStudents(allowed);
  }, [open, initialExam, mode]);

  useEffect(() => {
    // fetch users for selection when accessType is 'specific' or when modal opens
    if (!open) return;
    (async () => {
      try {
        setLoadingUsers(true);
        const res = await usersAPI.list({ search: userSearch || undefined, limit: 200 });
        setUsers(res.data || []);
      } catch (e) {
        console.error('Failed to fetch users for exam access control', e);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [open, userSearch]);

  const handleSaveExam = async () => {
    if (!examTitle.trim()) {
      toast({
        title: "পরীক্ষার নাম প্রয়োজন",
        description: "অনুগ্রহ করে পরীক্ষার নাম দিন",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: examTitle,
        description,
        instructions,
        warnings,
        syllabus,
        duration,
        startDate: startDate || null,
        startTime: startTime || null,
        endDate: endDate || null,
        endTime: endTime || null,
        questionIds: effectiveQuestionIds,
        totalMarks,
        marksPerQuestion,
        negativeMarking,
        negativeMarkValue,
        questionNumbering,
        questionPresentation,
        shuffleQuestions,
        shuffleOptions,
        allowMultipleAttempts,
        allowAnswerChange,
        resultVisibility,
        answerVisibility,
        autoSubmit,
        status: initialExam?.status || "draft",
        subjectId: subjectId || null,
        chapterId: chapterId || null,
        topicId: topicId || null,
        classId: classId || null,
        groupId: groupId || null,
        accessType,
        allowedStudents,
      };
      console.debug('ExamCreationModal - submitting payload:', payload);
      const response = mode === "edit" && initialExam?._id
        ? await examsAPI.update(initialExam._id, payload)
        : await examsAPI.create(payload);
      console.debug('ExamCreationModal - API response:', response && response.data ? response.data : response);
      
      toast({
        title: mode === "edit" ? "পরীক্ষা আপডেট সফল!" : "পরীক্ষা তৈরি সফল!",
        description: `${response.data.title} সফলভাবে ${mode === "edit" ? "আপডেট" : "তৈরি"} হয়েছে`,
      });

      // Reset form only on create
      if (mode !== "edit") resetForm();
      onOpenChange(false);
      onSuccess?.(response.data);
    } catch (err) {
      console.error("Failed to create exam:", err);
      toast({
        title: mode === "edit" ? "পরীক্ষা আপডেট ব্যর্থ" : "পরীক্ষা তৈরি ব্যর্থ",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setExamTitle("");
    setDescription("");
    setInstructions("");
    setWarnings("");
    setSyllabus("");
    setDuration(30);
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setMarksPerQuestion(1);
    setNegativeMarking(false);
    setNegativeMarkValue(0);
    setQuestionNumbering("sequential");
    setQuestionPresentation("all-at-once");
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setAllowMultipleAttempts(false);
    setAllowAnswerChange(true);
    setResultVisibility("immediate");
    setAnswerVisibility("after-exam-end");
    setAutoSubmit(true);
    setActiveTab("edit");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileEdit className="h-6 w-6" />
            পরীক্ষা তৈরি করুন
          </DialogTitle>
          <DialogDescription>পরীক্ষার তথ্য এবং সেটিংস পূরণ করুন</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              এডিট
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              সেটিংস
            </TabsTrigger>
            <TabsTrigger value="result" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              ফলাফল
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Edit */}
          <TabsContent value="edit" className="space-y-6 mt-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">মৌলিক তথ্য</h3>
              
              <div>
                <Label htmlFor="title">পরীক্ষার নাম <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="এখানে লিখুন"
                  className="mt-1"
                />
              </div>

              {/* Class Selection */}
              <div>
                <Label htmlFor="class">ক্লাস নির্বাচন করুন (ঐচ্ছিক)</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c._id || c.id} value={c._id || c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Group Selection */}
              <div>
                <Label htmlFor="group">গ্রুপ নির্বাচন করুন (ঐচ্ছিক)</Label>
                <Select value={groupId} onValueChange={setGroupId} disabled={!classId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="গ্রুপ নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g._id || g.id} value={g._id || g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Subject Selection (filtered by class and group) */}
              <div>
                <Label htmlFor="subject">বিষয় নির্বাচন করুন <span className="text-red-500">*</span></Label>
                <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId && !groupId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length === 0 ? (
                      <div className="px-4 py-2 text-muted-foreground text-sm">কোনো বিষয় পাওয়া যায়নি</div>
                    ) : (
                      subjects.map((s) => (
                        <SelectItem key={s._id || s.id} value={s._id || s.id}>{s.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {/* Chapter selection removed as requested */}
              {/* ...existing code... */}

              <div>
                <Label htmlFor="instructions">পরীক্ষার নির্দেশিকা</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="এখানে লিখুন"
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="warnings">পরীক্ষার সতর্কতা</Label>
                <Textarea
                  id="warnings"
                  value={warnings}
                  onChange={(e) => setWarnings(e.target.value)}
                  placeholder="এখানে লিখুন"
                  className="mt-1 min-h-[60px]"
                />
              </div>

              <div>
                <Label htmlFor="syllabus">পরীক্ষার সিলেবাস</Label>
                <Textarea
                  id="syllabus"
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  placeholder="এখানে লিখুন"
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>

            {/* Time & Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">সময় ও সূচি</h3>
              
              <div>
                <Label htmlFor="duration">পরীক্ষার সময় (মিনিট) <span className="text-red-500">*</span></Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  placeholder="30"
                  className="mt-1"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">পরীক্ষা শুরু হওয়ার তারিখ</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="startTime">পরীক্ষা শুরু হওয়ার সময়</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">পরীক্ষা শেষ হওয়ার তারিখ</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">পরীক্ষা শেষ হওয়ার সময়</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Question Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">প্রশ্ন বিভাগ</h3>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">মোট প্রশ্ন সংখ্যা</p>
                  <p className="text-2xl font-bold">{selectedQuestionIds.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">মোট নম্বর</p>
                  <p className="text-2xl font-bold">{totalMarks}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Settings */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Subject, Chapter, Topic Info */}
              <h3 className="text-lg font-semibold border-b pb-2">বিষয়, অধ্যায়, টপিক</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">বিষয়</p>
                  <p className="text-lg font-bold">{subjects.find(s => s._id === subjectId || s.id === subjectId)?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ক্লাস</p>
                  <p className="text-lg font-bold">{classes.find(c => c._id === classId || c.id === classId)?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">গ্রুপ</p>
                  <p className="text-lg font-bold">{groups.find(g => g._id === groupId || g.id === groupId)?.name || "-"}</p>
                </div>
              </div>
            </div>
            {/* Marking Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">মার্কিং সেটিংস</h3>
              <div>
                <Label htmlFor="marksPerQuestion">প্রতিটি প্রশ্নের নম্বর</Label>
                <Input
                  id="marksPerQuestion"
                  type="number"
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                  className="mt-1"
                  min="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="negativeMarking">নেগেটিভ মার্কিং</Label>
                <Switch
                  id="negativeMarking"
                  checked={negativeMarking}
                  onCheckedChange={setNegativeMarking}
                />
              </div>
              {negativeMarking && (
                <div>
                  <Label htmlFor="negativeMarkValue">প্রতিটি ভুল উত্তরের নম্বর (কাটা যাবে)</Label>
                  <Input
                    id="negativeMarkValue"
                    type="number"
                    value={negativeMarkValue}
                    onChange={(e) => setNegativeMarkValue(Number(e.target.value))}
                    className="mt-1"
                    min="0"
                    step="0.25"
                  />
                </div>
              )}
            </div>
            {/* Question Behavior */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">প্রশ্ন আচরণ</h3>
              <div>
                <Label htmlFor="questionNumbering">প্রশ্নের নাম্বারিং</Label>
                <Select value={questionNumbering} onValueChange={setQuestionNumbering}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequential">ক্রমানুসারে</SelectItem>
                    <SelectItem value="random">এলোমেলো</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="questionPresentation">প্রশ্ন উপস্থাপন কেমন হবে?</Label>
                <Select value={questionPresentation} onValueChange={setQuestionPresentation}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-at-once">সবগুলো একসাথে</SelectItem>
                    <SelectItem value="one-by-one">একটির পর একটি</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="shuffleQuestions">প্রশ্ন অটো শাফল হবে?</Label>
                <Switch
                  id="shuffleQuestions"
                  checked={shuffleQuestions}
                  onCheckedChange={setShuffleQuestions}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="shuffleOptions">অপশন শাফল হবে?</Label>
                <Switch
                  id="shuffleOptions"
                  checked={shuffleOptions}
                  onCheckedChange={setShuffleOptions}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowMultipleAttempts">একজন শিক্ষার্থী একাধিকবার পরীক্ষা দিতে পারবে?</Label>
                <Switch
                  id="allowMultipleAttempts"
                  checked={allowMultipleAttempts}
                  onCheckedChange={setAllowMultipleAttempts}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowAnswerChange">পরীক্ষার্থী উত্তর পরিবর্তন করতে পারবে?</Label>
                <Switch
                  id="allowAnswerChange"
                  checked={allowAnswerChange}
                  onCheckedChange={setAllowAnswerChange}
                />
              </div>
            </div>
            {/* Result & Answer Control */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">ফলাফল এবং উত্তর নিয়ন্ত্রণ</h3>
              <div>
                <Label htmlFor="resultVisibility">ফলাফল কখন দেখাতে চান?</Label>
                <Select value={resultVisibility} onValueChange={setResultVisibility}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">সাথে সাথে</SelectItem>
                    <SelectItem value="after-exam-end">পরীক্ষা শেষ হওয়ার পর</SelectItem>
                    <SelectItem value="after-all-complete">সকলের পরীক্ষা শেষ হওয়ার পর</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="answerVisibility">উত্তরপত্র কখন দেখাতে চান?</Label>
                <Select value={answerVisibility} onValueChange={setAnswerVisibility}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">সাথে সাথে</SelectItem>
                    <SelectItem value="after-exam-end">পরীক্ষা শেষ হওয়ার পর</SelectItem>
                    <SelectItem value="never">কখনো না</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Access Control */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">অ্যাক্সেস কন্ট্রোল</h3>
              <div>
                <Label>কাদের পরীক্ষা দেওয়ার অনুমতি আছে?</Label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setAccessType('all')}
                    className={`px-3 py-1 rounded ${accessType === 'all' ? 'bg-primary text-white' : 'bg-muted'}`}>
                    সবার জন্য
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessType('specific')}
                    className={`px-3 py-1 rounded ${accessType === 'specific' ? 'bg-primary text-white' : 'bg-muted'}`}>
                    নির্দিষ্ট শিক্ষার্থীর জন্য
                  </button>
                </div>

                {accessType === 'specific' && (
                  <div className="mt-3">
                    <Label htmlFor="userSearch">শিক্ষার্থী অনুসন্ধান</Label>
                    <Input id="userSearch" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="নাম বা ইমেইল লিখুন" className="mt-1" />
                    <div className="mt-3 max-h-48 overflow-auto border rounded">
                      {loadingUsers ? (
                        <BeautifulLoader message="লোড হচ্ছে..." compact className="m-3" />
                      ) : users.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">কোনো শিক্ষার্থী পাওয়া যায়নি</div>
                      ) : (
                        users.map((u) => {
                          const uid = u._id || u.id;
                          const checked = allowedStudents.includes(uid);
                          return (
                            <label key={uid} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50">
                              <input type="checkbox" checked={checked} onChange={(e) => {
                                if (e.target.checked) setAllowedStudents(prev => Array.from(new Set([...prev, uid])));
                                else setAllowedStudents(prev => prev.filter(id => id !== uid));
                              }} />
                              <div>
                                <div className="font-medium">{u.name || u.fullName || u.email}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" onClick={() => setAllowedStudents(users.map(u => u._id || u.id))}>Select Visible</Button>
                      <Button variant="ghost" onClick={() => setAllowedStudents([])}>Clear</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Exam Control */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">পরীক্ষা নিয়ন্ত্রণ</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSubmit">সময় শেষ হলে অটো সাবমিট হবে?</Label>
                <Switch
                  id="autoSubmit"
                  checked={autoSubmit}
                  onCheckedChange={setAutoSubmit}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Result */}
          <TabsContent value="result" className="space-y-6 mt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">ফলাফল দেখার জন্য পরীক্ষা প্রকাশ করুন</p>
              <p className="text-sm text-muted-foreground mt-2">
                শিক্ষার্থীরা পরীক্ষা দেওয়ার পর এখানে পরিসংখ্যান দেখা যাবে
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button onClick={handleSaveExam} disabled={saving || !examTitle.trim()}>
            {saving ? (
              <>সংরক্ষণ হচ্ছে...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                পরীক্ষা সংরক্ষণ করুন
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamCreationModal;
