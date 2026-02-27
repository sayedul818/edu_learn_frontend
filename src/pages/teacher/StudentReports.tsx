import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockResults, mockExams } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const StudentReports = () => {
  // Group results by student
  const studentMap: Record<string, { name: string; results: typeof mockResults }> = {};
  mockResults.forEach((r) => {
    if (!studentMap[r.studentId]) studentMap[r.studentId] = { name: r.studentName, results: [] };
    studentMap[r.studentId].results.push(r);
  });

  const studentSummary = Object.entries(studentMap).map(([id, data]) => ({
    id,
    name: data.name,
    exams: data.results.length,
    avg: Math.round(data.results.reduce((a, r) => a + r.percentage, 0) / data.results.length),
    best: Math.max(...data.results.map((r) => r.percentage)),
    worst: Math.min(...data.results.map((r) => r.percentage)),
  }));

  const chartData = studentSummary.map((s) => ({ name: s.name.split(" ")[0], avg: s.avg }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Student Reports</h1>
        <p className="text-muted-foreground mt-1">Monitor student performance across exams</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Average Scores by Student</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip />
              <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Student Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Student</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Exams</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Average</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Best</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Worst</th>
                </tr>
              </thead>
              <tbody>
                {studentSummary.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-3 px-2 font-medium">{s.name}</td>
                    <td className="py-3 px-2 text-center">{s.exams}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`font-bold ${s.avg >= 80 ? "text-success" : s.avg >= 50 ? "text-warning" : "text-destructive"}`}>{s.avg}%</span>
                    </td>
                    <td className="py-3 px-2 text-center text-success font-bold">{s.best}%</td>
                    <td className="py-3 px-2 text-center text-destructive font-bold">{s.worst}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">All Submissions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockResults.map((r) => {
              const exam = mockExams.find((e) => e.id === r.examId);
              return (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground">{exam?.title} • {r.submittedAt}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${r.percentage >= 80 ? "text-success" : r.percentage >= 50 ? "text-warning" : "text-destructive"}`}>{r.score}/{r.totalMarks}</span>
                    <p className="text-xs text-muted-foreground">{r.percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentReports;
