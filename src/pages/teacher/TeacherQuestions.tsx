import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockQuestions, subjects } from "@/data/mockData";
import { Edit, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { parseQuestionWithSubPoints } from "@/lib/utils";

const TeacherQuestions = () => {
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const questions = mockQuestions.filter((q) => {
    if (filterSubject && q.subject !== filterSubject) return false;
    if (search && !q.questionText.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const diffColors = { Easy: "bg-success/10 text-success", Medium: "bg-warning/10 text-warning", Hard: "bg-destructive/10 text-destructive" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">My Questions</h1>
          <p className="text-muted-foreground mt-1">Manage your question bank</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{q.subject}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{q.chapter}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${diffColors[q.difficulty]}`}>{q.difficulty}</span>
                </div>
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
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeacherQuestions;
