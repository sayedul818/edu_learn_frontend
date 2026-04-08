import { useState, useEffect, useRef } from "react";
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
import { isInlineGapPlaceholderCq, parseQuestionWithSubPoints, renderRichOrMathHtml, shuffleWordBank, splitPipedColumns } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/services/cloudinary";

const ITEMS_PER_PAGE = 5;

const isEffectivelyEmptyHtml = (value: string) => {
  const normalized = String(value || "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, "")
    .replace(/<div>\s*<\/div>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();

  return normalized.length === 0;
};

const normalizeRichTextForStorage = (value: any): string => {
  const raw = String(value ?? "").replace(/\r\n|\r/g, "\n").trim();
  if (!raw) return "";

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  if (!hasHtml) {
    return raw.replace(/\n/g, "<br />");
  }

  let html = raw;
  // Convert common contentEditable block patterns into explicit line breaks.
  html = html
    .replace(/<div><br\s*\/?><\/div>/gi, "<br />")
    .replace(/<p><br\s*\/?><\/p>/gi, "<br />")
    .replace(/<\/div>\s*<div>/gi, "<br />")
    .replace(/<\/p>\s*<p>/gi, "<br /><br />")
    .replace(/<div>/gi, "")
    .replace(/<\/div>/gi, "")
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "")
    .replace(/\n/g, "<br />");

  return html.trim();
};

type RichTextEditorProps = {
  fieldKey: string;
  value: string;
  placeholder?: string;
  minHeightClassName?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onSelectionChange: () => void;
  registerRef: (fieldKey: string) => (el: HTMLDivElement | null) => void;
};

const RichTextEditor = ({
  fieldKey,
  value,
  placeholder,
  minHeightClassName = "min-h-[90px]",
  onChange,
  onFocus,
  onSelectionChange,
  registerRef,
}: RichTextEditorProps) => {
  const localRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (localRef.current && localRef.current.innerHTML !== (value || "")) {
      localRef.current.innerHTML = value || "";
    }
  }, [value]);

  const setRefs = (el: HTMLDivElement | null) => {
    localRef.current = el;
    registerRef(fieldKey)(el);
  };

  return (
    <div className="relative">
      {placeholder && isEffectivelyEmptyHtml(value) && (
        <div className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground/70">
          {placeholder}
        </div>
      )}
      <div
        ref={setRefs}
        contentEditable
        suppressContentEditableWarning
        onFocus={onFocus}
        onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
        onKeyUp={onSelectionChange}
        onMouseUp={onSelectionChange}
        onBlur={onSelectionChange}
        className={`rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring whitespace-pre-wrap break-words ${minHeightClassName}`}
      />
    </div>
  );
};

