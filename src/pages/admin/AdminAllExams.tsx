import { useEffect, useMemo, useState } from "react";
import { examsAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { parseQuestionWithSubPoints } from "@/lib/utils";
import ExamCreationModal from "@/components/admin/ExamCreationModal";

type ExamQuestion = {
  _id: string;
  questionTextBn?: string;
  questionTextEn?: string;
  questionText?: string;
  options?: Array<{ text?: string } | string>;
  explanation?: string;
};

type Exam = {
  _id: string;
  title: string;
  duration: number;
  totalMarks: number;
  status?: "draft" | "live";
  questionIds?: ExamQuestion[];
  createdAt?: string;
  publishedAt?: string;
  description?: string;
  instructions?: string;
  warnings?: string;
  syllabus?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  marksPerQuestion?: number;
  negativeMarking?: boolean;
  negativeMarkValue?: number;
  questionNumbering?: string;
  questionPresentation?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  allowMultipleAttempts?: boolean;
  allowAnswerChange?: boolean;
  resultVisibility?: string;
  answerVisibility?: string;
  autoSubmit?: boolean;
};

const AdminAllExams = () => {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"live" | "previous">("live");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await examsAPI.getAll();
      setExams(response.data || []);
    } catch (err) {
      console.error("Failed to load exams", err);
      toast({
        title: "Failed to load exams",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const filtered = useMemo(() => {
    let list = exams.slice();
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(s));
    }
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (sortBy === "newest") list.sort((a,b)=> (b.createdAt||"").localeCompare(a.createdAt||""));
    if (sortBy === "oldest") list.sort((a,b)=> (a.createdAt||"").localeCompare(b.createdAt||""));
    if (sortBy === "title") list.sort((a,b)=> (a.title||"").localeCompare(b.title||""));
    return list;
  }, [exams, search, statusFilter, sortBy]);

  const live = filtered.filter((e) => e.status === "live");
  const previous = filtered.filter((e) => e.status !== "live");

  const toggleStatus = async (exam: Exam) => {
    try {
      // If publishing, require an explicit start date/time to avoid immediate live appearance
      if (exam.status !== "live") {
        if (!exam.startDate && !exam.startTime) {
          toast({
            title: "Set start date/time before publishing",
            description: "Please set a start date or time in the exam settings so students see it as Upcoming, not immediately Live.",
            variant: "destructive",
          });
          return;
        }
      }

      const response = exam.status === "live"
        ? await examsAPI.unpublish(exam._id)
        : await examsAPI.publish(exam._id);
      const updated = response.data;
      setExams((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      toast({
        title: updated.status === "live" ? "Exam published" : "Exam unpublished",
      });
    } catch (err) {
      console.error("Failed to toggle exam status", err);
      toast({
        title: "Failed to update exam",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const deleteExam = async (id: string) => {
    try {
      await examsAPI.delete(id);
      setExams((prev) => prev.filter((e) => e._id !== id));
      toast({ title: "Exam deleted" });
    } catch (err) {
      console.error("Failed to delete exam", err);
      toast({
        title: "Failed to delete exam",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getQuestionsForExam = (exam: Exam) => {
    return exam.questionIds || [];
  };

  const openEdit = (exam: Exam) => {
    setEditExam(exam);
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">All Exams</h1>
        <p className="text-muted-foreground">Manage all exams — split into Live and Previous for clarity.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input placeholder="Search by title" value={search} onChange={(e:any)=>setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <option value="all">All statuses</option>
            <option value="live">Live</option>
            <option value="draft">Draft</option>
          </select>
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setTab("live")} className={`px-4 py-2 rounded-lg ${tab === "live" ? "bg-success text-white" : "bg-card text-foreground"}`}>Live ({live.length})</button>
        <button onClick={() => setTab("previous")} className={`px-4 py-2 rounded-lg ${tab === "previous" ? "bg-success text-white" : "bg-card text-foreground"}`}>Previous ({previous.length})</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-muted-foreground">Loading exams...</div>
        ) : (
          (tab === "live" ? live : previous).map((exam) => (
            <Card key={exam._id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-lg">{exam.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{exam.duration} mins • {exam.totalMarks} marks</p>
                  <p className="text-xs text-muted-foreground mt-2">{exam.createdAt ? `Created ${exam.createdAt}` : "No date"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${exam.status === "live" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{exam.status}</span>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" onClick={() => toggleStatus(exam)}>{exam.status === "live" ? "Unpublish" : "Publish"}</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(exam)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteExam(exam._id)}>Delete</Button>
                    <Dialog> 
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">Preview</Button>
                      </DialogTrigger>
                      <DialogContent className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader>
                          <DialogTitle>Exam Preview</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <h3 className="font-bold">{exam.title}</h3>
                          <p className="text-sm text-muted-foreground">{exam.duration} mins • {exam.totalMarks} marks</p>
                          <div className="mt-2 space-y-2">
                            {getQuestionsForExam(exam).map((q:any, i:number) => {
                              const questionText = q?.questionTextBn || q?.questionTextEn || q?.questionText || "(question missing)";
                              const parsed = parseQuestionWithSubPoints(questionText);
                              
                              return (
                                <div key={i} className="p-3 border rounded-lg bg-card">
                                  {parsed.hasSubPoints ? (
                                    <div className="font-medium">
                                      {parsed.mainQuestion && <p className="mb-2">{parsed.mainQuestion}</p>}
                                      <div className="ml-4 space-y-1">
                                        {parsed.subPoints.map((point, idx) => (
                                          <div key={idx} className="flex gap-2 text-sm">
                                            <span className="font-semibold min-w-[2rem]">{['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.'][idx]}</span>
                                            <span>{point}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="font-medium">{questionText}</p>
                                  )}
                                  {q?.options && (
                                    <ul className="mt-2 list-decimal list-inside text-sm">
                                      {q.options.map((opt:any, idx:number)=>(<li key={idx}>{typeof opt === "string" ? opt : opt.text}</li>))}
                                    </ul>
                                  )}
                                  {q?.explanation && <p className="text-xs text-muted-foreground mt-2">{q.explanation}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ExamCreationModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initialExam={editExam}
        mode="edit"
        selectedQuestionIds={editExam?.questionIds?.map((q: any) => q._id || q) || []}
        onSuccess={(updated) => {
          if (!updated) return;
          setExams((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
          setEditOpen(false);
        }}
      />

    </div>
  );
};

export default AdminAllExams;
