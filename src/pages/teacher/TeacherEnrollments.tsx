import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
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
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/60 p-5 shadow-lg md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Enrollment Management
          </p>
          <h1 className="mt-3 text-2xl font-display font-bold text-foreground md:text-3xl">Enrollments</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">Track and manage enrollment lifecycle for your students.</p>
        </div>
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
                        <Button size="sm" variant="glass" onClick={() => toggleStatus(row)}>Toggle Status</Button>
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
