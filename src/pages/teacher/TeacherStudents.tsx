import { useEffect, useMemo, useState } from "react";
import { UserPlus, Search, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { coursesAPI, teacherAPI } from "@/services/api";

type Student = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
  courseStatus?: "active" | "inactive" | "pending" | "hold";
  enrolledCourses: number;
  examsGiven: number;
  averageScore: number;
};

const TeacherStudents = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", phone: "", class: "", group: "" });
  const [enrollForm, setEnrollForm] = useState({ courseId: "", enrollmentDate: "", status: "active" as "active" | "pending" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, coursesRes] = await Promise.all([teacherAPI.getStudents(), coursesAPI.getAll()]);
      setStudents(Array.isArray(studentsRes?.data) ? studentsRes.data : []);
      setCourses(Array.isArray(coursesRes?.data) ? coursesRes.data : []);
    } catch (error: any) {
      toast({ title: "Failed to load students", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return students;
    const s = search.toLowerCase();
    return students.filter((st) => st.name.toLowerCase().includes(s) || st.email.toLowerCase().includes(s));
  }, [students, search]);

  const createStudent = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({ title: "Name, email, and password are required", variant: "destructive" });
      return;
    }
    try {
      await teacherAPI.createStudent(createForm);
      toast({ title: "Student created" });
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "", phone: "", class: "", group: "" });
      loadData();
    } catch (error: any) {
      toast({ title: "Failed to create student", description: error?.message, variant: "destructive" });
    }
  };

  const toggleStatus = async (student: Student) => {
    const next = student.status === "active" ? "inactive" : "active";
    try {
      await teacherAPI.changeStudentStatus(student._id, next);
      setStudents((prev) => prev.map((s) => (s._id === student._id ? { ...s, status: next } : s)));
      toast({ title: `Student ${next === "active" ? "activated" : "deactivated"}` });
    } catch (error: any) {
      toast({ title: "Failed to update status", description: error?.message, variant: "destructive" });
    }
  };

  const enrollStudent = async () => {
    if (!selectedStudent || !enrollForm.courseId) {
      toast({ title: "Choose student and course", variant: "destructive" });
      return;
    }
    try {
      await coursesAPI.addStudent(enrollForm.courseId, {
        studentId: selectedStudent._id,
        enrollmentDate: enrollForm.enrollmentDate || undefined,
        status: enrollForm.status,
      });
      toast({ title: "Student enrolled successfully" });
      setShowEnroll(false);
      setSelectedStudent(null);
      setEnrollForm({ courseId: "", enrollmentDate: "", status: "active" });
      loadData();
    } catch (error: any) {
      toast({ title: "Failed to enroll student", description: error?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Students</h1>
            <p className="mt-2 text-base text-slate-300 md:text-lg">Manage your private student roster and performance.</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </section>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search students by name or email" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading students...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-muted-foreground">
                  <th className="py-2">Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Enrolled Courses</th>
                  <th>Exams Given</th>
                  <th>Average Score</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student._id} className="border-b border-border/40">
                    <td className="py-3 font-medium">{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.phone || "-"}</td>
                    <td>{student.enrolledCourses || 0}</td>
                    <td>{student.examsGiven || 0}</td>
                    <td>{student.averageScore || 0}%</td>
                    <td>
                      {(() => {
                        const displayStatus = student.courseStatus || student.status;
                        const statusClass =
                          displayStatus === "pending"
                            ? "bg-amber-500/15 text-amber-500"
                            : displayStatus === "hold"
                              ? "bg-orange-500/15 text-orange-500"
                              : displayStatus === "active"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-zinc-500/20 text-zinc-300";
                        return (
                          <span className={`rounded-full px-2.5 py-1 text-xs ${statusClass}`}>
                            {displayStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowEnroll(true);
                          }}
                        >
                          Enroll
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleStatus(student)}>
                          {student.status === "active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Create Student</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2"><Label>Name</Label><Input value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Email</Label><Input value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Password</Label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} /></div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="grid gap-2"><Label>Phone</Label><Input value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Class</Label><Input value={createForm.class} onChange={(e) => setCreateForm((p) => ({ ...p, class: e.target.value }))} /></div>
            </div>
            <div className="grid gap-2"><Label>Group</Label><Input value={createForm.group} onChange={(e) => setCreateForm((p) => ({ ...p, group: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={createStudent}>Create Student</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Enroll Student</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Student</Label>
              <Input value={selectedStudent?.name || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Course</Label>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={enrollForm.courseId}
                onChange={(e) => setEnrollForm((p) => ({ ...p, courseId: e.target.value }))}
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Enrollment Date</Label>
                <Input type="date" value={enrollForm.enrollmentDate} onChange={(e) => setEnrollForm((p) => ({ ...p, enrollmentDate: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={enrollForm.status}
                  onChange={(e) => setEnrollForm((p) => ({ ...p, status: e.target.value as "active" | "pending" }))}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEnroll(false)}>Cancel</Button>
              <Button onClick={enrollStudent}>Enroll</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherStudents;