const resolveQuestionText = (...values: Array<any>) => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
};

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
  const availableGroups = groups.filter((g) => String(g.classId?._id || g.classId) === String(selectedClass));
  const availableSubjects = subjects.filter((s) => String(s.groupId?._id || s.groupId) === String(selectedGroup));
  const availableChapters = chapters.filter((ch) => String(ch.subjectId?._id || ch.subjectId) === String(selectedSubject));
  const availableTopics = topics.filter((t) => String(t.chapterId?._id || t.chapterId) === String(selectedChapter));

  // Filter questions from database
  const allQuestions = dbQuestions.filter((q: any) => {
    // Filter by topic if selected
    if (selectedTopic) {
      const qTopicId = q.topicId?._id || q.topicId;
      if (String(qTopicId) !== String(selectedTopic)) return false;
    }

    // Filter by chapter if selected
    if (selectedChapter && !selectedTopic) {
      const qChapterId = q.chapterId?._id || q.chapterId;
      if (String(qChapterId) !== String(selectedChapter)) return false;
    }

    // Filter by subject if selected
    if (selectedSubject && !selectedChapter) {
      const qSubjectId = q.subjectId?._id || q.subjectId;
      if (String(qSubjectId) !== String(selectedSubject)) return false;
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
    const questionText = (q.questionTextBn || q.questionTextEn || q.questionBn || q.questionText || "").toString();
    const subQuestionText = Array.isArray(q.subQuestions)
      ? q.subQuestions
          .map((sq: any) => `${sq?.questionTextBn || sq?.questionTextEn || ""} ${sq?.answerBn || sq?.answerEn || sq?.answer || ""}`)
          .join(" ")
      : "";
    const textForSearch = `${questionText} ${subQuestionText}`.toLowerCase();
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
  const [activeEditorField, setActiveEditorField] = useState<string>("questionTextBn");
  const [selectedTextColor, setSelectedTextColor] = useState("#111827");
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState("#fef08a");
  const [selectedFontSize, setSelectedFontSize] = useState("16px");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingQuestionImage, setIsUploadingQuestionImage] = useState(false);
  const [isUploadingSubQuestionImage, setIsUploadingSubQuestionImage] = useState(false);
  const [subQuestionImageTargetIndex, setSubQuestionImageTargetIndex] = useState<number | null>(null);
  const editorRefs = useRef<Record<string, HTMLElement | null>>({});
  const savedSelectionRef = useRef<Record<string, Range | null>>({});
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const questionImageInputRef = useRef<HTMLInputElement | null>(null);
  const subQuestionImageInputRef = useRef<HTMLInputElement | null>(null);

  const registerEditorRef = (fieldKey: string) => (el: HTMLElement | null) => {
    editorRefs.current[fieldKey] = el;
  };

  const syncEditorFieldFromDom = (fieldKey: string) => {
    const editorNode = editorRefs.current[fieldKey];
    if (!editorNode) return;
    writeEditorField(fieldKey, (editorNode as HTMLElement).innerHTML || "");
  };

  const focusEditorField = (fieldKey: string) => {
    const editorNode = editorRefs.current[fieldKey];
    if (!editorNode) return null;
    editorNode.focus();
    setActiveEditorField(fieldKey);
    return editorNode;
  };

  const captureSelectionForField = (fieldKey: string) => {
    const editorNode = editorRefs.current[fieldKey];
    const selection = window.getSelection();
    if (!editorNode || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (editorNode.contains(range.commonAncestorContainer)) {
      savedSelectionRef.current[fieldKey] = range.cloneRange();
    }
  };

  const restoreSelectionForField = (fieldKey: string) => {
    const range = savedSelectionRef.current[fieldKey];
    if (!range) return;

    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const preventToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const readEditorField = (fieldKey: string): string => {
    if (!form) return "";
    if (fieldKey === "questionTextBn" || fieldKey === "questionTextEn" || fieldKey === "explanation") {
      return String(form[fieldKey] || "");
    }
    if (fieldKey.startsWith("option:")) {
      const idx = Number(fieldKey.split(":")[1]);
      const opt = (form.options || [])[idx];
      return String((opt && (opt.text || opt)) || "");
    }
    if (fieldKey.startsWith("subQuestionText:")) {
      const idx = Number(fieldKey.split(":")[1]);
      return String((form.subQuestions || [])[idx]?.questionTextBn || "");
    }
    if (fieldKey.startsWith("subQuestionAnswer:")) {
      const idx = Number(fieldKey.split(":")[1]);
      const sq = (form.subQuestions || [])[idx];
      return String(sq?.answerBn || sq?.answer || "");
    }
    return "";
  };

  const writeEditorField = (fieldKey: string, value: string) => {
    setForm((prev: any) => {
      if (!prev) return prev;
      if (fieldKey === "questionTextBn" || fieldKey === "questionTextEn" || fieldKey === "explanation") {
        return { ...prev, [fieldKey]: value };
      }
      if (fieldKey.startsWith("option:")) {
        const idx = Number(fieldKey.split(":")[1]);
        const options = [...(prev.options || [])];
        const current = options[idx] || { text: "", isCorrect: false };
        options[idx] = {
          ...(typeof current === "object" ? current : { isCorrect: false }),
          text: value,
        };
        return { ...prev, options };
      }
      if (fieldKey.startsWith("subQuestionText:")) {
        const idx = Number(fieldKey.split(":")[1]);
        const subQuestions = [...(prev.subQuestions || [])];
        subQuestions[idx] = { ...(subQuestions[idx] || {}), questionTextBn: value };
        return { ...prev, subQuestions };
      }
      if (fieldKey.startsWith("subQuestionAnswer:")) {
        const idx = Number(fieldKey.split(":")[1]);
        const subQuestions = [...(prev.subQuestions || [])];
        const curr = subQuestions[idx] || {};
        subQuestions[idx] = { ...curr, answerBn: value, answer: value };
        return { ...prev, subQuestions };
      }
      return prev;
    });
  };

  const wrapActiveSelection = (prefix: string, suffix: string, placeholder = "text") => {
    const fieldKey = activeEditorField || "questionTextBn";
    focusEditorField(fieldKey);
    restoreSelectionForField(fieldKey);
    const selection = window.getSelection();
    const selected = selection && selection.toString().length > 0 ? selection.toString() : placeholder;
    document.execCommand("insertHTML", false, `${prefix}${selected}${suffix}`);
    syncEditorFieldFromDom(fieldKey);
    captureSelectionForField(fieldKey);
  };

  const insertAtActiveCursor = (snippet: string) => {
    const fieldKey = activeEditorField || "questionTextBn";
    focusEditorField(fieldKey);
    restoreSelectionForField(fieldKey);
    document.execCommand("insertHTML", false, snippet);
    syncEditorFieldFromDom(fieldKey);
    captureSelectionForField(fieldKey);
  };

  const wrapActiveWithTag = (tagName: string, placeholder: string, attributes = "") => {
    const attrs = attributes ? ` ${attributes}` : "";
    wrapActiveSelection(`<${tagName}${attrs}>`, `</${tagName}>`, placeholder);
  };

  const wrapActiveWithStyle = (style: string, placeholder: string, tagName = "span") => {
    wrapActiveWithTag(tagName, placeholder, `style="${style}"`);
  };

  const insertBlockAtCursor = (before: string, after = "") => {
    const selection = window.getSelection();
    const selected = selection && selection.toString().length > 0 ? selection.toString() : "";
    insertAtActiveCursor(`${before}${selected}${after}`);
  };

  const applyExecCommand = (command: string, value?: string) => {
    const fieldKey = activeEditorField || "questionTextBn";
    focusEditorField(fieldKey);
    restoreSelectionForField(fieldKey);
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    syncEditorFieldFromDom(fieldKey);
    captureSelectionForField(fieldKey);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const url = await uploadImageToCloudinary(file);
      insertAtActiveCursor(`\n<img src=\"${url}\" alt=\"${file.name || "question-image"}\" />\n`);
      toast({ title: "Image uploaded", description: "Image tag inserted into active field" });
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleQuestionImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingQuestionImage(true);
      const url = await uploadImageToCloudinary(file);
      setForm((prev: any) => (prev ? { ...prev, image: url } : prev));
      toast({ title: "Image uploaded", description: "Question image set successfully" });
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingQuestionImage(false);
      event.target.value = "";
    }
  };

  const handleSubQuestionImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || subQuestionImageTargetIndex == null) return;

    try {
      setIsUploadingSubQuestionImage(true);
      const url = await uploadImageToCloudinary(file);
      setForm((prev: any) => {
        if (!prev) return prev;
        const subQuestions = [...(prev.subQuestions || [])];
        const current = subQuestions[subQuestionImageTargetIndex] || {};
        subQuestions[subQuestionImageTargetIndex] = { ...current, image: url };
        return { ...prev, subQuestions };
      });
      toast({ title: "Image uploaded", description: "Sub-question image set successfully" });
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingSubQuestionImage(false);
      setSubQuestionImageTargetIndex(null);
      event.target.value = "";
    }
  };

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
    normalized.options = Array.isArray(q.options)
      ? q.options.map((opt: any) => (typeof opt === "string" ? { text: opt, isCorrect: false } : { ...opt, text: opt?.text || "", isCorrect: !!opt?.isCorrect }))
      : [];
    normalized.image = q.image || "";
    normalized.subQuestions = Array.isArray(q.subQuestions)
      ? q.subQuestions.map((sq: any) => ({ ...sq, image: sq?.image || "" }))
      : [];
    setForm(normalized);
    setEditingId(q._id);
    setActiveEditorField("questionTextBn");
  };

  const saveEdit = async () => {
    if (!editingId || !form) return;
    try {
      if (form.questionType === "MCQ") {
        const normalizedOptions = (form.options || []).filter((opt: any) => (opt?.text || "").trim().length > 0);
        const hasCorrectOption = normalizedOptions.some((opt: any) => !!opt.isCorrect);

        if (normalizedOptions.length < 2) {
          toast({
            title: "Invalid options",
            description: "MCQ প্রশ্নে কমপক্ষে ২টি option দরকার",
            variant: "destructive",
          });
          return;
        }

        if (!hasCorrectOption) {
          toast({
            title: "Correct answer missing",
            description: "MCQ প্রশ্নে একটি correct answer নির্বাচন করুন",
            variant: "destructive",
          });
          return;
        }
      }

      // normalize ids before sending
      const payload = {
        ...form,
        questionTextBn: normalizeRichTextForStorage(form.questionTextBn),
        questionTextEn: normalizeRichTextForStorage(form.questionTextEn),
        explanation: normalizeRichTextForStorage(form.explanation),
        chapterId: form.chapterId && (form.chapterId._id || form.chapterId),
        subjectId: form.subjectId && (form.subjectId._id || form.subjectId),
        topicId: form.topicId && form.topicId !== "" ? (form.topicId._id || form.topicId) : undefined,
        examTypeId: form.examTypeId && form.examTypeId !== "" ? (form.examTypeId._id || form.examTypeId) : undefined,
        image: form.image || undefined,
        subQuestions: Array.isArray(form.subQuestions)
          ? form.subQuestions.map((sq: any) => ({
              ...sq,
              questionTextBn: normalizeRichTextForStorage(sq?.questionTextBn),
              questionTextEn: normalizeRichTextForStorage(sq?.questionTextEn),
              answerBn: normalizeRichTextForStorage(sq?.answerBn || sq?.answer),
              answerEn: normalizeRichTextForStorage(sq?.answerEn),
              explanationBn: normalizeRichTextForStorage(sq?.explanationBn),
              explanationEn: normalizeRichTextForStorage(sq?.explanationEn),
              image: sq?.image || undefined,
            }))
          : [],
        options:
          form.questionType === "MCQ"
            ? (form.options || [])
                .filter((opt: any) => (opt?.text || "").trim().length > 0)
                .map((opt: any) => ({ text: normalizeRichTextForStorage(opt?.text), isCorrect: !!opt?.isCorrect }))
            : [],
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
          const hasSubQuestions = (q as any).subQuestions && Array.isArray((q as any).subQuestions) && (q as any).subQuestions.length > 0;
          const isFillBlanksCq = hasSubQuestions && (q as any).questionType === 'CQ' && (q as any).subQuestions.some((sq: any) =>
            String(sq?.type || '').toLowerCase().includes('fill blank')
          );
          const isMakeSentencesCq = hasSubQuestions && (q as any).subQuestions.some((sq: any) =>
            /make\s*sentences?/.test(String(sq?.type || sq?.subQuestionType || '').toLowerCase())
          );
          const isInlineGapCq = hasSubQuestions && isInlineGapPlaceholderCq((q as any).subQuestions);
          const fillBlankWordBank = isFillBlanksCq
            ? shuffleWordBank((q as any).subQuestions
                .map((sq: any) => (sq.answerEn || sq.answerBn || sq.answer || '').toString().trim())
                .filter((w: string) => w.length > 0)
                .filter((w: string, i: number, arr: string[]) => arr.findIndex((x) => x.toLowerCase() === w.toLowerCase()) === i), String((q as any)?._id || (q as any)?.id || startIdx + idx + 1))
            : [];
          const makeSentenceRows = isMakeSentencesCq
            ? (q as any).subQuestions.map((sq: any, i: number) => ({
                label: sq.label || String.fromCharCode(97 + i),
                cols: splitPipedColumns(sq.questionTextBn || sq.questionTextEn || sq.questionText || "", 3),
              }))
            : [];

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
                {!isSubQuestionDisplay && (q as any).image && (
                  <div className="mb-3 rounded-lg border border-border bg-card p-3 flex justify-center">
                    <img
                      src={(q as any).image}
                      alt="Question"
                      className="max-h-60 w-auto rounded-sm object-contain"
                    />
                  </div>
                )}
                {(() => {
                  // If showing a sub-question from filter, display it differently
                  if (isSubQuestionDisplay) {
                    const sq = item.subQuestion;
                    return (
                      <div className="text-foreground leading-relaxed text-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="font-semibold">{sq.label || 'ক'}</div>
                          <div
                            className="leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.questionTextBn || sq.questionTextEn || "") }}
                          />
                          {sq.type && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                              {sq.type}
                            </span>
                          )}
                        </div>
                        {sq.image && (
                          <img
                            src={sq.image}
                            alt="Sub-question"
                            className="mt-2 max-h-52 w-auto rounded-sm object-contain"
                          />
                        )}
                      </div>
                    );
                  }

                  // For questions with subQuestions (CQ, জ্ঞানমূলক, etc.)
                  if (hasSubQuestions) {
                    const passage = (q as any).questionTextBn || (q as any).questionTextEn || '';

                    if (isFillBlanksCq) {
                      return (
                        <div className="rounded-lg border border-border bg-white dark:bg-slate-950 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <p className="text-foreground font-semibold leading-snug text-base">
                              {String(startIdx + idx + 1).padStart(2, '0')}. Fill in the blanks with the words from the box.
                            </p>
                            {(q as any).boardYear ? (
                              <span className="text-pink-600 dark:text-pink-300 font-bold text-sm">[{(q as any).boardYear}]</span>
                            ) : null}
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

                          {passage ? (
                            <div
                              className="text-foreground leading-loose text-base font-serif"
                              dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(passage) }}
                            />
                          ) : null}
                        </div>
                      );
                    }

                    if (isMakeSentencesCq) {
                      return (
                        <div className="rounded-lg border border-border bg-white dark:bg-slate-950 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <p className="text-foreground font-semibold leading-snug text-base" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(passage || "Make sentences from the table.") }} />
                            {(q as any).boardYear ? <span className="text-pink-600 dark:text-pink-300 font-bold text-sm">[{(q as any).boardYear}]</span> : null}
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
                      );
                    }

                    return (
                      <div>
                        {passage ? (
                          <div className="mb-4 rounded-lg bg-card border border-border text-foreground p-4 leading-relaxed text-sm">
                            <div dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(passage) }} />
                          </div>
                        ) : null}
                        {!isInlineGapCq && (
                          <div className="space-y-3">
                            {(q as any).subQuestions.map((sq: any, i: number) => (
                              <div key={i} className="border-l-2 border-success/30 pl-3">
                                <div className="flex items-start gap-2">
                                  <div className="w-6 flex-none font-semibold text-foreground text-base leading-tight">{sq.label || (['ক','খ','গ','ঘ','ঙ'][i] || `${i+1}.`)}</div>
                                  <div className="flex-1 flex flex-wrap items-center gap-2">
                                    <div
                                      className="text-foreground leading-relaxed text-sm"
                                      dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.questionTextBn || sq.questionTextEn || "") }}
                                    />
                                    {sq.type && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                                        {sq.type}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {sq.image && (
                                  <img
                                    src={sq.image}
                                    alt="Sub-question"
                                    className="mt-2 max-h-52 w-auto rounded-sm object-contain"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // For regular questions without subQuestions
                  const questionText = (q as any).questionTextBn || (q as any).questionTextEn;
                  const parsed = parseQuestionWithSubPoints(questionText);

                  if (parsed.hasSubPoints) {
                    return (
                      <div className="text-foreground font-medium leading-relaxed">
                        {parsed.mainQuestion && (
                          <div className="mb-2" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(parsed.mainQuestion) }} />
                        )}
                        <div className="ml-4 space-y-1">
                          {parsed.subPoints.map((point, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-semibold min-w-[2rem]">{['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.'][i]}</span>
                              <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(point) }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div>
                      <div
                        className="text-foreground font-medium leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(questionText) }}
                      />
                    </div>
                  );
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
                {/* Board Year Badge (if exists) */}
                {(q as any).boardYear && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {(q as any).boardYear}
                  </span>
                )}
                {/* Topic Badge (optional) */}
                {(() => {
                  const topicIdVal = (q as any).topicId?._id || (q as any).topicId;
                  const topicObj = topics.find((t) => String(t._id) === String(topicIdVal));
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${topicObj ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-100 text-gray-700"}`}>
                      <BookOpen className="w-3 h-3" />
                      {topicObj ? topicObj.name : "No topic"}
                    </span>
                  );
                })()}
            </div>

            {/* Options */}
            {(q as any).options && !isSubQuestionDisplay && !isMakeSentencesCq && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(q as any).options.map((opt: any, i: number) => (
                  <div key={i} className={`px-4 py-2.5 rounded-lg border text-sm transition-all ${opt.isCorrect ? "border-success/50 bg-success/5" : "border-border bg-card hover:border-success/50 hover:bg-success/5"}`}>
                    <span className="font-bold text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                    <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(opt.text || opt) }} />
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
                          Correct Answer:
                        </p>
                        <div
                          className="text-sm text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml((q as any).options.find((o: any) => o.isCorrect)?.text || "N/A") }}
                        />
                      </>
                    )}

                    {isSubQuestionDisplay ? (
                      <div>
                        <p className="text-sm font-bold text-success mb-2">Answer:</p>
                        <div
                          className="text-sm text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(item.subQuestion.answerBn || item.subQuestion.answer || "N/A") }}
                        />
                      </div>
                    ) : (
                      <>
                        {/* CQ answers */}
                        {(q as any).subQuestions && Array.isArray((q as any).subQuestions) && (q as any).subQuestions.length > 0 && !isMakeSentencesCq && (
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
                                      <span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.answer || sq.answerBn || sq.answerEn || "N/A") }} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div
                      className="text-sm text-muted-foreground leading-relaxed mt-2"
                      dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml((q as any).explanation || "No explanation provided") }}
                    />
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
                {/* Sticky Rich Text Toolbar */}
                <div className="sticky top-0 z-50 rounded-lg border border-border bg-background p-2 shadow-md">
                  {/* Row 1: Text Formatting */}
                  <div className="flex flex-wrap items-center gap-1 pb-2 border-b border-border">
                    <span className="text-xs font-semibold text-muted-foreground ml-2">Text:</span>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("bold")} title="Bold (Ctrl+B)" className="h-8 w-8 p-0">B</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("italic")} title="Italic (Ctrl+I)" className="h-8 w-8 p-0 italic">I</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("underline")} title="Underline (Ctrl+U)" className="h-8 w-8 p-0 underline">U</Button>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <select value={selectedFontSize} onChange={(e) => { setSelectedFontSize(e.target.value); applyExecCommand("fontSize", "7"); }} className="h-8 rounded border border-input bg-background px-2 text-xs" title="Font Size">
                      <option value="12px">12</option>
                      <option value="14px">14</option>
                      <option value="16px">16</option>
                      <option value="18px">18</option>
                      <option value="20px">20</option>
                      <option value="24px">24</option>
                      <option value="28px">28</option>
                    </select>
                    <label className="h-8 flex items-center gap-1 px-2 rounded border border-input hover:bg-muted transition-colors cursor-pointer" title="Text Color">
                      <span className="text-xs">A</span>
                      <input type="color" value={selectedTextColor} onChange={(e) => setSelectedTextColor(e.target.value)} className="h-6 w-6 rounded p-0 cursor-pointer" />
                    </label>
                    <label className="h-8 flex items-center gap-1 px-2 rounded border border-input hover:bg-muted transition-colors cursor-pointer" title="Background Color">
                      <span className="text-xs">🎨</span>
                      <input type="color" value={selectedBackgroundColor} onChange={(e) => setSelectedBackgroundColor(e.target.value)} className="h-6 w-6 rounded p-0 cursor-pointer" />
                    </label>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => wrapActiveWithStyle("text-decoration: overline;", "text")} title="Overline" className="h-8 w-8 p-0 underline" style={{textDecorationLine: 'overline'}}>ō</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("superscript")} title="Superscript" className="h-8 w-8 p-0 text-xs">x²</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("subscript")} title="Subscript" className="h-8 w-8 p-0 text-xs">x₂</Button>
                  </div>

                  {/* Row 2: Alignment & Lists */}
                  <div className="flex flex-wrap items-center gap-1 py-2 border-b border-border">
                    <span className="text-xs font-semibold text-muted-foreground ml-2">Align:</span>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("justifyLeft")} title="Align Left" className="h-8 w-8 p-0">⬅</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("justifyCenter")} title="Align Center" className="h-8 w-8 p-0">⬍</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("justifyRight")} title="Align Right" className="h-8 w-8 p-0">➡</Button>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <span className="text-xs font-semibold text-muted-foreground ml-2">Lists:</span>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("insertUnorderedList")} title="Bullet List" className="h-8 w-8 p-0">⊙</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => applyExecCommand("insertOrderedList")} title="Numbered List" className="h-8 w-8 p-0">1.</Button>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => insertAtActiveCursor("<br />")} title="Line Break" className="h-8 px-2 text-xs">↵</Button>
                  </div>

                  {/* Row 3: Advanced Formatting & Symbols */}
                  <div className="flex flex-wrap items-center gap-1 py-2">
                    <span className="text-xs font-semibold text-muted-foreground ml-2">Format:</span>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => wrapActiveSelection("<code>", "</code>", "code")} title="Code" className="h-8 px-2 text-xs">Code</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => wrapActiveSelection("<blockquote>", "</blockquote>", "quote")} title="Quote" className="h-8 px-2 text-xs">Quote</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => insertBlockAtCursor("<table><tr><td>Cell</td></tr></table>")} title="Table" className="h-8 px-2 text-xs">Table</Button>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <span className="text-xs font-semibold text-muted-foreground ml-2">Symbols:</span>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => insertAtActiveCursor("\\(x^2\\)")} title="Math Formula" className="h-8 px-2 text-xs">∑</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => insertAtActiveCursor(" π ")} title="Pi" className="h-8 w-8 p-0 text-sm">π</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => insertAtActiveCursor(" √ ")} title="Square Root" className="h-8 w-8 p-0 text-sm">√</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => insertAtActiveCursor(" → ")} title="Arrow" className="h-8 px-2 text-xs">→</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => insertAtActiveCursor(" ≤ ")} className="h-8 px-2 text-xs">≤</Button>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => insertAtActiveCursor(" ≥ ")} className="h-8 px-2 text-xs">≥</Button>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <Button type="button" variant="outline" size="sm" onMouseDown={preventToolbarMouseDown} onClick={() => imageInputRef.current?.click()} disabled={isUploadingImage} title="Insert Image" className="h-8 px-2 text-xs">
                      {isUploadingImage ? "..." : "IMG"}
                    </Button>
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <span className="text-xs text-muted-foreground ml-4">Active: <span className="font-semibold">{activeEditorField}</span></span>
                  </div>
                </div>
              <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Question Image</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => questionImageInputRef.current?.click()}
                    disabled={isUploadingQuestionImage}
                  >
                    {isUploadingQuestionImage ? "Uploading..." : "Upload Question Image"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm({ ...form, image: "" })}
                    disabled={!form.image}
                  >
                    Remove
                  </Button>
                  <input
                    ref={questionImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQuestionImageUpload}
                  />
                </div>
                <Input
                  value={form.image || ""}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://.../question-image.jpg"
                />
                {form.image && (
                  <img
                    src={form.image}
                    alt="Question preview"
                    className="max-h-48 w-auto rounded border border-border"
                  />
                )}
              </div>
              <div>
                <Label>Question (Bengali)</Label>
                <RichTextEditor
                  fieldKey="questionTextBn"
                  value={form.questionTextBn ?? ""}
                  placeholder="Question (Bengali)"
                  registerRef={registerEditorRef}
                  onFocus={() => setActiveEditorField("questionTextBn")}
                  onSelectionChange={() => captureSelectionForField("questionTextBn")}
                  onChange={(value) => setForm({ ...form, questionTextBn: value })}
                />
              </div>
              <div>
                <Label>Question (English)</Label>
                <RichTextEditor
                  fieldKey="questionTextEn"
                  value={form.questionTextEn ?? ""}
                  placeholder="Question (English)"
                  registerRef={registerEditorRef}
                  onFocus={() => setActiveEditorField("questionTextEn")}
                  onSelectionChange={() => captureSelectionForField("questionTextEn")}
                  onChange={(value) => setForm({ ...form, questionTextEn: value })}
                />
              </div>
              {form.questionType === "MCQ" && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2">
                  {(form.options || []).map((opt: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-border p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">{String.fromCharCode(65 + idx)}.</div>
                        <Button
                          type="button"
                          size="sm"
                          variant={opt?.isCorrect ? "default" : "outline"}
                          onClick={() => setForm({
                            ...form,
                            options: (form.options || []).map((o: any, i: number) => ({
                              ...(typeof o === "object" ? o : { text: o, isCorrect: false }),
                              isCorrect: i === idx,
                            })),
                          })}
                        >
                          {opt?.isCorrect ? "Correct" : "Mark Correct"}
                        </Button>
                      </div>
                      <RichTextEditor
                        fieldKey={`option:${idx}`}
                        value={opt?.text || ""}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        registerRef={registerEditorRef}
                        onFocus={() => setActiveEditorField(`option:${idx}`)}
                        onSelectionChange={() => captureSelectionForField(`option:${idx}`)}
                        onChange={(value) => {
                          const nextOptions = [...(form.options || [])];
                          const current = nextOptions[idx] || { text: "", isCorrect: false };
                          nextOptions[idx] = { ...(typeof current === "object" ? current : { isCorrect: false }), text: value };
                          setForm({ ...form, options: nextOptions });
                        }}
                        minHeightClassName="min-h-[70px]"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setForm({ ...form, options: [...(form.options || []), { text: "", isCorrect: false }] })}
                  >
                    + Add Option
                  </Button>
                </div>
              </div>
              )}
              {form.questionType === "MCQ" && (
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
              )}
              <div>
                <Label>Explanation</Label>
                <RichTextEditor
                  fieldKey="explanation"
                  value={form.explanation || ""}
                  placeholder="Explanation"
                  registerRef={registerEditorRef}
                  onFocus={() => setActiveEditorField("explanation")}
                  onSelectionChange={() => captureSelectionForField("explanation")}
                  onChange={(value) => setForm({ ...form, explanation: value })}
                />
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
                          <option value="Fill blanks">Fill blanks</option>
                          <option value="Make sentences">Make sentences</option>
                          <option value="Change narrative style">Change narrative style</option>
                          <option value="Tag questions">Tag questions</option>
                        </select>
                        <div className="col-span-6">
                        <RichTextEditor
                          fieldKey={`subQuestionText:${i}`}
                          value={resolveQuestionText(sq.questionTextBn, sq.questionTextEn, sq.questionText, sq.questionBn)}
                          placeholder="Sub-question (Bengali)"
                          registerRef={registerEditorRef}
                          onFocus={() => setActiveEditorField(`subQuestionText:${i}`)}
                          onSelectionChange={() => captureSelectionForField(`subQuestionText:${i}`)}
                          onChange={(value) => {
                            const copy = JSON.parse(JSON.stringify(form));
                            copy.subQuestions = copy.subQuestions || [];
                            copy.subQuestions[i] = { ...copy.subQuestions[i], questionTextBn: value };
                            setForm(copy);
                          }}
                        />
                        </div>
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
                      <RichTextEditor
                        fieldKey={`subQuestionAnswer:${i}`}
                        value={resolveQuestionText(sq.answerBn, sq.answerEn, sq.answer, sq.answerText)}
                        placeholder="Answer (Bengali)"
                        registerRef={registerEditorRef}
                        onFocus={() => setActiveEditorField(`subQuestionAnswer:${i}`)}
                        onSelectionChange={() => captureSelectionForField(`subQuestionAnswer:${i}`)}
                        onChange={(value) => {
                          const copy = JSON.parse(JSON.stringify(form));
                          copy.subQuestions = copy.subQuestions || [];
                          copy.subQuestions[i] = { ...copy.subQuestions[i], answerBn: value, answer: value };
                          setForm(copy);
                        }}
                      />
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSubQuestionImageTargetIndex(i);
                              subQuestionImageInputRef.current?.click();
                            }}
                            disabled={isUploadingSubQuestionImage && subQuestionImageTargetIndex === i}
                          >
                            {isUploadingSubQuestionImage && subQuestionImageTargetIndex === i ? "Uploading..." : "Upload Sub-image"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const copy = JSON.parse(JSON.stringify(form));
                              copy.subQuestions = copy.subQuestions || [];
                              copy.subQuestions[i] = { ...copy.subQuestions[i], image: "" };
                              setForm(copy);
                            }}
                            disabled={!sq.image}
                          >
                            Remove
                          </Button>
                        </div>
                        <Input
                          className="w-full"
                          placeholder="Sub-question image URL"
                          value={sq.image || ""}
                          onChange={(e) => {
                            const copy = JSON.parse(JSON.stringify(form));
                            copy.subQuestions = copy.subQuestions || [];
                            copy.subQuestions[i] = { ...copy.subQuestions[i], image: e.target.value };
                            setForm(copy);
                          }}
                        />
                        {sq.image && (
                          <img
                            src={sq.image}
                            alt="Sub-question preview"
                            className="max-h-40 w-auto rounded border border-border"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <input
                    ref={subQuestionImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSubQuestionImageUpload}
                  />
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
                  onChange={(e) => setForm({ ...form, topicId: e.target.value || undefined })}
                  disabled={!form.chapterId}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- No topic --</option>
                  {topics.filter((t) => String(t.chapterId?._id || t.chapterId) === String(form.chapterId || selectedChapter)).map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Board Year (Optional)</Label>
                <Input
                  placeholder="e.g. 2024, 2024 S1, JSC 2024"
                  value={form.boardYear || ""}
                  onChange={(e) => setForm({ ...form, boardYear: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label>Exam Type (Optional)</Label>
                <select 
                  value={form.examTypeId || ""}
                  onChange={(e) => setForm({ ...form, examTypeId: e.target.value || undefined })}
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
