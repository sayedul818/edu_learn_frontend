import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { enrollmentsAPI } from "@/services/api";

type Enrollment = {
  _id: string;
  status: "active" | "pending";
  enrollmentDate: string;
  studentId?: { name: string; email: string };
  courseId?: { title: string };
};

const TeacherEnrollments = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await enrollmentsAPI.getAll();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (error: any) {
      toast({ title: "Failed to load enrollments", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const toggleStatus = async (row: Enrollment) => {
    const next = row.status === "active" ? "pending" : "active";
    try {
      await enrollmentsAPI.update(row._id, { status: next });
      setRows((prev) => prev.map((item) => (item._id === row._id ? { ...item, status: next } : item)));
    } catch (error: any) {
      toast({ title: "Failed to update enrollment", description: error?.message, variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    try {
      await enrollmentsAPI.delete(id);
      setRows((prev) => prev.filter((item) => item._id !== id));
      toast({ title: "Enrollment removed" });
    } catch (error: any) {
      toast({ title: "Failed to remove enrollment", description: error?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Enrollments</h1>
        <p className="mt-2 text-base text-slate-300 md:text-lg">Track and manage enrollment lifecycle for your students.</p>
      </section>

      <Card>
        <CardHeader><CardTitle>Enrollment List</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading enrollments...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-muted-foreground">
                  <th className="py-2">Student</th>
                  <th>Course</th>
                  <th>Enrollment Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id} className="border-b border-border/40">
                    <td className="py-3">
                      <p className="font-medium">{row.studentId?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{row.studentId?.email || "N/A"}</p>
                    </td>
                    <td>{row.courseId?.title || "Unknown course"}</td>
                    <td>{row.enrollmentDate ? new Date(row.enrollmentDate).toLocaleDateString() : "-"}</td>
                    <td>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${row.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(row)}>Toggle Status</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(row._id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherEnrollments;
