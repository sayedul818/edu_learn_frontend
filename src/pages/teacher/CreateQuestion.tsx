import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, CheckCircle, Upload } from "lucide-react";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { useToast } from "@/hooks/use-toast";
import { classesAPI, groupsAPI, subjectsAPI, chaptersAPI, topicsAPI, questionsAPI, examTypesAPI } from "@/services/api";
import Papa from "papaparse";

type CsvValidationIssue = {
  rowIndex: number;
  errors: string[];
  raw: Record<string, string>;
};

type CsvParseSummary = {
  valid: any[];
  invalid: CsvValidationIssue[];
};

const CreateQuestion = () => {
  const { toast } = useToast();
  
  // Database data
  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"form" | "json" | "csv">("form"); // Toggle between form, JSON and CSV mode
  const [jsonInput, setJsonInput] = useState("");
  const [jsonHierarchy, setJsonHierarchy] = useState({
    classId: "",
    groupId: "",
    subjectId: "",
    chapterId: "",
    topicId: "",
  });
  const [jsonQuestions, setJsonQuestions] = useState<any[]>([]);
  const [jsonPreview, setJsonPreview] = useState(false);
  const [csvInput, setCsvInput] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [csvValidQuestions, setCsvValidQuestions] = useState<any[]>([]);
  const [csvInvalidRows, setCsvInvalidRows] = useState<CsvValidationIssue[]>([]);
  const [csvPreview, setCsvPreview] = useState(false);

  const [form, setForm] = useState({
    classId: "",
    groupId: "",
    subjectId: "",
    chapterId: "",
    topicId: "",
    examTypeId: "",
    questionTextEn: "",
    questionTextBn: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    difficulty: "medium",
    questionType: "MCQ",
    marks: 1,
    boardYear: "",
    tags: [] as string[],
  });

  // Load database hierarchy on mount
  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const [classesRes, groupsRes, subjectsRes, chaptersRes, topicsRes, examTypesRes] = await Promise.all([
        classesAPI.getAll(),
        groupsAPI.getAll(),
        subjectsAPI.getAll(),
        chaptersAPI.getAll(),
        topicsAPI.getAll(),
        examTypesAPI.getAll()
      ]);

      setClasses(classesRes.data || []);
      setGroups(groupsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setChapters(chaptersRes.data || []);
      setTopics(topicsRes.data || []);
      setExamTypes(examTypesRes.data || []);

      // Auto-select first class
      if (classesRes.data?.length > 0) {
        setForm((f) => ({ ...f, classId: classesRes.data[0]._id }));
      }

      // Check URL params
      const q = new URLSearchParams(window.location.search);
      const qs = q.get("subject");
      const qc = q.get("chapter");
      if (qs) {
        const subj = (subjectsRes.data || []).find((s: any) => s._id === qs);
        if (subj) {
          setForm((f) => ({ ...f, subjectId: qs, classId: subj.classId, chapterId: qc || f.chapterId }));
        }
      }
    } catch (err) {
      console.error("Error loading hierarchy:", err);
      toast({ title: "Failed to load hierarchy", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateOption = (idx: number, val: string) => {
    const opts = [...form.options];
    opts[idx] = val;
    setForm({ ...form, options: opts });
  };

  // JSON Mode: Parse and validate JSON
  const parseJsonQuestions = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.questions || !Array.isArray(data.questions)) {
        toast({ title: "Invalid JSON format. Expected 'questions' array.", variant: "destructive" });
        return;
      }
      setJsonQuestions(data.questions);
      setJsonPreview(true);
      toast({ title: `Loaded ${data.questions.length} questions`, variant: "default" });
    } catch (err: any) {
      toast({ title: "Invalid JSON", description: err.message, variant: "destructive" });
    }
  };

  const getCsvCell = (row: Record<string, string>, aliases: string[]) => {
    const rowEntries = Object.entries(row || {}).map(([k, v]) => [k.trim().toLowerCase(), v] as const);
    for (const alias of aliases) {
      const found = rowEntries.find(([key]) => key === alias.trim().toLowerCase());
      if (found && found[1] != null && String(found[1]).trim() !== "") return String(found[1]).trim();
    }
    return "";
  };

  const parseJsonArrayField = (value: string) => {
    if (!value || !value.trim()) return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const detectCsvDelimiter = (text: string) => {
    const firstLine = (text || "").split(/\r?\n/).find((line) => line.trim() !== "") || "";
    return firstLine.includes("\t") ? "\t" : undefined;
  };

  const parseTabSeparatedRows = (csvText: string) => {
    const lines = (csvText || "")
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.trim() !== "");

    if (lines.length === 0) return [] as Record<string, string>[];

    const headers = lines[0].split("\t").map((header) => header.trim());

    return lines.slice(1).map((line) => {
      const values = line.split("\t");
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = (values[index] ?? "").trim();
      });

      return row;
    });
  };

  const normalizeDifficulty = (val: string) => {
    const normalized = (val || "").trim().toLowerCase();
    if (normalized === "easy" || normalized === "medium" || normalized === "hard") return normalized;
    return "medium";
  };

  const normalizeQuestionType = (val: string, hasSubQuestions = false) => {
    const normalized = (val || "").trim().toUpperCase();
    if (normalized === "CQ" || normalized === "MCQ") return normalized;
    return hasSubQuestions ? "CQ" : "MCQ";
  };

  const splitTags = (val: string) => (val || "").split(/[|,]/).map((x) => x.trim()).filter(Boolean);

  const parseCsvQuestions = (csvText: string): CsvParseSummary => {
    const delimiter = detectCsvDelimiter(csvText);
    const parsedRows = delimiter
      ? parseTabSeparatedRows(csvText)
      : (Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        }).data || []);

    const valid: any[] = [];
    const invalid: CsvValidationIssue[] = [];

    parsedRows.forEach((row, idx) => {
      const rowIndex = idx + 2;
      const errors: string[] = [];

      const questionTextEn = getCsvCell(row, ["questionTextEn", "questionEn", "questionText", "question", "passageTextEn", "passage_text_en", "passage", "passageText"]);
      const questionTextBn = getCsvCell(row, ["questionTextBn", "questionBn", "question_bangla", "questionTextBangla", "passageTextBn", "passage_text_bn"]);
      const explanation = getCsvCell(row, ["explanation", "solution", "note"]);
      const boardYear = getCsvCell(row, ["boardYear", "board_year", "board year", "year", "board"]);
      const difficulty = normalizeDifficulty(getCsvCell(row, ["difficulty", "level"]));
      const tags = splitTags(getCsvCell(row, ["tags", "tag"]));
      const subQuestionsRaw = getCsvCell(row, ["subQuestionsJson", "subQuestions", "cqSubQuestions", "blanks"]);
      const parsedSubQuestions = parseJsonArrayField(subQuestionsRaw);
      const questionTypeRaw = getCsvCell(row, ["questionType", "type", "qType"]);
      const normalizedQuestionType = normalizeQuestionType(questionTypeRaw, parsedSubQuestions.length > 0);

      const basePayload: any = {
        questionType: normalizedQuestionType,
        questionTextEn,
        questionTextBn,
        explanation,
        difficulty,
        boardYear,
        tags,
      };

      if (normalizedQuestionType === "MCQ") {
        const optionColumns = [
          getCsvCell(row, ["optionA", "A", "option1"]),
          getCsvCell(row, ["optionB", "B", "option2"]),
          getCsvCell(row, ["optionC", "C", "option3"]),
          getCsvCell(row, ["optionD", "D", "option4"]),
          getCsvCell(row, ["optionE", "E", "option5"]),
          getCsvCell(row, ["optionF", "F", "option6"]),
        ].filter(Boolean);

        const packedOptions = getCsvCell(row, ["options", "optionText", "option_texts"])
          .split("|")
          .map((x) => x.trim())
          .filter(Boolean);

        const optionTexts = optionColumns.length > 0 ? optionColumns : packedOptions;
        const correctOption = getCsvCell(row, ["correctOption", "correct", "correct_letter"]).toUpperCase();
        const correctAnswer = getCsvCell(row, ["correctAnswer", "answer", "correct_text"]);

        if (!questionTextEn && !questionTextBn) errors.push("Missing question text (English or Bengali)");
        if (optionTexts.length < 2) errors.push("MCQ must have at least 2 options");
        if (!correctOption && !correctAnswer) errors.push("Missing correctOption or correctAnswer");

        const normalizedOptions = optionTexts.map((text, optionIdx) => {
          const letter = String.fromCharCode(65 + optionIdx);
          const isCorrectByLetter = !!correctOption && letter === correctOption;
          const isCorrectByText = !!correctAnswer && text.trim() === correctAnswer.trim();
          return {
            text,
            isCorrect: isCorrectByLetter || isCorrectByText,
          };
        });

        if (!normalizedOptions.some((o) => o.isCorrect)) {
          errors.push("No option matched as correct answer");
        }

        if (errors.length > 0) {
          invalid.push({ rowIndex, errors, raw: row });
          return;
        }

        valid.push({
          ...basePayload,
          options: normalizedOptions,
        });
        return;
      }

      if (!questionTextEn && !questionTextBn && parsedSubQuestions.length === 0) {
        errors.push("CQ needs passage text or subQuestionsJson");
      }

      if (errors.length > 0) {
        invalid.push({ rowIndex, errors, raw: row });
        return;
      }

      valid.push({
        ...basePayload,
        subQuestions: parsedSubQuestions,
      });
    });

    return { valid, invalid };
  };

  const handleCsvParse = (text: string) => {
    if (!text.trim()) {
      toast({ title: "CSV is empty", variant: "destructive" });
      return;
    }
    const { valid, invalid } = parseCsvQuestions(text);
    setCsvValidQuestions(valid);
    setCsvInvalidRows(invalid);
    setCsvPreview(true);
    toast({
      title: "CSV parsed",
      description: `Valid: ${valid.length}, Invalid: ${invalid.length}`,
    });
  };

  const handleCsvFile = async (file?: File | null) => {
    if (!file) return;
    setCsvFileName(file.name);
    const text = await file.text();
    setCsvInput(text);
    handleCsvParse(text);
  };

  const submitCsvQuestions = async () => {
    if (!jsonHierarchy.classId || !jsonHierarchy.groupId || !jsonHierarchy.subjectId || !jsonHierarchy.chapterId) {
      toast({ title: "Please select hierarchy (topic optional)", variant: "destructive" });
      return;
    }

    if (csvValidQuestions.length === 0) {
      toast({ title: "No valid rows to import", variant: "destructive" });
      return;
    }

    const questionsToSubmit = csvValidQuestions.map((q) => ({
      ...q,
      subjectId: jsonHierarchy.subjectId,
      chapterId: jsonHierarchy.chapterId,
      ...(jsonHierarchy.topicId && jsonHierarchy.topicId !== "" ? { topicId: jsonHierarchy.topicId } : {}),
    }));

    try {
      setSubmitting(true);
      const response = await questionsAPI.bulkImport(questionsToSubmit, { continueOnError: true, source: "csv" });
      const importedCount = response.importedCount ?? response.count ?? response.data?.length ?? 0;
      const rejectedCount = response.rejectedCount ?? 0;

      toast({
        title: "CSV import completed",
        description: `Imported: ${importedCount}, Rejected: ${rejectedCount}`,
      });
    } catch (err: any) {
      toast({
        title: "CSV import failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadInvalidCsvReport = () => {
    if (csvInvalidRows.length === 0) {
      toast({ title: "No invalid rows to export" });
      return;
    }
    const blob = new Blob([JSON.stringify(csvInvalidRows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "csv-invalid-rows-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Mode: Get filtered options based on hierarchy
  const getAvailableGroups = () => groups.filter((g) => (g.classId?._id || g.classId) === jsonHierarchy.classId);
  const getAvailableSubjects = () => subjects.filter((s) => (s.groupId?._id || s.groupId) === jsonHierarchy.groupId);
  const getAvailableChapters = () => chapters.filter((c) => (c.subjectId?._id || c.subjectId) === jsonHierarchy.subjectId);
  const getAvailableTopics = () => topics.filter((t) => (t.chapterId?._id || t.chapterId) === jsonHierarchy.chapterId);

  // JSON Mode: Submit bulk questions
  const submitJsonQuestions = async () => {
    if (!jsonHierarchy.classId || !jsonHierarchy.groupId || !jsonHierarchy.subjectId || !jsonHierarchy.chapterId) {
      toast({ title: "Please select hierarchy (topic optional)", variant: "destructive" });
      return;
    }

    if (jsonQuestions.length === 0) {
      toast({ title: "No questions to submit", variant: "destructive" });
      return;
    }

    // Add hierarchy to all questions
    const questionsToSubmit = jsonQuestions.map((q) => ({
      ...q,
      subjectId: jsonHierarchy.subjectId,
      chapterId: jsonHierarchy.chapterId,
      ...(jsonHierarchy.topicId && jsonHierarchy.topicId !== "" ? { topicId: jsonHierarchy.topicId } : {}),
    }));

    try {
      setSubmitting(true);
      const response = await questionsAPI.bulkImport(questionsToSubmit);
      toast({ title: `Created ${response.data?.length || 0} questions successfully!`, variant: "default" });
      setJsonInput("");
      setJsonQuestions([]);
      setJsonPreview(false);
      setJsonHierarchy({ classId: "", groupId: "", subjectId: "", chapterId: "", topicId: "" });
    } catch (err: any) {
      toast({ title: "Failed to create questions", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter helpers using database data
  const availableGroups = groups.filter(g => (g.classId?._id || g.classId) === form.classId);
  const availableSubjects = subjects.filter(s => (s.groupId?._id || s.groupId) === form.groupId);
  const availableChapters = chapters.filter(ch => (ch.subjectId?._id || ch.subjectId) === form.subjectId);
  const availableTopics = topics.filter(t => (t.chapterId?._id || t.chapterId) === form.chapterId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields (topic is optional)
    if (!form.subjectId || !form.chapterId || !form.correctAnswer || !form.questionType) {
      toast({ title: "Missing fields", description: "Please fill required fields: subject/chapter/type/correct answer", variant: "destructive" });
      return;
    }

    if (!form.questionTextEn && !form.questionTextBn) {
      toast({ title: "Missing question text", description: "Please provide question text in English or Bengali", variant: "destructive" });
      return;
    }

    // Validate at least 2 options
    const nonEmptyOptions = form.options.filter(Boolean);
    if (nonEmptyOptions.length < 2) {
      toast({ title: "Invalid options", description: "Question must have at least 2 options", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Convert options array to backend format: array of {text, isCorrect}
      const formattedOptions = nonEmptyOptions.map(optText => ({
        text: optText,
        isCorrect: optText === form.correctAnswer
      }));

      const payload = {
        subjectId: form.subjectId,
        chapterId: form.chapterId,
        // include topic only if provided
        ...(form.topicId && form.topicId !== "" ? { topicId: form.topicId } : {}),
        ...(form.examTypeId && form.examTypeId !== "" ? { examTypeId: form.examTypeId } : {}),
        ...(form.boardYear && form.boardYear !== "" ? { boardYear: form.boardYear } : {}),
        questionTextEn: form.questionTextEn,
        questionTextBn: form.questionTextBn || "",
        options: formattedOptions,
        explanation: form.explanation || "",
        difficulty: form.difficulty || "medium",
        questionType: form.questionType || "MCQ",
        marks: form.marks ?? 1,
        tags: form.tags || [],
      };

      const response = await questionsAPI.create(payload);
      console.log('✅ Question created:', response.data);
      
      toast({ title: "Question created successfully!", description: `ID: ${response.data._id}` });
      
      // Reset form
      setForm({ classId: form.classId, groupId: "", subjectId: "", chapterId: "", topicId: "", examTypeId: "", questionTextEn: "", questionTextBn: "", options: ["", "", "", ""], correctAnswer: "", explanation: "", difficulty: "medium", questionType: "MCQ", marks: 1, boardYear: "", tags: [] });
    } catch (err) {
      console.error('❌ Error creating question:', err);
      toast({ 
        title: "Failed to create question", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-12">
        <BeautifulLoader message="Loading hierarchy data..." className="max-w-md mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Create Question</h1>
        <p className="text-muted-foreground mt-1">Add a new question to the bank</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 border-b">
        <Button variant={mode === "form" ? "default" : "ghost"} onClick={() => setMode("form")} className="rounded-none">
          Form Mode
        </Button>
        <Button variant={mode === "json" ? "default" : "ghost"} onClick={() => setMode("json")} className="rounded-none">
          JSON Mode (Bulk)
        </Button>
        <Button variant={mode === "csv" ? "default" : "ghost"} onClick={() => setMode("csv")} className="rounded-none">
          CSV Mode (Bulk)
        </Button>
      </div>

      {mode === "form" ? (
        // FORM MODE
        <Card>
          <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Class</Label>
                <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, groupId: "", subjectId: "", chapterId: "" })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select Class</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Group</Label>
                <select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value, subjectId: "", chapterId: "" })} disabled={!form.classId} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50">
                  <option value="">Select Group</option>
                  {availableGroups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject *</Label>
                <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value, chapterId: "" })} disabled={!form.groupId}>
                  <option value="">Select Subject</option>
                  {availableSubjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Chapter *</Label>
                <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.chapterId} onChange={(e) => setForm({ ...form, chapterId: e.target.value, topicId: "" })} disabled={!form.subjectId}>
                  <option value="">Select Chapter</option>
                  {availableChapters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Topic (optional)</Label>
                <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value || undefined })} disabled={!form.chapterId}>
                  <option value="">Select Topic</option>
                  {availableTopics.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Difficulty *</Label>
                <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Question Type *</Label>
                <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value, marks: e.target.value === 'MCQ' ? 1 : form.marks })}>
                  <option value="MCQ">MCQ</option>
                  <option value="CQ">CQ</option>
                  <option value="গাণিতিক">গাণিতিক (Mathematical)</option>
                  <option value="জ্ঞানমূলক">জ্ঞানমূলক (Knowledge-based)</option>
                  <option value="অনুধাবনমূলক">অনুধাবনমূলক (Comprehension)</option>
                  <option value="ছোট লিখিত/সংক্ষিপ্ত প্রশ্ন">ছোট লিখিত/সংক্ষিপ্ত প্রশ্ন (Short written)</option>
                  <option value="বড় লিখিত/রচনামূলক প্রশ্ন">বড় লিখিত/রচনামূলক প্রশ্ন (Long written)</option>
                </select>
              </div>
              <div>
                <Label>Exam Type (Optional)</Label>
                <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.examTypeId} onChange={(e) => setForm({ ...form, examTypeId: e.target.value })}>
                  <option value="">-- Select Exam Type --</option>
                  {examTypes.map((et) => <option key={et._id} value={et._id}>{et.examCategory} - {et.examName} - {et.year}</option>)}
                </select>
              </div>
              <div>
                <Label>Board Year (Optional)</Label>
                <Input type="text" className="mt-1" value={form.boardYear} onChange={(e) => setForm({ ...form, boardYear: e.target.value })} placeholder="e.g. 2024, 2024 S1, JSC 2024" />
              </div>
            </div>

            <div>
              <Label>Question Text (English) (optional)</Label>
              <textarea className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={form.questionTextEn} onChange={(e) => setForm({ ...form, questionTextEn: e.target.value })} placeholder="Enter your question in English..." />
            </div>

            <div>
              <Label>Question Text (Bengali) (optional)</Label>
              <textarea className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px]" value={form.questionTextBn} onChange={(e) => setForm({ ...form, questionTextBn: e.target.value })} placeholder="বাংলায় প্রশ্ন লিখুন..." />
              <p className="text-xs text-muted-foreground mt-1">Provide at least one: English or Bengali question text.</p>
            </div>

            <div>
              <Label>Options (minimum 2 required) *</Label>
              <div className="space-y-2 mt-1">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-6">{String.fromCharCode(65 + i)}.</span>
                    <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                    <button type="button" onClick={() => setForm({ ...form, correctAnswer: opt })} className={`p-2 rounded-lg ${form.correctAnswer === opt && opt ? "text-success bg-success/10" : "text-muted-foreground hover:text-success"}`}>
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Click ✓ to mark the correct answer</p>
            </div>

            <div>
              <Label>Correct Answer *</Label>
              <Input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} placeholder="Enter the correct answer text" />
            </div>

            <div>
              <Label>Explanation (optional)</Label>
              <textarea className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px]" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Explain why this is the correct answer..." />
            </div>

            <div>
              <Label>Marks</Label>
              <Input type="number" min={0} value={form.marks ?? 1} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" size="lg" disabled={submitting}>
                <PlusCircle className="h-4 w-4 mr-2" /> {submitting ? "Creating..." : "Create Question"}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => {
                setForm({ classId: form.classId, groupId: "", subjectId: "", chapterId: "", topicId: "", examTypeId: "", questionTextEn: "", questionTextBn: "", options: ["", "", "", ""], correctAnswer: "", explanation: "", difficulty: "medium", questionType: "MCQ", marks: 1, tags: [] });
              }}>Reset</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      ) : mode === "json" ? (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import Questions via JSON</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold">Select Hierarchy (applies to all questions)</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Class *</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.classId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, classId: e.target.value, groupId: "", subjectId: "", chapterId: "", topicId: "" });
                  }}>
                    <option value="">-- Select Class --</option>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Group *</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.groupId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, groupId: e.target.value, subjectId: "", chapterId: "", topicId: "" });
                  }} disabled={!jsonHierarchy.classId}>
                    <option value="">-- Select Group --</option>
                    {getAvailableGroups().map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Subject *</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.subjectId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, subjectId: e.target.value, chapterId: "", topicId: "" });
                  }} disabled={!jsonHierarchy.groupId}>
                    <option value="">-- Select Subject --</option>
                    {getAvailableSubjects().map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Chapter *</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.chapterId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, chapterId: e.target.value, topicId: "" });
                  }} disabled={!jsonHierarchy.subjectId}>
                    <option value="">-- Select Chapter --</option>
                    {getAvailableChapters().map((ch) => <option key={ch._id} value={ch._id}>{ch.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Topic (optional)</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.topicId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, topicId: e.target.value || undefined });
                  }} disabled={!jsonHierarchy.chapterId}>
                    <option value="">-- No topic --</option>
                    {getAvailableTopics().map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <Label>Paste JSON Data</Label>
              <textarea
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono min-h-[200px]"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste your JSON here, e.g.:
{
  "questions": [
    {
      "questionTextEn": "What is 2+2?",
      "options": [
        { "text": "4", "isCorrect": true },
        { "text": "5", "isCorrect": false }
      ]
    }
  ]
}'
              />
            </div>

            <Button onClick={() => parseJsonQuestions(jsonInput)} className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Parse JSON
            </Button>

            {jsonPreview && jsonQuestions.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-3 border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold">✓ Preview: {jsonQuestions.length} questions ready to import</p>

                <div className="max-h-[300px] overflow-y-auto space-y-2 text-xs">
                  {jsonQuestions.map((q, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-2 rounded border border-green-300 dark:border-green-700">
                      <p className="font-semibold truncate">{i + 1}. {q.questionTextEn || q.questionTextBn || "Untitled question"}</p>
                      <p className="text-muted-foreground">Options: {q.options?.length || 0} | Type: {q.questionType || "MCQ"} | Difficulty: {q.difficulty || "medium"}</p>
                    </div>
                  ))}
                </div>

                <Button onClick={() => submitJsonQuestions()} className="w-full" disabled={submitting}>
                  <CheckCircle className="h-4 w-4 mr-2" /> {submitting ? "Importing..." : `Import ${jsonQuestions.length} Questions`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import Questions via CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold">Select Hierarchy (applies to all questions)</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Class *</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.classId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, classId: e.target.value, groupId: "", subjectId: "", chapterId: "", topicId: "" });
                  }}>
                    <option value="">-- Select Class --</option>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Group *</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.groupId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, groupId: e.target.value, subjectId: "", chapterId: "", topicId: "" });
                  }} disabled={!jsonHierarchy.classId}>
                    <option value="">-- Select Group --</option>
                    {getAvailableGroups().map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Subject *</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.subjectId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, subjectId: e.target.value, chapterId: "", topicId: "" });
                  }} disabled={!jsonHierarchy.groupId}>
                    <option value="">-- Select Subject --</option>
                    {getAvailableSubjects().map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Chapter *</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.chapterId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, chapterId: e.target.value, topicId: "" });
                  }} disabled={!jsonHierarchy.subjectId}>
                    <option value="">-- Select Chapter --</option>
                    {getAvailableChapters().map((ch) => <option key={ch._id} value={ch._id}>{ch.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Topic (optional)</Label>
                  <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={jsonHierarchy.topicId} onChange={(e) => {
                    setJsonHierarchy({ ...jsonHierarchy, topicId: e.target.value || undefined });
                  }} disabled={!jsonHierarchy.chapterId}>
                    <option value="">-- No topic --</option>
                    {getAvailableTopics().map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <Input type="file" accept=".csv,text/csv" onChange={(e) => handleCsvFile(e.target.files?.[0] || null)} />
              {csvFileName && <p className="text-xs text-muted-foreground">Loaded file: {csvFileName}</p>}
            </div>

            <div>
              <Label>Or paste CSV text</Label>
              <textarea
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono min-h-[220px]"
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder={'Example headers:\nquestionType,questionTextEn,questionTextBn,optionA,optionB,optionC,optionD,correctOption,correctAnswer,difficulty,boardYear,tags,subQuestionsJson\n\nNotes:\n- MCQ row: provide options + correctOption (A/B/C...) or correctAnswer text\n- CQ row: provide passage (questionTextEn/Bn) or subQuestionsJson'}
              />
            </div>

            <Button onClick={() => handleCsvParse(csvInput)} className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Parse CSV
            </Button>

            {csvPreview && (
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-semibold">Valid rows: {csvValidQuestions.length}</p>
                  <p className="text-sm text-muted-foreground">Invalid rows: {csvInvalidRows.length}</p>
                </div>

                {csvInvalidRows.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-destructive">Rejected rows</p>
                      <Button type="button" variant="outline" size="sm" onClick={downloadInvalidCsvReport}>Download Error Report</Button>
                    </div>
                    <div className="max-h-[180px] overflow-y-auto text-xs space-y-2">
                      {csvInvalidRows.slice(0, 30).map((row) => (
                        <div key={row.rowIndex} className="bg-background rounded border p-2">
                          <p className="font-semibold">Row {row.rowIndex}</p>
                          <p className="text-muted-foreground">{row.errors.join("; ")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {csvValidQuestions.length > 0 && (
                  <div className="max-h-[280px] overflow-y-auto space-y-2 text-xs">
                    {csvValidQuestions.slice(0, 100).map((q, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 p-2 rounded border border-green-300 dark:border-green-700">
                        <p className="font-semibold truncate">{i + 1}. {q.questionTextEn || q.questionTextBn || "Untitled question"}</p>
                        <p className="text-muted-foreground">Type: {q.questionType} | Difficulty: {q.difficulty || "medium"} | Board: {q.boardYear || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={() => submitCsvQuestions()} className="w-full" disabled={submitting || csvValidQuestions.length === 0}>
                  <CheckCircle className="h-4 w-4 mr-2" /> {submitting ? "Importing..." : `Import ${csvValidQuestions.length} Valid Questions`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateQuestion;
