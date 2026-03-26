import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { examsAPI } from "@/services/api";
import { cn, renderRichOrMathHtml } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  FileDown,
  FileType,
  Grip,
  Heading,
  Printer,
  Save,
  Settings2,
  Shuffle,
  Type,
} from "lucide-react";

type BuilderMode = "preview" | "edit" | "print";
type PageSize = "A4" | "Letter";
type ColumnLayout = 1 | 2;
type FontStyle = "noto" | "kalpurush" | "serif";
type HeaderMode = "manual" | "smart";
type NumberingStyle = "numeric" | "topic";
type OptionLabelStyle = "alpha" | "paren-alpha" | "bangla";

type ExportSections = {
  questions: boolean;
  answerSheet: boolean;
  sheet: boolean;
  suggestion: boolean;
};

type OfflineStyle = {
  formattingEnabled: boolean;
  fontSize: number;
  fontStyle: FontStyle;
  lineSpacing: number;
  margin: number;
  showQuestion: boolean;
  showStem: boolean;
  showMarks: boolean;
  showOptionLabel: boolean;
  showAnswer: boolean;
  showSolution: boolean;
  showExplanation: boolean;
  headerEnabled: boolean;
  headerMode: HeaderMode;
  headerText: string;
  footerEnabled: boolean;
  footerText: string;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  logoDataUrl: string;
  pageSize: PageSize;
  questionColumns: ColumnLayout;
  optionColumns: ColumnLayout;
  numberingStyle: NumberingStyle;
  optionLabelStyle: OptionLabelStyle;
  questionGap: number;
  columnGap: number;
  pageNumberEnabled: boolean;
  pageBorderEnabled: boolean;
  columnDividerEnabled: boolean;
  showPaperInfo: boolean;
  paperTitle: string;
  paperSubject: string;
  paperTime: string;
  paperFullMarks: string;
  paperQuestionCount: string;
  showInstituteName: boolean;
  instituteName: string;
  showProgram: boolean;
  programName: string;
  showClassExam: boolean;
  classExam: string;
  showSubjectSyllabus: boolean;
  subjectSyllabus: string;
  showSubjectCode: boolean;
  subjectCode: string;
  showSetCode: boolean;
  setCode: string;
  showQuestionType: boolean;
  questionTypeText: string;
  showAddNew: boolean;
  addNewText: string;
  showNote: boolean;
  noteText: string;
  showExtraInfo: boolean;
  extraInfoText: string;
  showStudentName: boolean;
  studentNameLabel: string;
  showStudentRoll: boolean;
  studentRollLabel: string;
  showHeaderCodeBox: boolean;
  headerCodeText: string;
};

const DEFAULT_STYLE: OfflineStyle = {
  formattingEnabled: true,
  fontSize: 16,
  fontStyle: "noto",
  lineSpacing: 1.7,
  margin: 18,
  showQuestion: true,
  showStem: true,
  showMarks: false,
  showOptionLabel: true,
  showAnswer: false,
  showSolution: true,
  showExplanation: false,
  headerEnabled: true,
  headerMode: "manual",
  headerText: "",
  footerEnabled: false,
  footerText: "",
  watermarkEnabled: false,
  watermarkText: "LearnSmart Prep",
  watermarkOpacity: 0.12,
  logoDataUrl: "",
  pageSize: "A4",
  questionColumns: 1,
  optionColumns: 2,
  numberingStyle: "numeric",
  optionLabelStyle: "bangla",
  questionGap: 12,
  columnGap: 10,
  pageNumberEnabled: false,
  pageBorderEnabled: false,
  columnDividerEnabled: true,
  showPaperInfo: true,
  paperTitle: "",
  paperSubject: "",
  paperTime: "",
  paperFullMarks: "",
  paperQuestionCount: "",
  showInstituteName: true,
  instituteName: "",
  showProgram: true,
  programName: "",
  showClassExam: true,
  classExam: "",
  showSubjectSyllabus: true,
  subjectSyllabus: "",
  showSubjectCode: true,
  subjectCode: "",
  showSetCode: true,
  setCode: "",
  showQuestionType: true,
  questionTypeText: "বহুনির্বাচনী",
  showAddNew: true,
  addNewText: "ব্যাচ | তারিখ | মোবাইল নাম্বার | ঠিকানা | ব্রাঞ্চ ইত্যাদি",
  showNote: true,
  noteText: "বিশেষ দ্রষ্টব্যঃ সঠিক উত্তরের বৃত্তটি বল পয়েন্ট কলম দ্বারা সম্পূর্ণ ভরাট কর। প্রতিটি প্রশ্নের মান ১।",
  showExtraInfo: true,
  extraInfoText: "প্রশ্নপত্রে কোনো প্রকার দাগ/চিহ্ন দেয়া যাবে না।",
  showStudentName: true,
  studentNameLabel: "পরীক্ষার্থীর নামঃ",
  showStudentRoll: true,
  studentRollLabel: "রোলঃ",
  showHeaderCodeBox: true,
  headerCodeText: "বিষয় কোড: ১০১\nসেট কোড: নমুনা",
};

const englishLabels = ["a", "b", "c", "d", "e", "f", "g", "h"];
const banglaLabels = ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ"];
const DEFAULT_SECTIONS: ExportSections = {
  questions: true,
  answerSheet: false,
  sheet: false,
  suggestion: false,
};

