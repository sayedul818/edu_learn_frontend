import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockQuestions, subjects } from "@/data/mockData";
import { BookOpen, Edit, Trash2, Search } from "lucide-react";
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
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/60 p-5 shadow-lg md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <BookOpen className="h-3.5 w-3.5" /> Question Bank Management
          </p>
          <h1 className="mt-3 text-2xl font-display font-bold text-foreground md:text-3xl">My Questions</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">Manage your question bank</p>
        </div>
      </section>

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
                        {parsed.mainQuestion && <p className="mb-1" dangerouslySetInnerHTML={{ __html: renderRichOrMathHtml(parsed.mainQuestion) }} />}
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
