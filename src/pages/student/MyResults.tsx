
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { examsAPI, examResultsAPI } from "@/services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowRight } from "lucide-react";
import BeautifulLoader from "@/components/ui/beautiful-loader";


const MyResults = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myResults, setMyResults] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch results and exams in parallel, then filter out results for exams that no longer exist
        const [res, examsRes] = await Promise.all([examResultsAPI.getMine(), examsAPI.getAll()]);
        const results = res.data || [];
        const uid = user?.id || (user as any)?._id || null;
        const userResults = uid ? results.filter((r: any) => String(r.studentId?._id || r.studentId || r.student || uid) === String(uid)) : results;
        const examsList = examsRes.data || [];
        setExams(examsList);
        const validIds = new Set(examsList.map((e: any) => String(e._id || e.id)));
        const filtered = userResults.filter((r: any) => {
          const eid = (r.examId && typeof r.examId === 'object') ? (r.examId._id || r.examId.id) : (r.examId || r.exam);
          return eid && validIds.has(String(eid));
        });
        setMyResults(filtered);
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user]);

  // Stats
  const totalExams = myResults.length;
  const avgScore = totalExams ? Math.round(myResults.reduce((a, r) => a + r.percentage, 0) / totalExams) : 0;
  const best = myResults.reduce((max, r) => r.percentage > max ? r.percentage : max, 0);
  const worst = myResults.reduce((min, r) => r.percentage < min ? r.percentage : min, 100);
  const fastest = myResults.reduce((min, r) => r.timeTaken < min ? r.timeTaken : min, Infinity);
  const slowest = myResults.reduce((max, r) => r.timeTaken > max ? r.timeTaken : max, 0);

  // Subject-wise average
  const subjectScores: Record<string, { total: number; count: number }> = {};
  myResults.forEach((r) => {
    // Robust subject extraction: handle populated `examId.subjectId` or `examId.subject` or exams lookup
    let subject = undefined;
    const examObj = (r.examId && typeof r.examId === 'object') ? r.examId : null;
    if (examObj) {
      subject = examObj.subject || examObj.subjectId?.name || examObj.subjectId;
    }
    if (!subject) {
      const exam = exams.find((e) => e._id === r.examId || e.id === r.examId);
      subject = exam?.subject || exam?.subjectId?.name || exam?.subjectId;
    }
    // If still no subject, fallback to r.subject if present, else Unknown
    if (!subject) subject = r.subject || 'Unknown';
    if (subject) {
      if (!subjectScores[subject]) subjectScores[subject] = { total: 0, count: 0 };
      subjectScores[subject].total += r.percentage;
      subjectScores[subject].count++;
    }
  });
  const subjectData = Object.entries(subjectScores).map(([name, v]) => ({ name, avg: Math.round(v.total / v.count) }));

  // Pie chart data
  const pieData = [
    { name: "Correct", value: myResults.reduce((a, r) => a + r.score, 0) },
    { name: "Wrong", value: myResults.reduce((a, r) => a + r.totalMarks - r.score, 0) },
  ];
  const COLORS = ["hsl(var(--success))", "hsl(var(--destructive))"];


  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-bangla">
        <Trophy className="h-12 w-12 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">আপনার ফলাফল দেখতে লগইন করুন</h2>
        <button className="px-4 py-2 rounded bg-primary text-white mt-2" onClick={() => navigate('/login')}>Login</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] font-bangla flex items-center justify-center">
        <BeautifulLoader message="ফলাফল লোড হচ্ছে..." className="max-w-md w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-bangla">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-2xl font-display font-bold">আমার ফলাফল</h1>
          <p className="mt-1 text-sm text-white/80">আপনার পরীক্ষার পারফরম্যান্স ও অগ্রগতি দেখুন</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="py-6">
            <div className="text-3xl font-bold text-primary mb-1">{totalExams}</div>
            <div className="text-sm text-muted-foreground">মোট পরীক্ষা</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-6">
            <div className="text-3xl font-bold text-success mb-1">{avgScore}%</div>
            <div className="text-sm text-muted-foreground">গড় স্কোর</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-6">
            <div className="text-3xl font-bold text-emerald-600 mb-1">{best}%</div>
            <div className="text-sm text-muted-foreground">সর্বোচ্চ স্কোর</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-6">
            <div className="text-3xl font-bold text-destructive mb-1">{worst}%</div>
            <div className="text-sm text-muted-foreground">সর্বনিম্ন স্কোর</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">বিষয়ভিত্তিক গড়</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectData}>
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
          <CardHeader><CardTitle className="text-lg">সঠিক বনাম ভুল</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Exam History Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">পরীক্ষার ইতিহাস</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">পরীক্ষা</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">বিষয়</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">স্কোর</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">শতাংশ</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">সময়</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">তারিখ</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody>
                {myResults.map((r) => {
                  // If backend populated examId, use it; else fallback to lookup
                  const examObj = typeof r.examId === 'object' && r.examId !== null ? r.examId : null;
                  const exam = examObj || exams.find((e) => e._id === r.examId || e.id === r.examId);
                  const subjectName = examObj?.subject || examObj?.subjectId?.name || exam?.subject || exam?.subjectId?.name || r.subject || '-';
                  // Format date
                  let dateStr = r.submittedAt;
                  if (dateStr) {
                    try {
                      const d = new Date(dateStr);
                      dateStr = d.toLocaleString('bn-BD', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                    } catch {}
                  }
                  return (
                    <tr key={r._id || r.id} className="border-b border-border/50 hover:bg-muted/40 transition">
                      <td className="py-3 px-2 font-medium">{exam?.title || '-'}</td>
                      <td className="py-3 px-2">{subjectName || '-'}</td>
                      <td className="py-3 px-2 text-center">{r.score}/{r.totalMarks}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-bold ${r.percentage >= 80 ? "text-success" : r.percentage >= 50 ? "text-warning" : "text-destructive"}`}>{r.percentage}%</span>
                      </td>
                      <td className="py-3 px-2 text-center">{Math.floor(r.timeTaken/60)}:{(r.timeTaken%60).toString().padStart(2,'0')} মিনিট</td>
                      <td className="py-3 px-2 text-center text-muted-foreground">{dateStr}</td>
                      <td className="py-3 px-2 text-center">
                        <button className="inline-flex items-center gap-1 text-primary hover:underline" onClick={() => navigate(`/exam-result/${examObj?._id || r.examId}`)}>
                          বিস্তারিত <ArrowRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {myResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">আপনি এখনো কোনো পরীক্ষা দেননি।</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyResults;