const AdminOfflineExamBuilder = () => {
  const { examId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [style, setStyle] = useState<OfflineStyle>(DEFAULT_STYLE);
  const [sections, setSections] = useState<ExportSections>(DEFAULT_SECTIONS);
  const [manualBreaks, setManualBreaks] = useState<number[]>([]);
  const [styleEditorOpen, setStyleEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState("text");
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const modeParam = (searchParams.get("mode") || "edit").toLowerCase();
  const mode: BuilderMode = modeParam === "preview" || modeParam === "print" ? modeParam : "edit";
  const isEditMode = mode === "edit";
  const isPrintMode = mode === "print";

  const triggerPrintPreview = () => {
    document.body.classList.add("print-offline-preview-only");

    const cleanup = () => {
      document.body.classList.remove("print-offline-preview-only");
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.print();

    // Fallback for environments where afterprint may not fire reliably.
    window.setTimeout(cleanup, 1500);
  };

  const handlePrintPreview = () => {
    setStyleEditorOpen(false);
    triggerPrintPreview();
  };

  useEffect(() => {
    if (!examId) return;

    const styleKey = `offlineExamStyle_${examId}`;
    const breakKey = `offlineExamBreaks_${examId}`;
    const sectionKey = `offlineExamSections_${examId}`;

    try {
      const storedStyle = localStorage.getItem(styleKey);
      if (storedStyle) {
        const parsed = JSON.parse(storedStyle);
        setStyle({ ...DEFAULT_STYLE, ...parsed });
      }

      const storedBreaks = localStorage.getItem(breakKey);
      if (storedBreaks) {
        const parsedBreaks = JSON.parse(storedBreaks);
        if (Array.isArray(parsedBreaks)) {
          setManualBreaks(parsedBreaks.filter((n) => Number.isFinite(n)).map((n) => Number(n)));
        }
      }

      const storedSections = localStorage.getItem(sectionKey);
      if (storedSections) {
        const parsed = JSON.parse(storedSections);
        setSections({ ...DEFAULT_SECTIONS, ...parsed });
      }
    } catch {
      // Ignore malformed localStorage data.
    }
  }, [examId]);

  useEffect(() => {
    if (!examId) return;

    const loadExam = async () => {
      try {
        setLoading(true);
        const response = await examsAPI.get(examId);
        setExam(response?.data || null);
      } catch (err) {
        console.error("Failed to load offline exam:", err);
        toast({
          title: "Failed to load exam",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId, toast]);

  useEffect(() => {
    if (mode !== "print") return;

    const timer = window.setTimeout(() => {
      triggerPrintPreview();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [mode]);

  const questions = useMemo(() => {
    if (!exam?.questionIds || !Array.isArray(exam.questionIds)) return [];
    return exam.questionIds;
  }, [exam]);

  useEffect(() => {
    if (!questions.length) {
      setQuestionOrder([]);
      return;
    }
    setQuestionOrder(questions.map((_: any, idx: number) => idx));
  }, [questions]);

  const orderedQuestions = useMemo(() => {
    if (!questions.length) return [];
    if (!questionOrder.length) return questions;
    return questionOrder
      .map((idx) => questions[idx])
      .filter(Boolean);
  }, [questions, questionOrder]);

  const paperSizeStyle = useMemo(() => {
    if (style.pageSize === "Letter") {
      return { width: "216mm", minHeight: "279mm" };
    }
    return { width: "210mm", minHeight: "297mm" };
  }, [style.pageSize]);

  const saveDraftStyle = () => {
    if (!examId) return;

    const styleKey = `offlineExamStyle_${examId}`;
    const breakKey = `offlineExamBreaks_${examId}`;
    const sectionKey = `offlineExamSections_${examId}`;

    try {
      localStorage.setItem(styleKey, JSON.stringify(style));
      localStorage.setItem(breakKey, JSON.stringify(manualBreaks));
      localStorage.setItem(sectionKey, JSON.stringify(sections));
      toast({ title: "Offline paper style saved" });
    } catch {
      toast({
        title: "Failed to save style",
        description: "Browser storage is unavailable.",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setStyle((prev) => ({ ...prev, logoDataUrl: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddHeader = () => {
    setStyleEditorOpen(true);
    setStyle((prev) => ({ ...prev, headerText: prev.headerText || "Exam Header" }));
  };

  const handleAddFooter = () => {
    setStyleEditorOpen(true);
    setStyle((prev) => ({ ...prev, footerText: prev.footerText || "Generated by LearnSmart Prep" }));
  };

  const handleAddPageBreak = () => {
    if (!orderedQuestions.length) return;
    const value = window.prompt("Insert page break before question number (2 or more):", "2");
    if (!value) return;
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 2 || parsed > orderedQuestions.length) {
      toast({
        title: "Invalid question number",
        description: `Use a number between 2 and ${orderedQuestions.length}`,
        variant: "destructive",
      });
      return;
    }

    setManualBreaks((prev) => Array.from(new Set([...prev, parsed])).sort((a, b) => a - b));
  };

  const handleShuffleSet = () => {
    setQuestionOrder((prev) => {
      const source = prev.length ? [...prev] : orderedQuestions.map((_: any, idx: number) => idx);
      for (let i = source.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = source[i];
        source[i] = source[j];
        source[j] = temp;
      }
      return source;
    });
    toast({ title: "New question set generated" });
  };

  const updateSection = (key: keyof ExportSections, value: boolean) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  };

  const getQuestionMarks = (questionId: string) => {
    const marks = (exam?.questionMarks || []).find((m: any) => String(m?.questionId?._id || m?.questionId) === String(questionId));
    return Number(marks?.marks ?? 0);
  };

  const getOptionLabel = (idx: number) => {
    if (style.optionLabelStyle === "bangla") return `${banglaLabels[idx] || idx + 1}.`;
    if (style.optionLabelStyle === "paren-alpha") return `(${englishLabels[idx] || idx + 1})`;
    return `${englishLabels[idx] || idx + 1})`;
  };

  const getQuestionNumber = (index: number) => {
    if (style.numberingStyle === "topic") {
      const tag = (exam?.subjectId?.name || "Q").toString().slice(0, 3).toUpperCase();
      return `${tag}-${index + 1}`;
    }
    return `${index + 1}`;
  };

  const getFontFamily = () => {
    if (style.fontStyle === "kalpurush") return "'Noto Sans Bengali', 'Siyam Rupali', sans-serif";
    if (style.fontStyle === "serif") return "'Times New Roman', 'Noto Serif Bengali', serif";
    return "'Noto Sans Bengali', 'Inter', sans-serif";
  };

  const getHeaderText = () => {
    if (!style.headerEnabled) return "";
    if (style.headerMode === "manual") return style.headerText;

    const line1 = exam?.classId?.name ? `${exam.classId.name}${exam?.groupId?.name ? ` - ${exam.groupId.name}` : ""}` : "";
    const line2 = exam?.title || "Model Test";
    const line3 = exam?.subjectId?.name || "";
    return [line1, line2, line3].filter(Boolean).join("\n");
  };

  const resolvePaperInfo = () => {
    return {
      title: style.paperTitle.trim() || exam?.title || "Untitled Exam",
      subject: style.paperSubject.trim() || exam?.subjectId?.name || "N/A",
      time: style.paperTime.trim() || `${exam?.duration || 0} min`,
      fullMarks: style.paperFullMarks.trim() || String(exam?.totalMarks || 0),
      questions: style.paperQuestionCount.trim() || String(orderedQuestions.length),
      instituteName: style.instituteName.trim() || exam?.schoolName || "",
      programName: style.programName.trim() || exam?.title || "",
      classExam: style.classExam.trim() || exam?.classId?.name || "",
      subjectSyllabus: style.subjectSyllabus.trim() || exam?.subjectId?.name || "",
      subjectCode: style.subjectCode.trim() || "",
      setCode: style.setCode.trim() || "",
      questionTypeText: style.questionTypeText.trim() || "বহুনির্বাচনী",
      addNewText: style.addNewText.trim() || "",
      noteText: style.noteText.trim() || "",
      extraInfoText: style.extraInfoText.trim() || "",
      studentNameLabel: style.studentNameLabel.trim() || "পরীক্ষার্থীর নামঃ",
      studentRollLabel: style.studentRollLabel.trim() || "রোলঃ",
      headerCodeText: style.headerCodeText.trim() || "",
    };
  };

  const paperInfo = resolvePaperInfo();

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;

    try {
      setIsExportingPdf(true);
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = (html2pdfModule as any).default;

      const filename = `${(exam?.title || "offline-exam").replace(/\s+/g, "-").toLowerCase()}.pdf`;

      await html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            windowWidth: previewRef.current.scrollWidth,
          },
          jsPDF: {
            unit: "mm",
            format: style.pageSize === "A4" ? "a4" : "letter",
            orientation: "portrait",
          },
          pagebreak: {
            mode: ["css", "legacy"],
            before: ".offline-page-break",
            avoid: [".offline-question-block", ".offline-two-column-layout"],
          },
        })
        .from(previewRef.current)
        .save();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast({
        title: "Failed to download PDF",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const renderOptions = (options: any[]) => {
    if (!Array.isArray(options) || options.length === 0) return null;

    return (
      <div
        className={cn("mt-3 grid gap-2", style.optionColumns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}
      >
        {options.map((opt: any, idx: number) => (
          <div key={idx} className="rounded-sm border border-transparent px-2 py-1 text-[0.95em]">
            {style.showOptionLabel ? <span className="mr-2 font-medium">{getOptionLabel(idx)}</span> : null}
            <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(opt?.text || opt || "") }} />
          </div>
        ))}
      </div>
    );
  };

  const renderAnswer = (answer: any) => {
    if (!style.showAnswer || answer === undefined || answer === null || answer === "") return null;
    return <div className="mt-2 text-[0.85em] italic text-gray-600">Answer: {String(answer)}</div>;
  };

  const renderSolution = (solution: any) => {
    if (!style.showSolution || !solution) return null;
    return (
      <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[0.84em] text-emerald-800">
        <strong>Solution:</strong> <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(String(solution)) }} />
      </div>
    );
  };

  const renderExplanation = (explanation: any) => {
    if (!style.showExplanation || !explanation) return null;
    return (
      <div className="mt-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[0.84em] text-blue-800">
        <strong>Explanation:</strong> <span dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(String(explanation)) }} />
      </div>
    );
  };

  const renderQuestion = (question: any, index: number) => {
    const hasSubQuestions = Array.isArray(question.subQuestions) && question.subQuestions.length > 0;
    const marks = getQuestionMarks(question._id || question.id);

    return (
      <div
        key={question._id || `${index}-${question.questionTextBn || question.questionText || "q"}`}
        className="offline-question-block break-inside-avoid"
        style={{ marginBottom: `${style.questionGap}px` }}
      >
        <div className="flex items-start">
          <div className="shrink-0 whitespace-nowrap pr-2 font-semibold leading-tight">{getQuestionNumber(index)}.</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              {style.showQuestion ? (
                <div
                  className="flex-1 whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{
                    __html: renderRichOrMathHtml(question.questionTextBn || question.questionTextEn || question.questionText || question.questionBn || ""),
                  }}
                />
              ) : (
                <div className="text-xs text-muted-foreground">Question text hidden</div>
              )}
              {style.showMarks ? <div className="text-xs font-semibold text-gray-600">[{marks || question.marks || 0}]</div> : null}
            </div>

            {style.showStem && question.parentPassage ? (
              <div className="mt-2 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[0.9em] whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(question.parentPassage) }} />
            ) : null}

            {question.image ? <img src={question.image} alt="Question" className="mt-3 max-h-56 w-auto rounded-sm object-contain" /> : null}

            {hasSubQuestions ? (
              <div className="mt-3 space-y-3">
                {question.subQuestions.map((sq: any, sqIndex: number) => (
                  <div key={`${question._id || index}-${sqIndex}`} className="break-inside-avoid pl-2">
                    <div className="flex gap-2">
                      <div className="w-8 shrink-0">{sq.label || getOptionLabel(sqIndex).replace(/\)|\./g, "")}</div>
                      <div className="min-w-0 flex-1">
                        <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(sq.questionTextBn || sq.questionTextEn || sq.questionText || sq.questionBn || "") }} />
                        {sq.image ? <img src={sq.image} alt="Sub-question" className="mt-2 max-h-52 w-auto rounded-sm object-contain" /> : null}
                        {renderOptions(sq.options || [])}
                        {renderAnswer(sq.correctAnswer || sq.answer)}
                        {renderSolution(sq.solution)}
                        {renderExplanation(sq.explanation)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {renderOptions(question.options || [])}
                {renderAnswer(question.correctAnswer || question.answer)}
                {renderSolution(question.solution)}
                {renderExplanation(question.explanation)}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Interleaved split: left=[Q1,Q3,Q5...], right=[Q2,Q4,Q6...]
  // This ensures page-wise reading order is sequential (Q1 Q2 / Q3 Q4 / Q5 Q6)
  // rather than the first-half/second-half split which breaks serial across PDF pages.
  const leftColumnQuestions = orderedQuestions.filter((_: any, i: number) => i % 2 === 0);
  const rightColumnQuestions = orderedQuestions.filter((_: any, i: number) => i % 2 === 1);

  if (loading) {
    return <BeautifulLoader className="py-16" message="Loading offline exam builder..." />;
  }

  if (!exam) {
    return <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">Exam not found.</div>;
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="offline-toolbar rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-xl font-bold">Offline Exam Builder</h1>
          <span className="rounded-md bg-muted px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">Mode: {mode}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setStyleEditorOpen(true)} disabled={!isEditMode}><Settings2 className="mr-1 h-4 w-4" />Edit Style</Button>
          <Button variant="outline" onClick={handleAddHeader} disabled={!isEditMode}><Heading className="mr-1 h-4 w-4" />Add Header</Button>
          <Button variant="outline" onClick={handleAddFooter} disabled={!isEditMode}><FileType className="mr-1 h-4 w-4" />Add Footer</Button>
          <Button variant="outline" onClick={() => setStyle((prev) => ({ ...prev, showAnswer: !prev.showAnswer }))}><Type className="mr-1 h-4 w-4" />Toggle Answer</Button>
          <Button variant="outline" onClick={handlePrintPreview}><Printer className="mr-1 h-4 w-4" />Print</Button>
          <Button variant="outline" onClick={handleDownloadPdf}><FileDown className="mr-1 h-4 w-4" />Download PDF</Button>
          <Button onClick={saveDraftStyle} disabled={!isEditMode}><Save className="mr-1 h-4 w-4" />Save</Button>
        </div>
      </div>

      <div className={isPrintMode ? "offline-paper-area print-only" : "offline-paper-area"}>
        <div
          ref={previewRef}
          className={cn(
            "offline-paper-frame mx-auto bg-white text-black",
            isExportingPdf ? "shadow-none" : "shadow-lg",
          )}
          style={{
            ...paperSizeStyle,
            padding: `${style.margin}mm`,
            fontSize: `${style.formattingEnabled ? style.fontSize : DEFAULT_STYLE.fontSize}px`,
            lineHeight: style.formattingEnabled ? style.lineSpacing : DEFAULT_STYLE.lineSpacing,
            fontFamily: style.formattingEnabled ? getFontFamily() : getFontFamily(),
            border: style.pageBorderEnabled ? "1px solid #cbd5e1" : "none",
            position: "relative",
          }}
        >
          {style.watermarkEnabled ? (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
              style={{ opacity: style.watermarkOpacity }}
            >
              <div className="-rotate-12 text-5xl font-bold tracking-widest text-slate-400">{style.watermarkText || "WATERMARK"}</div>
            </div>
          ) : null}

          <div className="mb-6">
            {style.logoDataUrl ? <img src={style.logoDataUrl} alt="Logo" className="mx-auto mb-3 max-h-16 w-auto object-contain" /> : null}

            <div className="relative text-center">
              <div className="mx-auto w-full max-w-3xl space-y-1">
                {style.showInstituteName && paperInfo.instituteName ? <div className="text-[1.25rem] font-bold leading-tight">{paperInfo.instituteName}</div> : null}
                {style.showProgram && paperInfo.programName ? <div className="text-[1.05rem] font-semibold leading-tight">{paperInfo.programName}</div> : null}
                {style.showClassExam && paperInfo.classExam ? <div className="text-[1rem] font-semibold leading-tight">{paperInfo.classExam}</div> : null}
                {style.showSubjectSyllabus && paperInfo.subjectSyllabus ? <div className="text-[0.98rem] font-semibold leading-tight">{paperInfo.subjectSyllabus}</div> : null}
                {style.showQuestionType && paperInfo.questionTypeText ? <div className="mt-1 text-[0.98rem] font-semibold leading-tight">{paperInfo.questionTypeText}</div> : null}
              </div>

              {style.showHeaderCodeBox && paperInfo.headerCodeText ? (
                <div className="absolute right-0 top-0 whitespace-pre-wrap rounded-md border border-slate-400 px-3 py-2 text-left text-[0.9rem] leading-tight">
                  {paperInfo.headerCodeText}
                </div>
              ) : null}
            </div>

            {style.showPaperInfo ? (
              <>
                <div className="mt-3 flex items-center justify-between text-[1.2rem] font-semibold leading-none">
                  <span>সময়ঃ {paperInfo.time}</span>
                  <span>পূর্ণমানঃ {paperInfo.fullMarks}</span>
                </div>
                <div className="mt-2 h-px w-full bg-gray-500" />
              </>
            ) : null}

            {style.showAddNew && paperInfo.addNewText ? (
              <div className="mt-2 text-center">
                <span className="inline-block rounded-lg border border-slate-400 px-3 py-1 text-[1rem] leading-tight">{paperInfo.addNewText}</span>
              </div>
            ) : null}

            {style.showNote && paperInfo.noteText ? <div className="mt-3 text-center text-[1.02rem] font-semibold leading-tight">{paperInfo.noteText}</div> : null}
            {style.showExtraInfo && paperInfo.extraInfoText ? <div className="mt-1 text-center text-[0.98rem] leading-tight">{paperInfo.extraInfoText}</div> : null}

            {(style.showStudentName || style.showStudentRoll) ? (
              <div className="mt-3 flex items-center justify-between text-[1.02rem] font-semibold leading-none">
                <div className="flex min-w-0 flex-1 items-end gap-2 pr-4">
                  {style.showStudentName ? <span className="whitespace-nowrap">{paperInfo.studentNameLabel}</span> : null}
                  {style.showStudentName ? <span className="h-[1px] flex-1 border-b border-dashed border-slate-400" /> : null}
                </div>
                <div className="flex min-w-0 flex-1 items-end gap-2 pl-4">
                  {style.showStudentRoll ? <span className="whitespace-nowrap">{paperInfo.studentRollLabel}</span> : null}
                  {style.showStudentRoll ? <span className="h-[1px] flex-1 border-b border-dashed border-slate-400" /> : null}
                </div>
              </div>
            ) : null}

            {getHeaderText() ? <div className="mt-3 whitespace-pre-wrap text-sm font-medium text-slate-600">{getHeaderText()}</div> : null}
          </div>

          <Separator className="mb-5 bg-gray-300" />

          {exam.instructions ? (
            <div className="mb-5 break-inside-avoid rounded-sm border border-gray-200 bg-gray-50 p-3">
              <h3 className="mb-2 text-base font-semibold">Instructions</h3>
              <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(exam.instructions) }} />
            </div>
          ) : null}

          {sections.questions ? (
            style.questionColumns === 2 ? (
              <div
                className="offline-two-column-layout grid grid-cols-2"
                style={{ columnGap: `${style.columnGap}mm` }}
              >
                <div
                  className={cn(
                    "pr-2",
                    style.columnDividerEnabled ? "border-r border-dashed border-gray-300" : "",
                  )}
                >
                  {leftColumnQuestions.map((q: any, idx: number) => {
                    // Interleaved: left column has Q1, Q3, Q5... → serial = idx*2+1
                    const qNo = idx * 2 + 1;
                    return (
                      <div key={`offline-left-${q._id || qNo}`}>
                        {manualBreaks.includes(qNo) ? <div className="offline-page-break" /> : null}
                        {renderQuestion(q, qNo - 1)}
                      </div>
                    );
                  })}
                </div>
                <div className="pl-2">
                  {rightColumnQuestions.map((q: any, idx: number) => {
                    // Interleaved: right column has Q2, Q4, Q6... → serial = idx*2+2
                    const qNo = idx * 2 + 2;
                    return (
                      <div key={`offline-right-${q._id || qNo}`}>
                        {manualBreaks.includes(qNo) ? <div className="offline-page-break" /> : null}
                        {renderQuestion(q, qNo - 1)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                {orderedQuestions.map((q: any, index: number) => (
                  <div key={`offline-q-${q._id || index}`}>
                    {manualBreaks.includes(index + 1) ? <div className="offline-page-break" /> : null}
                    {renderQuestion(q, index)}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-500">Questions section is hidden by project selection.</div>
          )}

          {sections.answerSheet ? (
            <div className="mt-8 break-inside-avoid rounded border border-gray-300 p-3">
              <div className="mb-2 text-sm font-semibold">Answer Sheet</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {orderedQuestions.map((_: any, i: number) => (
                  <div key={`ans-${i}`} className="rounded border border-gray-200 px-2 py-1">Q{i + 1}: ________</div>
                ))}
              </div>
            </div>
          ) : null}

          {sections.suggestion ? (
            <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Suggestion section enabled. Add guidelines for students before final publishing.
            </div>
          ) : null}

          {sections.sheet ? (
            <div className="mt-6 rounded border border-slate-200 p-3 text-sm text-slate-700">
              Extra sheet note: students can use additional pages for rough work.
            </div>
          ) : null}

          {(style.footerEnabled || style.pageNumberEnabled) ? (
            <div className="mt-8 border-t border-gray-300 pt-3 text-xs text-gray-700">
              {style.footerEnabled ? <div className="text-center">{style.footerText}</div> : null}
              {style.pageNumberEnabled ? <div className="mt-1 text-center">Page 1</div> : null}
            </div>
          ) : null}
        </div>
      </div>

      <Sheet open={styleEditorOpen} onOpenChange={setStyleEditorOpen}>
        <SheetContent className="w-[470px] overflow-y-auto bg-slate-50 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Style Editor</SheetTitle>
          </SheetHeader>

          <div className="mt-4 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Text Formatting</div>
              <Switch checked={style.formattingEnabled} onCheckedChange={(checked) => setStyle((prev) => ({ ...prev, formattingEnabled: checked }))} />
            </div>

            <Tabs value={editorTab} onValueChange={setEditorTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="question">Question</TabsTrigger>
                <TabsTrigger value="page">Page</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 pt-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label className="text-xs">Font Size</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setStyle((prev) => ({ ...prev, fontSize: Math.max(10, prev.fontSize - 1) }))}>-</Button>
                    <Input type="number" min={10} max={26} value={style.fontSize} onChange={(e) => setStyle((prev) => ({ ...prev, fontSize: Number(e.target.value || 16) }))} />
                    <Button variant="outline" size="sm" onClick={() => setStyle((prev) => ({ ...prev, fontSize: Math.min(26, prev.fontSize + 1) }))}>+</Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label className="text-xs">Font Style</Label>
                  <ToggleGroup
                    type="single"
                    value={style.fontStyle}
                    onValueChange={(v) => v && setStyle((prev) => ({ ...prev, fontStyle: v as FontStyle }))}
                    className="mt-2 grid grid-cols-3"
                  >
                    <ToggleGroupItem value="noto" className="text-xs">Noto</ToggleGroupItem>
                    <ToggleGroupItem value="kalpurush" className="text-xs">Kalpurush</ToggleGroupItem>
                    <ToggleGroupItem value="serif" className="text-xs">Serif</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label className="text-xs">Line Spacing</Label>
                  <Input type="number" min={1} max={3} step={0.1} value={style.lineSpacing} onChange={(e) => setStyle((prev) => ({ ...prev, lineSpacing: Number(e.target.value || 1.7) }))} className="mt-2" />
                </div>
              </TabsContent>

              <TabsContent value="branding" className="space-y-4 pt-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="mb-2 text-sm font-semibold">Exam Header Fields</div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                      <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showInstituteName} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showInstituteName: Boolean(v) }))} />Institute Name</label>
                      <Input value={style.instituteName} onChange={(e) => setStyle((prev) => ({ ...prev, instituteName: e.target.value }))} placeholder="Institute name" />
                    </div>

                    <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                      <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showProgram} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showProgram: Boolean(v) }))} />Program</label>
                      <Input value={style.programName} onChange={(e) => setStyle((prev) => ({ ...prev, programName: e.target.value }))} placeholder="Program / exam name" />
                    </div>

                    <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                      <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showClassExam} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showClassExam: Boolean(v) }))} />Class/Exam</label>
                      <Input value={style.classExam} onChange={(e) => setStyle((prev) => ({ ...prev, classExam: e.target.value }))} placeholder="Class / exam" />
                    </div>

                    <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                      <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showSubjectSyllabus} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showSubjectSyllabus: Boolean(v) }))} />Subject/Syllabus</label>
                      <Input value={style.subjectSyllabus} onChange={(e) => setStyle((prev) => ({ ...prev, subjectSyllabus: e.target.value }))} placeholder="Subject / syllabus" />
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showSubjectCode} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showSubjectCode: Boolean(v) }))} />Subject Code</label>
                        <Input value={style.subjectCode} onChange={(e) => setStyle((prev) => ({ ...prev, subjectCode: e.target.value }))} placeholder="Subject code" />
                      </div>
                      <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showSetCode} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showSetCode: Boolean(v) }))} />Set Code</label>
                        <Input value={style.setCode} onChange={(e) => setStyle((prev) => ({ ...prev, setCode: e.target.value }))} placeholder="Set code" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showQuestionType} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showQuestionType: Boolean(v) }))} />Question Type</label>
                        <Input value={style.questionTypeText} onChange={(e) => setStyle((prev) => ({ ...prev, questionTypeText: e.target.value }))} placeholder="Question type" />
                      </div>
                      <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showHeaderCodeBox} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showHeaderCodeBox: Boolean(v) }))} />Code Box</label>
                        <Textarea value={style.headerCodeText} onChange={(e) => setStyle((prev) => ({ ...prev, headerCodeText: e.target.value }))} rows={2} placeholder="বিষয় কোড: ১০১\nসেট কোড: নমুনা" />
                      </div>
                    </div>

                    <div className="grid grid-cols-[auto,1fr] items-start gap-2">
                      <label className="flex items-center gap-2 text-sm pt-2"><Checkbox checked={style.showAddNew} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showAddNew: Boolean(v) }))} />Add New</label>
                      <Input value={style.addNewText} onChange={(e) => setStyle((prev) => ({ ...prev, addNewText: e.target.value }))} placeholder="ব্যাচ | তারিখ | মোবাইল নাম্বার | ঠিকানা | ব্রাঞ্চ ইত্যাদি" />
                    </div>

                    <div className="grid grid-cols-[auto,1fr] items-start gap-2">
                      <label className="flex items-center gap-2 text-sm pt-2"><Checkbox checked={style.showNote} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showNote: Boolean(v) }))} />Note</label>
                      <Textarea value={style.noteText} onChange={(e) => setStyle((prev) => ({ ...prev, noteText: e.target.value }))} rows={2} placeholder="বিশেষ দ্রষ্টব্য..." />
                    </div>

                    <div className="grid grid-cols-[auto,1fr] items-start gap-2">
                      <label className="flex items-center gap-2 text-sm pt-2"><Checkbox checked={style.showExtraInfo} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showExtraInfo: Boolean(v) }))} />Extra Info</label>
                      <Input value={style.extraInfoText} onChange={(e) => setStyle((prev) => ({ ...prev, extraInfoText: e.target.value }))} placeholder="প্রশ্নপত্রে কোনো প্রকার দাগ/চিহ্ন দেয়া যাবে না।" />
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showStudentName} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showStudentName: Boolean(v) }))} />Student Name</label>
                        <Input value={style.studentNameLabel} onChange={(e) => setStyle((prev) => ({ ...prev, studentNameLabel: e.target.value }))} placeholder="পরীক্ষার্থীর নামঃ" />
                      </div>
                      <div className="grid grid-cols-[auto,1fr] items-center gap-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={style.showStudentRoll} onCheckedChange={(v) => setStyle((prev) => ({ ...prev, showStudentRoll: Boolean(v) }))} />Student Roll</label>
                        <Input value={style.studentRollLabel} onChange={(e) => setStyle((prev) => ({ ...prev, studentRollLabel: e.target.value }))} placeholder="রোলঃ" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Label>Watermark</Label>
                    <Switch checked={style.watermarkEnabled} onCheckedChange={(checked) => setStyle((prev) => ({ ...prev, watermarkEnabled: checked }))} />
                  </div>
                  <Input value={style.watermarkText} onChange={(e) => setStyle((prev) => ({ ...prev, watermarkText: e.target.value }))} placeholder="Watermark text" />
                  <div className="mt-2 text-xs text-muted-foreground">Opacity</div>
                  <Input type="range" min={0.05} max={0.35} step={0.01} value={style.watermarkOpacity} onChange={(e) => setStyle((prev) => ({ ...prev, watermarkOpacity: Number(e.target.value || 0.12) }))} />
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Label>Footer</Label>
                    <Switch checked={style.footerEnabled} onCheckedChange={(checked) => setStyle((prev) => ({ ...prev, footerEnabled: checked }))} />
                  </div>
                  <Input value={style.footerText} onChange={(e) => setStyle((prev) => ({ ...prev, footerText: e.target.value }))} placeholder="Footer text" />
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label htmlFor="logoUpload">Logo Upload</Label>
                  <Input id="logoUpload" type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)} className="mt-2" />
                  {style.logoDataUrl ? <Button variant="ghost" className="mt-2 h-8 px-2 text-xs" onClick={() => setStyle((prev) => ({ ...prev, logoDataUrl: "" }))}>Remove logo</Button> : null}
                </div>
              </TabsContent>

              <TabsContent value="question" className="space-y-4 pt-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="mb-2 font-semibold">Project Select</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <label className="flex items-center gap-2"><Checkbox checked={sections.questions} onCheckedChange={(v) => updateSection("questions", Boolean(v))} /> Questions</label>
                    <label className="flex items-center gap-2"><Checkbox checked={sections.answerSheet} onCheckedChange={(v) => updateSection("answerSheet", Boolean(v))} /> Answer Sheet</label>
                    <label className="flex items-center gap-2"><Checkbox checked={sections.sheet} onCheckedChange={(v) => updateSection("sheet", Boolean(v))} /> Sheet Note</label>
                    <label className="flex items-center gap-2"><Checkbox checked={sections.suggestion} onCheckedChange={(v) => updateSection("suggestion", Boolean(v))} /> Suggestion</label>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Button variant="outline" className="w-full" onClick={handleShuffleSet}><Shuffle className="mr-2 h-4 w-4" />Create New Question Set</Button>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between rounded border border-border px-2 py-1"><span>Show Question</span><Switch checked={style.showQuestion} onCheckedChange={(v) => setStyle((p) => ({ ...p, showQuestion: v }))} /></div>
                    <div className="flex items-center justify-between rounded border border-border px-2 py-1"><span>Show Stem</span><Switch checked={style.showStem} onCheckedChange={(v) => setStyle((p) => ({ ...p, showStem: v }))} /></div>
                    <div className="flex items-center justify-between rounded border border-border px-2 py-1"><span>Marks</span><Switch checked={style.showMarks} onCheckedChange={(v) => setStyle((p) => ({ ...p, showMarks: v }))} /></div>
                    <div className="flex items-center justify-between rounded border border-border px-2 py-1"><span>Answers</span><Switch checked={style.showAnswer} onCheckedChange={(v) => setStyle((p) => ({ ...p, showAnswer: v }))} /></div>
                    <div className="flex items-center justify-between rounded border border-border px-2 py-1"><span>Solutions</span><Switch checked={style.showSolution} onCheckedChange={(v) => setStyle((p) => ({ ...p, showSolution: v }))} /></div>
                    <div className="flex items-center justify-between rounded border border-border px-2 py-1"><span>Explanation</span><Switch checked={style.showExplanation} onCheckedChange={(v) => setStyle((p) => ({ ...p, showExplanation: v }))} /></div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label className="text-xs">Numbering Type</Label>
                  <ToggleGroup type="single" value={style.numberingStyle} onValueChange={(v) => v && setStyle((p) => ({ ...p, numberingStyle: v as NumberingStyle }))} className="mt-2 grid grid-cols-2">
                    <ToggleGroupItem value="topic">Topic-based</ToggleGroupItem>
                    <ToggleGroupItem value="numeric">Question-based</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label className="text-xs">Option Style</Label>
                  <ToggleGroup type="single" value={style.optionLabelStyle} onValueChange={(v) => v && setStyle((p) => ({ ...p, optionLabelStyle: v as OptionLabelStyle }))} className="mt-2 grid grid-cols-3">
                    <ToggleGroupItem value="alpha">a)</ToggleGroupItem>
                    <ToggleGroupItem value="paren-alpha">(a)</ToggleGroupItem>
                    <ToggleGroupItem value="bangla">ক.</ToggleGroupItem>
                  </ToggleGroup>
                  <div className="mt-3 flex items-center justify-between rounded border border-border px-2 py-1 text-sm">
                    <span>Show option label</span>
                    <Switch checked={style.showOptionLabel} onCheckedChange={(v) => setStyle((p) => ({ ...p, showOptionLabel: v }))} />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="mb-1 text-xs">Question Gap</div>
                  <div className="flex items-center gap-2">
                    <Grip className="h-4 w-4 text-muted-foreground" />
                    <Input type="range" min={6} max={30} value={style.questionGap} onChange={(e) => setStyle((p) => ({ ...p, questionGap: Number(e.target.value || 12) }))} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="page" className="space-y-4 pt-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label className="text-xs">Page Size</Label>
                  <RadioGroup value={style.pageSize} onValueChange={(v) => setStyle((p) => ({ ...p, pageSize: v as PageSize }))} className="mt-2 grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded border border-border p-2"><RadioGroupItem value="A4" id="page-a4" /><span>A4</span></label>
                    <label className="flex items-center gap-2 rounded border border-border p-2"><RadioGroupItem value="Letter" id="page-letter" /><span>Letter</span></label>
                  </RadioGroup>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label className="text-xs">Margin (mm)</Label>
                  <Input type="number" min={5} max={35} value={style.margin} onChange={(e) => setStyle((p) => ({ ...p, margin: Number(e.target.value || 18) }))} className="mt-2" />
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label className="text-xs">Question Columns</Label>
                  <ToggleGroup type="single" value={String(style.questionColumns)} onValueChange={(v) => v && setStyle((p) => ({ ...p, questionColumns: Number(v) as ColumnLayout }))} className="mt-2 grid grid-cols-2">
                    <ToggleGroupItem value="1">1</ToggleGroupItem>
                    <ToggleGroupItem value="2">2</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <Label className="text-xs">Option Columns</Label>
                  <ToggleGroup type="single" value={String(style.optionColumns)} onValueChange={(v) => v && setStyle((p) => ({ ...p, optionColumns: Number(v) as ColumnLayout }))} className="mt-2 grid grid-cols-2">
                    <ToggleGroupItem value="1">1</ToggleGroupItem>
                    <ToggleGroupItem value="2">2</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="mb-1 text-xs">Column Gap</div>
                  <Input type="range" min={6} max={18} value={style.columnGap} onChange={(e) => setStyle((p) => ({ ...p, columnGap: Number(e.target.value || 10) }))} />
                </div>

                <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <div className="flex items-center justify-between rounded border border-border px-2 py-1"><span>Page Number</span><Switch checked={style.pageNumberEnabled} onCheckedChange={(v) => setStyle((p) => ({ ...p, pageNumberEnabled: v }))} /></div>
                  <div className="flex items-center justify-between rounded border border-border px-2 py-1"><span>Page Border</span><Switch checked={style.pageBorderEnabled} onCheckedChange={(v) => setStyle((p) => ({ ...p, pageBorderEnabled: v }))} /></div>
                  <div className="flex items-center justify-between rounded border border-border px-2 py-1"><span>Column Divider</span><Switch checked={style.columnDividerEnabled} onCheckedChange={(v) => setStyle((p) => ({ ...p, columnDividerEnabled: v }))} /></div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminOfflineExamBuilder;
