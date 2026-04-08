import { useMemo, useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { examsAPI, subjectsAPI, chaptersAPI, topicsAPI, classesAPI, groupsAPI, usersAPI, examResultsAPI, questionsAPI } from "@/services/api";
import { renderMathToHtml, renderRichOrMathHtml } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, BarChart3, FileEdit, Eye, Clock, CheckCircle, AlertCircle, Brush, Eraser, Palette } from "lucide-react";

type ExamCreationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQuestionIds?: string[];
  selectedQuestionMarks?: { questionId: string; marks: number }[];
  initialExam?: any;
  mode?: "create" | "edit";
  onSuccess?: (exam?: any) => void;
  selectedSubjectId?: string | null;
  selectedChapterId?: string | null;
};

const ExamCreationModal = ({ open, onOpenChange, selectedQuestionIds = [], selectedQuestionMarks = [], initialExam, mode = "create", onSuccess, selectedSubjectId = null, selectedChapterId = null }: ExamCreationModalProps) => {
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

  // Tab 3: Results
  const [loadingResults, setLoadingResults] = useState(false);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [answerSheetOpen, setAnswerSheetOpen] = useState(false);
  const [resultQuestions, setResultQuestions] = useState<any[]>([]);
  const [gradingMarks, setGradingMarks] = useState<Record<string, number>>({});
  const [feedbackAttachments, setFeedbackAttachments] = useState<Record<string, any[]>>({});
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingAttachmentKey, setEditingAttachmentKey] = useState<string | null>(null);
  const [editingAttachmentIndex, setEditingAttachmentIndex] = useState<number>(0);
  const [editingAttachment, setEditingAttachment] = useState<any>(null);
  const [brushColor, setBrushColor] = useState<string>('#ef4444');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const [isSavingFeedbackImage, setIsSavingFeedbackImage] = useState<boolean>(false);

  const effectiveQuestionIds = useMemo(() => {
    if (selectedQuestionIds.length > 0) return selectedQuestionIds;
    if (initialExam?.questionIds?.length) {
      return initialExam.questionIds.map((q: any) => q._id || q);
    }
    return [];
  }, [selectedQuestionIds, initialExam]);

  const computedTotalMarks = useMemo(() => {
    if (selectedQuestionMarks && selectedQuestionMarks.length > 0) {
      return selectedQuestionMarks.reduce((s, m) => s + Number(m.marks || 0), 0);
    }
    return effectiveQuestionIds.length * marksPerQuestion;
  }, [selectedQuestionMarks, effectiveQuestionIds, marksPerQuestion]);

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

  // Fetch exam results when result tab is active and initialExam exists
  useEffect(() => {
    if (activeTab !== 'result' || !initialExam?._id) return;
    
    (async () => {
      try {
        setLoadingResults(true);
        const res = await examResultsAPI.getByExam(initialExam._id);
        setExamResults(res.data || []);
      } catch (err) {
        console.error('Failed to fetch exam results:', err);
        setExamResults([]);
      } finally {
        setLoadingResults(false);
      }
    })();
  }, [activeTab, initialExam?._id]);

  // Handle View Answer click
  const handleViewAnswer = async (result: any) => {
    try {
      // Get questions for this exam
      if (!initialExam?.questionIds || initialExam.questionIds.length === 0) {
        toast({ title: "No questions found", variant: "destructive" });
        return;
      }
      
      const questionIds = initialExam.questionIds.map((q: any) => q._id || q);
      const questionsRes = await questionsAPI.getAll();
      const questions = (questionsRes.data || []).filter((q: any) => questionIds.includes(q._id));
      
      setResultQuestions(questions);
      setSelectedResult(result);
      // prepare grading marks map from existing result.cqMarks if available
      const initialMarks: Record<string, number> = {};
      if (result?.cqMarks && typeof result.cqMarks === 'object') {
        Object.keys(result.cqMarks).forEach(k => { initialMarks[k] = Number(result.cqMarks[k]) || 0; });
      }
      // also ensure subquestion ids exist with 0 default
      questions.forEach((q:any) => {
        if (q.subQuestions && Array.isArray(q.subQuestions)) {
          q.subQuestions.forEach((sq:any, idx:number) => {
            const id = sq._id || `${q._id}-${idx}`;
            if (!(id in initialMarks)) initialMarks[id] = 0;
          });
        }
      });
      setGradingMarks(initialMarks);
      setFeedbackAttachments(result?.feedbackAttachments && typeof result.feedbackAttachments === 'object' ? result.feedbackAttachments : {});
      setAnswerSheetOpen(true);
    } catch (err) {
      console.error('Failed to load questions:', err);
      toast({ title: "Failed to load questions", variant: "destructive" });
    }
  };

  // Get student name from result
  const getStudentName = (result: any) => {
    if (!result) return "Unknown Student";

    // studentId can be an object or a string id; there are cases where
    // the API returns nested student object under different keys
    const sid = result.studentId || result.student || result.user;
    if (!sid) return "Unknown Student";

    if (typeof sid === "string") {
      // fallback to id when no name/email available
      return sid;
    }

    if (sid.name) return sid.name;
    if (sid.fullName) return sid.fullName;
    if (sid.email) return sid.email;
    return "Unknown Student";
  };

  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [gradeTotalMarks, setGradeTotalMarks] = useState<number | undefined>(undefined);
  const [gradeScore, setGradeScore] = useState<number | undefined>(undefined);

  // when selectedResult changes, initialize gradingMarks and reset edit mode
  useEffect(() => {
    if (!selectedResult) return;
    const initialMarks: Record<string, number> = {};
    if (selectedResult?.cqMarks && typeof selectedResult.cqMarks === 'object') {
      Object.keys(selectedResult.cqMarks).forEach(k => { initialMarks[k] = Number(selectedResult.cqMarks[k]) || 0; });
    }
    setGradingMarks((prev) => ({ ...initialMarks, ...prev }));
    setGradeTotalMarks(selectedResult.totalMarks ?? selectedResult?.examId?.totalMarks ?? undefined);
    setGradeScore(selectedResult.score ?? undefined);
    setFeedbackAttachments(selectedResult?.feedbackAttachments && typeof selectedResult.feedbackAttachments === 'object' ? selectedResult.feedbackAttachments : {});
    setIsEditingGrade(false);
  }, [selectedResult]);

  const openAttachment = async (att: any) => {
    try {
      const url = att.dataUrl || att.url;
      if (!url) {
        toast({ title: 'No attachment URL', variant: 'destructive' });
        return;
      }

      // If we have a dataUrl (base64), open it directly
      if (att.dataUrl) {
        window.open(att.dataUrl, '_blank');
        return;
      }

      // For PDFs, try to fetch then open as blob to avoid content-type/cors viewer issues
      if (att.type === 'application/pdf' || (att.name && att.name.toLowerCase().endsWith('.pdf'))) {
        try {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('Failed to fetch file');
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          return;
        } catch (err) {
          // If fetch failed, try Cloudinary raw URL fallback (image vs raw resource path)
          console.warn('Blob fetch failed, attempting Cloudinary raw fallback', err);
          try {
            if (url.includes('/image/upload/')) {
              const alt = url.replace('/image/upload/', '/raw/upload/');
              const r2 = await fetch(alt);
              if (r2.ok) {
                const b2 = await r2.blob();
                const u2 = URL.createObjectURL(b2);
                window.open(u2, '_blank');
                return;
              }
            }
          } catch (e2) {
            console.warn('Raw fallback also failed', e2);
          }
          // final fallback: open original URL directly
          window.open(url, '_blank');
          return;
        }
      }

      // Images and other files: open directly
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to open attachment', err);
      toast({ title: 'Failed to open attachment', variant: 'destructive' });
    }
  };

  const getFeedbackOrOriginalAttachment = (key: string, idx: number, originalAtt: any) => {
    const edits = feedbackAttachments[key];
    if (Array.isArray(edits) && edits[idx]) return edits[idx];
    return originalAtt;
  };

  const sanitizeFeedbackAttachments = (raw: Record<string, any[]>) => {
    const out: Record<string, any[]> = {};
    Object.entries(raw || {}).forEach(([k, arr]) => {
      if (!Array.isArray(arr)) return;
      // Preserve array positions so edited attachment index keeps matching original index.
      const withExplicitNulls = Array.from({ length: arr.length }, (_, i) => arr[i] ?? null);
      const cleanedList = withExplicitNulls.map((att: any) => {
        if (!att) return null;
        const cleaned: any = {
          name: att?.name,
          type: att?.type,
          edited: !!att?.edited,
          originalName: att?.originalName,
        };
        if (att?.url) {
          cleaned.url = att.url;
        } else if (att?.dataUrl) {
          // Keep base64 only as fallback when no hosted URL exists.
          cleaned.dataUrl = att.dataUrl;
        }
        return cleaned;
      });

      // Persist only keys that contain at least one edited attachment.
      if (cleanedList.some(Boolean)) {
        out[k] = cleanedList;
      }
    });
    return out;
  };

  const startEditAttachment = (key: string, idx: number, att: any) => {
    const sourceAtt = getFeedbackOrOriginalAttachment(key, idx, att);
    if (!(sourceAtt?.type && String(sourceAtt.type).startsWith('image/')) && !/\.(jpg|jpeg|png|gif|webp)$/i.test(sourceAtt?.name || '')) {
      toast({ title: 'Only image files can be edited', variant: 'destructive' });
      return;
    }
    setEditingAttachmentKey(key);
    setEditingAttachmentIndex(idx);
    setEditingAttachment(sourceAtt);
    setImageEditorOpen(true);
  };

  const drawPoint = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = brushColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const getCanvasCoords = (evt: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = false;
    ctx.beginPath();
  };

  // Helper: resolve an image src to a dataUrl, fetching remote URLs as blob
  // to avoid canvas CORS taint when calling toDataURL() later.
  const resolveImageSrc = async (src: string): Promise<string> => {
    if (!src || src.startsWith('data:')) return src;
    try {
      const resp = await fetch(src, { mode: 'cors' });
      if (!resp.ok) throw new Error('fetch failed');
      const blob = await resp.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      // CORS fetch failed — return original; canvas will be tainted but at least visible
      return src;
    }
  };

  const drawSrcToCanvas = async (src: string) => {
    const resolvedSrc = await resolveImageSrc(src);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      const maxW = 1000;
      const ratio = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      canvas.width = Math.max(1, Math.floor(img.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.floor(img.naturalHeight * ratio));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.onerror = () => {
      const c = canvasRef.current;
      if (!c) return;
      const cx = c.getContext('2d');
      if (!cx) return;
      c.width = 600; c.height = 300;
      cx.fillStyle = '#f5f5f5';
      cx.fillRect(0, 0, 600, 300);
      cx.fillStyle = '#888';
      cx.font = '16px sans-serif';
      cx.textAlign = 'center';
      cx.fillText('Image could not be loaded.', 300, 150);
    };
    img.src = resolvedSrc;
  };

  const clearEditedCanvas = () => {
    const src = editingAttachment?.dataUrl || editingAttachment?.url;
    if (!src) return;
    drawSrcToCanvas(src);
  };

  const saveEditedAttachment = async () => {
    if (!editingAttachmentKey || editingAttachmentIndex < 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsSavingFeedbackImage(true);
      const dataUrl = canvas.toDataURL('image/png');
      const editedNameBase = (editingAttachment?.name || `feedback-${editingAttachmentIndex + 1}`).replace(/\.[^/.]+$/, '');
      const editedAttachment: any = {
        name: `${editedNameBase}-feedback.png`,
        type: 'image/png',
        dataUrl,
        edited: true,
        originalName: editingAttachment?.name,
      };

      try {
        const { uploadFileToCloudinary } = await import('@/services/cloudinary');
        const resp = await fetch(dataUrl);
        const blob = await resp.blob();
        const file = new File([blob], editedAttachment.name, { type: 'image/png' });
        const url = await uploadFileToCloudinary(file);
        editedAttachment.url = url;
        // Prefer URL storage to keep grade-save payload small.
        delete editedAttachment.dataUrl;
      } catch (uploadErr) {
        // fallback keeps dataUrl, which is already set above
        console.warn('Feedback image upload failed, storing dataUrl fallback', uploadErr);
      }

      setFeedbackAttachments((prev) => {
        const current = Array.isArray(prev[editingAttachmentKey]) ? [...prev[editingAttachmentKey]] : [];
        current[editingAttachmentIndex] = editedAttachment;
        return { ...prev, [editingAttachmentKey]: current };
      });

      setImageEditorOpen(false);
      toast({ title: 'Edited image saved', description: 'Click Save Grades / Save Changes to publish for student feedback.' });
    } catch (err) {
      console.error('Failed to save edited image', err);
      toast({ title: 'Failed to save edited image', variant: 'destructive' });
    } finally {
      setIsSavingFeedbackImage(false);
    }
  };

  useEffect(() => {
    if (!imageEditorOpen || !editingAttachment) return;
    const src = editingAttachment.dataUrl || editingAttachment.url;
    if (!src) return;

    // Delay slightly so the Dialog has time to mount the canvas element
    // before we try to draw (canvasRef.current would be null otherwise).
    const timer = setTimeout(() => {
      drawSrcToCanvas(src);
    }, 60);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageEditorOpen, editingAttachment]);

  // Format time (submission time)
  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleString('bn-BD', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // Get status (Pending = not evaluated, Evaluated = evaluated)
  const getStatus = (result: any) => {
    // If we have a percentage > 0 or score > 0, it's evaluated
    return (result.score !== null && result.score !== undefined) ? "Evaluated" : "Pending";
  };

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
      const payload: any = {
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
        totalMarks: computedTotalMarks,
        marksPerQuestion,
        ...(selectedQuestionMarks && selectedQuestionMarks.length > 0 ? { questionMarks: selectedQuestionMarks } : {}),
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
        subjectId: subjectId || selectedSubjectId || null,
        chapterId: chapterId || selectedChapterId || null,
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
    <>
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
                  <p className="text-2xl font-bold">{computedTotalMarks}</p>
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
            {!initialExam?._id ? (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">ফলাফল দেখার জন্য পরীক্ষা সংরক্ষণ করুন</p>
                <p className="text-sm text-muted-foreground mt-2">
                  শিক্ষার্থীরা পরীক্ষা দেওয়ার পর এখানে পরিসংখ্যান দেখা যাবে
                </p>
              </div>
            ) : loadingResults ? (
              <BeautifulLoader message="ফলাফল লোড হচ্ছে..." className="py-8" />
            ) : examResults.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">কোনো ফলাফল পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 font-semibold">শিক্ষার্থী নাম</th>
                      <th className="text-center px-4 py-3 font-semibold">স্কোর</th>
                      <th className="text-center px-4 py-3 font-semibold">গড় (%)</th>
                      <th className="text-left px-4 py-3 font-semibold">জমা দেওয়ার সময়</th>
                      <th className="text-center px-4 py-3 font-semibold">অবস্থা</th>
                      <th className="text-center px-4 py-3 font-semibold">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examResults.map((result: any) => {
                      const status = getStatus(result);
                      const percentage = result.percentage || 0;
                      return (
                        <tr key={result._id} className="border-b hover:bg-muted/30 transition">
                          <td className="px-4 py-3 font-medium">{getStudentName(result)}</td>
                          <td className="px-4 py-3 text-center font-semibold text-success">
                            {result.score}/{result.totalMarks}
                          </td>
                          <td className="px-4 py-3 text-center">{percentage.toFixed(2)}%</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTime(result.submittedAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {status === "Evaluated" ? (
                                <><CheckCircle className="h-4 w-4 text-success" /> মূল্যায়িত</>
                              ) : (
                                <><AlertCircle className="h-4 w-4 text-yellow-500" /> অপেক্ষমান</>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewAnswer(result)}
                              className="gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              উত্তর দেখুন
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button onClick={handleSaveExam} disabled={saving || !examTitle.trim()} className={activeTab === 'result' ? 'hidden' : ''}>
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

    {/* Answer Sheet Modal */}
    <Dialog open={answerSheetOpen} onOpenChange={setAnswerSheetOpen}>
      <DialogContent className="w-full sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            উত্তর তালিকা - {getStudentName(selectedResult)}
          </DialogTitle>
          <DialogDescription>
            স্কোর: {selectedResult?.score}/{selectedResult?.totalMarks} ({selectedResult?.percentage?.toFixed(2)}%)
          </DialogDescription>
        </DialogHeader>
        {(selectedResult?.pendingEvaluation || isEditingGrade) && (
          <div className="mb-3 flex items-center gap-3">
            <Label className="whitespace-nowrap">Total Marks</Label>
            <Input
              type="number"
              value={gradeTotalMarks ?? ''}
              onChange={(e) => setGradeTotalMarks(e.target.value === '' ? undefined : Number(e.target.value))}
              className="w-36"
              min={0}
            />
            <Label className="whitespace-nowrap">Obtained Score</Label>
            <Input
              type="number"
              value={gradeScore ?? ''}
              onChange={(e) => setGradeScore(e.target.value === '' ? undefined : Number(e.target.value))}
              className="w-28"
              min={0}
            />
            <div className="text-sm text-muted-foreground">Set a custom total marks for this result (optional)</div>
          </div>
        )}

        <div className="space-y-6">
            {resultQuestions.map((question: any, index: number) => {
            const studentAnswer = selectedResult?.answers?.[question._id];
            // A question is MCQ only if it has no subQuestions AND its questionType is explicitly 'MCQ'.
            // CQ questions may have questionType defaulted to 'MCQ' in the DB, so we check subQuestions first.
            const hasCQSubquestions = Boolean(question.subQuestions && Array.isArray(question.subQuestions) && question.subQuestions.length > 0);
            const isMultipleChoice = !hasCQSubquestions && question.questionType === 'MCQ';
            // derive correct answer from option marked `isCorrect` (questions from API may not include a `correctAnswer` property)
            const correctAnswer = isMultipleChoice ? (question.options?.find((o: any) => o && o.isCorrect)?.text || null) : null;
            // Gather attachments belonging to this question
            const questionAttachments: Array<{ key: string; items: any[] }> = [];
            if (selectedResult?.attachments && typeof selectedResult.attachments === 'object') {
              Object.entries(selectedResult.attachments).forEach(([k, a]: any) => {
                if (String(k).startsWith(String(question._id))) {
                  questionAttachments.push({ key: k, items: Array.isArray(a) ? a : [a] });
                }
              });
            }
            
            return (
              <div key={question._id} className="bg-muted/20 p-4 rounded-lg border">
                <div className="font-semibold mb-2 text-base">
                  প্রশ্ন {index + 1}: <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(question.questionTextBn || question.questionTextEn) }} />
                </div>

                {/* Options for MCQ */}
                {isMultipleChoice && question.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                    {question.options.map((opt: any, optIdx: number) => {
                      const optionLetter = String.fromCharCode(65 + optIdx);
                      const optText = typeof opt === 'string' ? opt : opt.text;
                      // studentAnswer may be stored as the option letter (A/B/C) or as the full option text — accept both
                      const normalizedStudent = (studentAnswer || '').toString().trim();
                      const normalizedOptText = (optText || '').toString().trim();
                      const normalizedCorrect = (correctAnswer || '').toString().trim();
                      const isStudentAnswer = normalizedStudent === optionLetter || normalizedStudent === normalizedOptText;
                      // correctAnswer may be stored as letter or text; accept both
                      const isCorrect = normalizedCorrect === optionLetter || normalizedCorrect === normalizedOptText;

                      let bgColor = 'bg-card';
                      if (isStudentAnswer && isCorrect) bgColor = 'bg-success/20 border-success';
                      else if (isStudentAnswer) bgColor = 'bg-destructive/20 border-destructive';
                      else if (isCorrect) bgColor = 'bg-yellow-500/10 border-yellow-500';

                      return (
                        <div 
                          key={optIdx} 
                          className={`p-2 rounded border transition ${bgColor}`}
                        >
                          <span className="font-medium">{optionLetter}.</span> <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(optText) }} />
                          {isStudentAnswer && isCorrect && <span className="ml-2 text-success">✓</span>}
                          {isStudentAnswer && !isCorrect && <span className="ml-2 text-destructive">✗</span>}
                          {!isStudentAnswer && isCorrect && <span className="ml-2 text-yellow-600">( সঠিক )</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Student Answer for Written Questions (non-CQ-parent, non-MCQ) */}
                {!isMultipleChoice && !hasCQSubquestions && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-muted-foreground mb-1">শিক্ষার্থীর উত্তর:</div>
                    <div className="bg-card p-3 rounded border">
                      <div dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(studentAnswer || "কোনো উত্তর দেওয়া হয়নি") }} />
                    </div>
                  </div>
                )}

                {/* Uploaded files — shown for all question types whenever the student attached files */}
                {questionAttachments.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <span>📎</span>
                      <span>শিক্ষার্থীর আপলোড করা ফাইল ({questionAttachments.reduce((n, g) => n + g.items.length, 0)} টি)</span>
                    </div>
                    <div className="space-y-2">
                      {questionAttachments.map(({ key, items }) =>
                        items.map((att: any, idx: number) => {
                          const displayAtt = getFeedbackOrOriginalAttachment(key, idx, att);
                          const isImage = displayAtt.type && displayAtt.type.startsWith('image/');
                          const isPdf = displayAtt.type === 'application/pdf' || (displayAtt.name && displayAtt.name.toLowerCase().endsWith('.pdf'));
                          return (
                            <div key={`${key}-${idx}`} className="p-2 border rounded bg-card">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium flex items-center gap-2">
                                  <span>{displayAtt.name || `File ${idx + 1}`}</span>
                                  {displayAtt?.edited && <span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success border border-success/25">Edited</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                  {isImage && (
                                    <button type="button" onClick={() => startEditAttachment(key, idx, att)} className="text-sm text-amber-600 hover:underline">Edit</button>
                                  )}
                                  <button type="button" onClick={() => openAttachment(displayAtt)} className="text-sm text-primary hover:underline">Open</button>
                                  <a href={displayAtt.dataUrl || displayAtt.url} download={displayAtt.name || `attachment-${idx + 1}`} className="text-sm text-muted-foreground hover:underline">Download</a>
                                </div>
                              </div>
                              {isImage && (displayAtt.dataUrl || displayAtt.url) ? (
                                <div className="mt-2">
                                  <img src={displayAtt.dataUrl || displayAtt.url} alt={displayAtt.name || `File ${idx + 1}`} className="max-h-64 w-auto rounded border" />
                                </div>
                              ) : isPdf ? (
                                <div className="mt-1">
                                  <p className="text-xs text-muted-foreground">PDF ফাইল — Open বা Download করুন।</p>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Explanation removed from admin answer sheet modal as requested */}

                {/* Grading inputs or display for CQ subQuestions */}
                {hasCQSubquestions && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Sub-question marks</div>
                    <div className="space-y-2">
                      {question.subQuestions.map((sq:any, sidx:number) => {
                        const qid = sq._id || `${question._id}-${sidx}`;
                        const assigned = gradingMarks[qid] ?? (selectedResult?.cqMarks ? Number(selectedResult.cqMarks[qid]) || 0 : 0);
                        if (selectedResult?.pendingEvaluation || isEditingGrade) {
                          return (
                            <div key={qid} className="flex items-center gap-3">
                              <div className="w-8 font-semibold">{sq.label || (['ক','খ','গ','ঘ'][sidx] || `${sidx+1}.`)}</div>
                              <div className="flex-1"><span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.questionTextBn || sq.questionTextEn || sq.questionText || sq.questionBn) }} /></div>
                              <Input
                                type="number"
                                value={gradingMarks[qid] ?? assigned}
                                onChange={(e:any) => setGradingMarks(prev => ({ ...prev, [qid]: Number(e.target.value) }))}
                                className="w-28 text-sm"
                                min={0}
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={qid} className="flex items-center gap-3">
                            <div className="w-8 font-semibold">{sq.label || (['ক','খ','গ','ঘ'][sidx] || `${sidx+1}.`)}</div>
                            <div className="flex-1"><span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.questionTextBn || sq.questionTextEn || sq.questionText || sq.questionBn) }} /></div>
                            <div className="flex items-center space-x-2">
                              <div className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/30 font-semibold text-sm">{assigned}</div>
                              <div className="text-xs text-muted-foreground">marks</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => { setAnswerSheetOpen(false); setIsEditingGrade(false); }}>
            বন্ধ করুন
          </Button>

          {/* If result is pending, show Save Grades */}
          {selectedResult?.pendingEvaluation && (
            <Button onClick={async () => {
              try {
                const payload: any = { cqMarks: gradingMarks, feedbackAttachments: sanitizeFeedbackAttachments(feedbackAttachments) };
                if (gradeTotalMarks != null) payload.totalMarks = gradeTotalMarks;
                if (gradeScore != null) payload.score = gradeScore;
                const resp = await examResultsAPI.grade(selectedResult._id, payload);
                const updated = resp.data || resp;
                toast({ title: 'Grades saved', description: 'Result has been evaluated' });
                setSelectedResult(updated);
                setExamResults(prev => prev.map(r => r._id === updated._id ? updated : r));
                // clear local caches that may hold stale examResults
                try {
                  Object.keys(localStorage).forEach(k => {
                    if (k === 'examResults' || k.startsWith('examResults_') || k.startsWith('lastExamResult_') || k === 'lastExamResult') {
                      localStorage.removeItem(k);
                    }
                  });
                } catch (e) { /* ignore */ }
                setAnswerSheetOpen(false);
              } catch (err) {
                console.error('Failed to save grades', err);
                toast({ title: 'Failed to save grades', description: (err as Error)?.message || 'Request failed', variant: 'destructive' });
              }
            }}>Save Grades</Button>
          )}

          {/* If already graded, allow toggling edit mode */}
          {selectedResult && !selectedResult?.pendingEvaluation && (
            <>
              {!isEditingGrade ? (
                <Button onClick={() => setIsEditingGrade(true)} type="button">Edit Grades</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => { setIsEditingGrade(false); setGradingMarks(selectedResult.cqMarks || {}); setGradeScore(selectedResult.score ?? undefined); }} type="button">Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      const payload: any = { cqMarks: gradingMarks, feedbackAttachments: sanitizeFeedbackAttachments(feedbackAttachments) };
                      if (gradeTotalMarks != null) payload.totalMarks = gradeTotalMarks;
                      if (gradeScore != null) payload.score = gradeScore;
                      const resp = await examResultsAPI.grade(selectedResult._id, payload);
                      const updated = resp.data || resp;
                      toast({ title: 'Grades updated', description: 'Result grades updated' });
                      setSelectedResult(updated);
                      setExamResults(prev => prev.map(r => r._id === updated._id ? updated : r));
                      // clear local caches that may hold stale examResults
                      try {
                        Object.keys(localStorage).forEach(k => {
                          if (k === 'examResults' || k.startsWith('examResults_') || k.startsWith('lastExamResult_') || k === 'lastExamResult') {
                            localStorage.removeItem(k);
                          }
                        });
                      } catch (e) { /* ignore */ }
                      setIsEditingGrade(false);
                    } catch (err) {
                      console.error('Failed to update grades', err);
                      toast({ title: 'Failed to update grades', description: (err as Error)?.message || 'Request failed', variant: 'destructive' });
                    }
                  }}>Save Changes</Button>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Attachment Image Editor */}
    <Dialog open={imageEditorOpen} onOpenChange={(v) => { if (!isSavingFeedbackImage) setImageEditorOpen(v); }}>
      <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Feedback Image</DialogTitle>
          <DialogDescription>
            Draw annotations on the student image. Save it, then click Save Grades / Save Changes to publish for student feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-3 rounded border bg-muted/20">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <input
                type="color"
                value={brushColor}
                disabled={isEraser}
                onChange={(e) => setBrushColor(e.target.value)}
                className="h-9 w-12 p-1 border rounded bg-card"
              />
            </div>

            <div className="flex items-center gap-2">
              <Brush className="h-4 w-4" />
              <Input
                type="range"
                min={1}
                max={24}
                step={1}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value) || 1)}
                className="w-40"
              />
              <span className="text-xs text-muted-foreground w-8">{brushSize}</span>
            </div>

            <Button type="button" variant={isEraser ? 'default' : 'outline'} onClick={() => setIsEraser((v) => !v)}>
              <Eraser className="h-4 w-4 mr-1" />
              {isEraser ? 'Eraser On' : 'Eraser'}
            </Button>

            <Button type="button" variant="outline" onClick={clearEditedCanvas}>Reset</Button>
          </div>

          <div className="overflow-auto border rounded bg-white">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto cursor-crosshair"
              onMouseDown={(e: any) => {
                isDrawingRef.current = true;
                const { x, y } = getCanvasCoords(e);
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.beginPath();
                ctx.moveTo(x, y);
              }}
              onMouseMove={(e: any) => {
                if (!isDrawingRef.current) return;
                const { x, y } = getCanvasCoords(e);
                drawPoint(x, y);
              }}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImageEditorOpen(false)} disabled={isSavingFeedbackImage}>Cancel</Button>
            <Button onClick={saveEditedAttachment} disabled={isSavingFeedbackImage}>
              {isSavingFeedbackImage ? 'Saving...' : 'Save Edited Image'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ExamCreationModal;
