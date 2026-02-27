import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { mockQuestions, mockExams, mockResults } from "@/data/mockData";
import { FileText, ClipboardList, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const myQuestions = mockQuestions.filter((q) => q.createdBy === "t1");
  const myExams = mockExams.filter((e) => e.createdBy === "t1");
  const totalResults = mockResults.length;

  const stats = [
    { label: "My Questions", value: myQuestions.length, icon: <FileText className="h-5 w-5" />, color: "text-primary" },
    { label: "My Exams", value: myExams.length, icon: <ClipboardList className="h-5 w-5" />, color: "text-accent" },
    { label: "Submissions", value: totalResults, icon: <Users className="h-5 w-5" />, color: "text-warning" },
    { label: "Avg. Score", value: "68%", icon: <TrendingUp className="h-5 w-5" />, color: "text-success" },
  ];

  const diffData = [
    { name: "Easy", count: myQuestions.filter((q) => q.difficulty === "Easy").length },
    { name: "Medium", count: myQuestions.filter((q) => q.difficulty === "Medium").length },
    { name: "Hard", count: myQuestions.filter((q) => q.difficulty === "Hard").length },
  ];

  const subjectData = Object.entries(myQuestions.reduce((acc, q) => { acc[q.subject] = (acc[q.subject] || 0) + 1; return acc; }, {} as Record<string, number>))
    .map(([name, count]) => ({ name, count }));

  const COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name?.split(" ").pop()}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${s.color}`}>{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Questions by Subject</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Difficulty Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={diffData} cx="50%" cy="50%" outerRadius={90} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                  {diffData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Student Submissions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockResults.slice(0, 5).map((r) => {
              const exam = mockExams.find((e) => e.id === r.examId);
              return (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground">{exam?.title} • {r.submittedAt}</p>
                  </div>
                  <span className={`text-sm font-bold ${r.percentage >= 80 ? "text-success" : r.percentage >= 50 ? "text-warning" : "text-destructive"}`}>
                    {r.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
