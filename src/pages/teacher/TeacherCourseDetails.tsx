import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Megaphone, Paperclip, Plus, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { coursesAPI, examsAPI, leaderboardAPI } from "@/services/api";

type CourseDetails = {
  _id: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  duration: string;
  startDate?: string;
  endDate?: string;
  students: Array<{ _id: string; studentId?: { _id: string; name: string; email: string; status?: string } }>;
  exams: Array<{ _id: string; title: string; status: string; totalMarks: number }>;
  materials: Array<{ _id: string; title: string; url: string; type: string }>;
  announcements: Array<{ _id: string; message: string; createdAt: string }>;
};

const TeacherCourseDetails = () => {
  const { courseId = "" } = useParams();
  const { toast } = useToast();

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [leaderboardRows, setLeaderboardRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseRes, examsRes, leaderboardRes] = await Promise.all([
        coursesAPI.get(courseId),
        examsAPI.getAll(),
        leaderboardAPI.get(),
      ]);
      setCourse(courseRes?.data || null);
      setAllExams(examsRes?.data || []);
      setLeaderboardRows(leaderboardRes?.data || []);
    } catch (error: any) {
      toast({ title: "Failed to load course", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  const linkedExamIds = useMemo(() => new Set((course?.exams || []).map((e) => e._id)), [course]);
  const availableExams = useMemo(() => allExams.filter((exam: any) => !linkedExamIds.has(exam._id)), [allExams, linkedExamIds]);

  const addExam = async () => {
    if (!selectedExamId) return;
    try {
      await coursesAPI.linkExam(courseId, selectedExamId);
      setSelectedExamId("");
      loadData();
      toast({ title: "Exam linked to course" });
    } catch (error: any) {
      toast({ title: "Failed to link exam", description: error?.message, variant: "destructive" });
    }
  };

  const addMaterial = async () => {
    if (!newMaterialTitle.trim() || !newMaterialUrl.trim()) return;
    try {
      await coursesAPI.addMaterial(courseId, { title: newMaterialTitle, url: newMaterialUrl, type: "link" });
      setNewMaterialTitle("");
      setNewMaterialUrl("");
      loadData();
      toast({ title: "Material added" });
    } catch (error: any) {
      toast({ title: "Failed to add material", description: error?.message, variant: "destructive" });
    }
  };

  const postAnnouncement = async () => {
    if (!announcement.trim()) return;
    try {
      await coursesAPI.addAnnouncement(courseId, announcement);
      setAnnouncement("");
      loadData();
      toast({ title: "Announcement posted" });
    } catch (error: any) {
      toast({ title: "Failed to post announcement", description: error?.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading course details...</CardContent></Card>;
  }

  if (!course) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Course not found.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{course.title}</h1>
        <p className="mt-2 text-base text-slate-300 md:text-lg">{course.description || "Manage students, exams, and learning resources for this course."}</p>
      </section>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7 h-auto bg-transparent p-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Status</p><p className="text-xl font-semibold capitalize">{course.status}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Students</p><p className="text-xl font-semibold">{course.students?.length || 0}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Linked Exams</p><p className="text-xl font-semibold">{course.exams?.length || 0}</p></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Course Students</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(course.students || []).map((entry) => (
                  <div key={entry._id} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                    <div>
                      <p className="font-medium">{entry.studentId?.name || "Unknown"}</p>
                      <p className="text-muted-foreground">{entry.studentId?.email || "N/A"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{entry.studentId?.status || "active"}</span>
                  </div>
                ))}
                {!course.students?.length && <p className="text-muted-foreground">No students enrolled yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams">
          <Card>
            <CardHeader><CardTitle>Course Exams</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row">
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm md:flex-1"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                >
                  <option value="">Select exam to link</option>
                  {availableExams.map((exam: any) => (
                    <option key={exam._id} value={exam._id}>{exam.title}</option>
                  ))}
                </select>
                <Button onClick={addExam}><Plus className="mr-2 h-4 w-4" /> Link Exam</Button>
              </div>
              <div className="space-y-2 text-sm">
                {(course.exams || []).map((exam) => (
                  <div key={exam._id} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-muted-foreground">{exam.totalMarks} marks</p>
                    </div>
                    <span className="text-xs capitalize text-muted-foreground">{exam.status}</span>
                  </div>
                ))}
                {!course.exams?.length && <p className="text-muted-foreground">No exams linked yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Assignment workflow is now reserved in this tab and can be connected to your exam/worksheet engine in the next phase.</CardContent></Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> Course Materials</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row">
                <Input placeholder="Material title" value={newMaterialTitle} onChange={(e) => setNewMaterialTitle(e.target.value)} />
                <Input placeholder="Material URL" value={newMaterialUrl} onChange={(e) => setNewMaterialUrl(e.target.value)} />
                <Button onClick={addMaterial}>Add</Button>
              </div>
              <div className="space-y-2 text-sm">
                {(course.materials || []).map((material) => (
                  <a key={material._id} href={material.url} target="_blank" rel="noreferrer" className="block rounded-md border border-border/70 px-3 py-2 hover:bg-muted/40">
                    <p className="font-medium">{material.title}</p>
                    <p className="text-muted-foreground">{material.url}</p>
                  </a>
                ))}
                {!course.materials?.length && <p className="text-muted-foreground">No materials uploaded yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Announcements</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row">
                <Input placeholder="Write an announcement for this course" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
                <Button onClick={postAnnouncement}>Post</Button>
              </div>
              <div className="space-y-2 text-sm">
                {(course.announcements || []).map((item) => (
                  <div key={item._id} className="rounded-md border border-border/70 px-3 py-2">
                    <p>{item.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {!course.announcements?.length && <p className="text-muted-foreground">No announcements yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Course Leaderboard Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {leaderboardRows.slice(0, 10).map((row: any, idx) => (
                  <div key={row.studentId || idx} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                    <p>{idx + 1}. {row.name || row.studentName || "Student"}</p>
                    <p className="text-muted-foreground">{Number(row.totalScore || 0).toFixed(0)} pts</p>
                  </div>
                ))}
                {!leaderboardRows.length && <p className="text-muted-foreground">Leaderboard data will appear as students submit exams.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherCourseDetails;
