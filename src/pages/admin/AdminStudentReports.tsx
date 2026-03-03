import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminReportsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const AdminStudentReports = () => {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await adminReportsAPI.students({ page: p, limit: 50 });
      setData(res.data || []);
      setTotal(res.total || 0);
      setPage(res.page || p);
    } catch (err) {
      console.error('Failed to load student reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const openDetail = async (id: string) => {
    try {
      const res = await adminReportsAPI.studentDetail(id);
      setSelected(res);
    } catch (err) {
      console.error('Failed to load student detail', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Student Reports</h1>
        <p className="text-muted-foreground mt-1">Overview of student performance</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Students Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Student</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Exams</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Average</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Best</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Last Taken</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s:any) => (
                  <tr key={String(s.studentId)} className="border-b border-border/50">
                    <td className="py-3 px-2 font-medium">{s.name || s.email}</td>
                    <td className="py-3 px-2 text-center">{s.examsTaken}</td>
                    <td className="py-3 px-2 text-center"><span className={`font-bold ${s.avgPercentage >= 80 ? 'text-success' : s.avgPercentage >= 50 ? 'text-warning' : 'text-destructive'}`}>{Number(s.avgPercentage).toFixed(2)}%</span></td>
                    <td className="py-3 px-2 text-center text-success font-bold">{Number(s.bestPercentage).toFixed(2)}%</td>
                    <td className="py-3 px-2 text-center">{s.lastTaken ? formatDistanceToNow(new Date(s.lastTaken), { addSuffix: true }) : '-'}</td>
                    <td className="py-3 px-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openDetail(String(s.studentId))}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Detail for {selected.student?.name || selected.student?.email}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selected.results.map((r:any) => (
                <div key={r.resultId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{r.examTitle}</p>
                    <p className="text-xs text-muted-foreground">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{r.score}/{r.totalMarks}</div>
                    <div className="text-xs text-muted-foreground">{r.percentage ? Number(r.percentage).toFixed(2) + '%' : 'Pending'}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminStudentReports;
