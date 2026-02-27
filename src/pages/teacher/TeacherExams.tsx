import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockQuestions, mockExams, subjects } from "@/data/mockData";
import { PlusCircle, Clock, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseQuestionWithSubPoints } from "@/lib/utils";

const TeacherExams = () => {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    duration: 30,
    negativeMarking: false,
    negativeMarkValue: 0.25,
    selectedQuestions: [] as string[],
  });

  const availableQs = form.subject ? mockQuestions.filter((q) => q.subject === form.subject) : [];

  const toggleQ = (qId: string) => {
    setForm((f) => ({
      ...f,
      selectedQuestions: f.selectedQuestions.includes(qId)
        ? f.selectedQuestions.filter((id) => id !== qId)
        : [...f.selectedQuestions, qId],
    }));
  };

  const handleCreate = () => {
    if (!form.title || !form.subject || form.selectedQuestions.length === 0) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    toast({ title: "Exam Created! ✅", description: `${form.title} with ${form.selectedQuestions.length} questions` });
    setShowCreate(false);
    setForm({ title: "", subject: "", duration: 30, negativeMarking: false, negativeMarkValue: 0.25, selectedQuestions: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Exams</h1>
          <p className="text-muted-foreground mt-1">Create and manage exams</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Create Exam
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>New Exam</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Exam title" />
              </div>
              <div>
                <Label>Subject</Label>
                <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value, selectedQuestions: [] })}>
                  <option value="">Select</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" className="mt-1" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.negativeMarking} onChange={(e) => setForm({ ...form, negativeMarking: e.target.checked })} />
                  Negative Marking
                </label>
              </div>
              {form.negativeMarking && (
                <div>
                  <Label>Penalty</Label>
                  <Input type="number" step="0.25" className="mt-1" value={form.negativeMarkValue} onChange={(e) => setForm({ ...form, negativeMarkValue: Number(e.target.value) })} />
                </div>
              )}
            </div>

            {form.subject && (
              <div>
                <Label>Select Questions ({form.selectedQuestions.length} selected)</Label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {availableQs.map((q) => (
                    <label key={q.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.selectedQuestions.includes(q.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                      <input type="checkbox" checked={form.selectedQuestions.includes(q.id)} onChange={() => toggleQ(q.id)} className="mt-0.5" />
                      <div className="flex-1">
                        {(() => {
                          const parsed = parseQuestionWithSubPoints(q.questionText);
                          
                          if (parsed.hasSubPoints) {
                            return (
                              <div className="text-sm font-medium">
                                {parsed.mainQuestion && <p className="mb-1">{parsed.mainQuestion}</p>}
                                <div className="ml-3 space-y-0.5">
                                  {parsed.subPoints.map((point, i) => (
                                    <div key={i} className="flex gap-2 text-xs">
                                      <span className="font-semibold min-w-[1.5rem]">{['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.'][i]}</span>
                                      <span>{point}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          
                          return <p className="text-sm font-medium">{q.questionText}</p>;
                        })()}
                        <p className="text-xs text-muted-foreground">{q.chapter} • {q.difficulty} • {q.marks}mk</p>
                      </div>
                    </label>
                  ))}
                  {availableQs.length === 0 && <p className="text-sm text-muted-foreground">No questions available for this subject</p>}
                </div>
              </div>
            )}

            <Button onClick={handleCreate} className="w-full">Create Exam</Button>
          </CardContent>
        </Card>
      )}

      {/* Existing exams */}
      <div className="space-y-3">
        {mockExams.map((exam) => (
          <Card key={exam.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{exam.subject}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${exam.status === "published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{exam.status}</span>
                </div>
                <p className="font-medium text-sm">{exam.title}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.duration}min</span>
                  <span>{exam.questionIds.length} questions</span>
                  <span>{exam.totalMarks} marks</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeacherExams;
