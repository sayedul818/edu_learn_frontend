import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, Clock3, Plus, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { coursesAPI } from "@/services/api";

type Course = {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number | null;
  duration: string;
  startDate?: string | null;
  endDate?: string | null;
  status: "draft" | "published";
  studentCount?: number;
  createdAt?: string;
};

const emptyForm = {
  title: "",
  description: "",
  thumbnail: "",
  price: "",
  duration: "",
  startDate: "",
  endDate: "",
  status: "draft",
};

const TeacherCourses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await coursesAPI.getAll();
      setCourses(Array.isArray(res?.data) ? res.data : []);
    } catch (error: any) {
      toast({ title: "Failed to load courses", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (location.pathname === "/teacher/courses/create") {
      openCreate();
    }
  }, [location.pathname]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (statusFilter !== "all" && course.status !== statusFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        course.title.toLowerCase().includes(s) ||
        (course.description || "").toLowerCase().includes(s)
      );
    });
  }, [courses, search, statusFilter]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingCourse(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title || "",
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      price: course.price === null || course.price === undefined ? "" : String(course.price),
      duration: course.duration || "",
      startDate: course.startDate ? new Date(course.startDate).toISOString().slice(0, 10) : "",
      endDate: course.endDate ? new Date(course.endDate).toISOString().slice(0, 10) : "",
      status: course.status || "draft",
    });
    setIsFormOpen(true);
  };

  const submitCourse = async () => {
    if (!form.title.trim() || !form.duration.trim()) {
      toast({ title: "Title and duration are required", variant: "destructive" });
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      thumbnail: form.thumbnail,
      price: form.price === "" ? null : Number(form.price),
      duration: form.duration,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      status: form.status,
    };

    try {
      if (editingCourse) {
        await coursesAPI.update(editingCourse._id, payload);
        toast({ title: "Course updated" });
      } else {
        await coursesAPI.create(payload);
        toast({ title: "Course created" });
      }
      setIsFormOpen(false);
      resetForm();
      loadCourses();
    } catch (error: any) {
      toast({ title: "Failed to save course", description: error?.message, variant: "destructive" });
    }
  };

  const removeCourse = async (courseId: string) => {
    try {
      await coursesAPI.delete(courseId);
      toast({ title: "Course deleted" });
      loadCourses();
    } catch (error: any) {
      toast({ title: "Failed to delete course", description: error?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <BookOpen className="h-3.5 w-3.5" /> Course Management
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">Teacher Courses</h1>
            <p className="mt-2 text-base text-slate-300 md:text-lg">Create, publish, and manage your private course catalog.</p>
          </div>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Create Course
          </Button>
        </div>
      </section>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "draft" | "published")}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading courses...</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredCourses.map((course) => (
            <Card key={course._id} className="border-border/70">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${course.status === "published" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {course.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description || "No description yet."}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {course.duration}</p>
                  <p className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.studentCount || 0} students</p>
                  <p className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {course.startDate ? new Date(course.startDate).toLocaleDateString() : "No start"}</p>
                  <p>{course.price === null || course.price === undefined ? "Free" : `$${course.price}`}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate(`/teacher/courses/${course._id}`)}>Manage</Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(course)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => removeCourse(course._id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!filteredCourses.length && (
            <Card className="lg:col-span-2">
              <CardContent className="p-6 text-sm text-muted-foreground">No courses found.</CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Create Course"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Course Title</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Course Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Course Thumbnail URL</Label>
              <Input value={form.thumbnail} onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Course Price (Optional)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Course Duration</Label>
                <Input placeholder="e.g. 12 weeks" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Course Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Course End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Course Status</Label>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "draft" | "published" }))}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Instructor</Label>
              <Input value="Auto-selected from logged in teacher" disabled />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button onClick={submitCourse}>{editingCourse ? "Save Changes" : "Create Course"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherCourses;
