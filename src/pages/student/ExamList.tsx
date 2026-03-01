import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { Clock, FileText, Play, CheckCircle, Calendar, Eye, BookOpen, Trophy } from "lucide-react";
import { motion } from "framer-motion";

type Exam = {
  _id: string;
  title: string;
  duration: number;
  totalMarks: number;
  status?: "draft" | "live" | "scheduled";
  questionIds?: any[];
  createdAt?: string;
  publishedAt?: string;
  description?: string;
  startDate?: string | Date;
  startTime?: string;
  endDate?: string | Date;
  endTime?: string;
};

type ExamResult = {
  examId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  answers: Record<string, string>;
  timeTaken: number;
  completedAt?: string;
};

const ExamList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedExamIds, setCompletedExamIds] = useState<string[]>([]);
  const [examResults, setExamResults] = useState<Record<string, ExamResult>>({});
  const [inProgressExamIds, setInProgressExamIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "live" | "past">("upcoming");

  useEffect(() => {
    loadExams();
    loadCompletedExams();
    loadExamResults();
    loadInProgressExams();
  }, [user]);

  const loadExams = async () => {
    try {
      setLoading(true);
      let allExams: any[] = [];
      // If user is student, fetch only exams visible to them; admins/teachers get all
      if (user && (user.role === 'student' || user.role === undefined || user.role === null)) {
        try {
          const resp = await examsAPI.getMine();
          allExams = resp.data || [];
        } catch (e) {
          // fallback to public endpoint
          const resp = await examsAPI.getAll();
          allExams = resp.data || [];
        }
      } else {
        const resp = await examsAPI.getAll();
        allExams = resp.data || [];
      }
      // Keep all exams and classify by schedule (startDate/startTime/endDate/endTime)
      setExams(allExams);
      // Clean up any local cached results for exams that no longer exist (e.g., deleted by admin)
      try {
        const uid = user?.id || (user as any)?._id || 'anon';
        const key = `examResults_${uid}`;
        const stored = localStorage.getItem(key) || localStorage.getItem('examResults');
        const validIds = new Set(allExams.map((e: any) => String(e._id || e.id)));
        if (stored) {
          const parsed = JSON.parse(stored) || {};
          let changed = false;
          for (const eid of Object.keys(parsed)) {
            if (!validIds.has(String(eid))) {
              delete parsed[eid];
              changed = true;
            }
          }
          if (changed) {
            try { localStorage.setItem(key, JSON.stringify(parsed)); } catch (e) { /* ignore */ }
            setExamResults(parsed);
          }
        }
        // Also clean completed exams list
        const compKey = `completedExams_${uid}`;
        const storedComp = localStorage.getItem(compKey) || localStorage.getItem('completedExams');
        if (storedComp) {
          const arr = JSON.parse(storedComp) || [];
          const filtered = arr.filter((id: string) => validIds.has(String(id)));
          if (filtered.length !== arr.length) {
            try { localStorage.setItem(compKey, JSON.stringify(filtered)); } catch (e) { /* ignore */ }
            setCompletedExamIds(filtered);
          }
        }
      } catch (e) {
        // ignore cleanup errors
        console.error('Failed to cleanup local cached exam results', e);
      }
    } catch (err) {
      console.error("Failed to load exams", err);
      toast({
        title: "Failed to load exams",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedExams = () => {
    try {
      const uid = user?.id || (user as any)?._id || 'anon';
      const key = `completedExams_${uid}`;
      const stored = localStorage.getItem(key) || localStorage.getItem("completedExams");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCompletedExamIds(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Failed to load completed exams", e);
    }
  };

  const loadExamResults = async () => {
    try {
      // If authenticated, fetch results from server and build map
      if (user) {
        try {
          const res = await (await import("@/services/api")).examResultsAPI.getMine();
          const arr = Array.isArray(res) ? res : (res.data || []);
          const map: Record<string, ExamResult> = {};
          const completed: string[] = [];
          for (const r of arr) {
            // defensive: ensure this result belongs to current user
            const rid = r.studentId?._id || r.studentId || r.student || null;
            const uid = user?.id || (user as any)?._id || null;
            if (uid && rid && String(rid) !== String(uid)) continue;
            const id = r.examId?._id || r.examId || r.exam?._id || r.exam;
            if (id) {
              map[String(id)] = r as any;
              completed.push(String(id));
            }
          }
          setExamResults(map);
          setCompletedExamIds((prev) => Array.from(new Set([...prev, ...completed])));
          return;
        } catch (e) {
          // fall through to legacy/local fallback
          console.error("Failed to fetch exam results from server, falling back to localStorage", e);
        }
      }

      // Legacy / anonymous fallback: read from localStorage
      const uid = user?.id || (user as any)?._id || 'anon';
      const key = `examResults_${uid}`;
      const stored = localStorage.getItem(key) || localStorage.getItem("examResults");
      if (stored) {
        const parsed = JSON.parse(stored);
        setExamResults(parsed || {});
      }
      // Also check sessionStorage for last result (user-scoped)
      const lastResult = sessionStorage.getItem(`lastExamResult_${uid}`) || sessionStorage.getItem("lastExamResult");
      if (lastResult) {
        const result = JSON.parse(lastResult);
        if (result.examId) {
          setExamResults(prev => ({ ...prev, [result.examId]: result }));
        }
      }
    } catch (e) {
      console.error("Failed to load exam results", e);
    }
  };

  const loadInProgressExams = () => {
    try {
      const keys = Object.keys(sessionStorage);
      const inProgress = keys
        .filter((key) => key.startsWith("examInProgress_"))
        .map((key) => key.replace("examInProgress_", ""));
      setInProgressExamIds(inProgress);
    } catch (e) {
      console.error("Failed to load in-progress exams", e);
    }
  };

  const buildDateTime = (dateStr?: string, timeStr?: string, fallback?: string) => {
    if (dateStr && timeStr) {
      const dt = new Date(`${dateStr}T${timeStr}:00`);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    if (dateStr) {
      const dt = new Date(dateStr);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    if (fallback) {
      const dt = new Date(fallback);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  };

  const getSchedule = (exam: Exam) => {
    // If explicit start date/time provided, use it. Do NOT fall back to `publishedAt` for scheduling
    // because `publishedAt` reflects creation/publish time and can make future-scheduled exams appear live.
    const hasExplicitStart = !!(exam.startDate || exam.startTime);

    let startDateStr = null;
    let endDateStr = null;

    // Extract date portion from ISO strings (e.g., "2026-02-27T00:00:00.000Z" -> "2026-02-27")
    if (exam.startDate) {
      if (typeof exam.startDate === 'string') {
        startDateStr = exam.startDate.split('T')[0];
      } else if (exam.startDate instanceof Date) {
        startDateStr = exam.startDate.toISOString().split('T')[0];
      }
    }
    if (exam.endDate) {
      if (typeof exam.endDate === 'string') {
        endDateStr = exam.endDate.split('T')[0];
      } else if (exam.endDate instanceof Date) {
        endDateStr = exam.endDate.toISOString().split('T')[0];
      }
    }

    const start = hasExplicitStart ? buildDateTime(startDateStr, exam.startTime) : null;
    let end = buildDateTime(endDateStr, exam.endTime);
    if (!end && start && exam.duration) {
      end = new Date(start.getTime() + exam.duration * 60000);
    }
    return { start, end };
  };

  const formatDateTime = (date?: Date | null) => {
    if (!date) return "N/A";
    const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const timePart = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${datePart} – ${timePart}`;
  };

  const formatTimeRemaining = (end?: Date | null) => {
    if (!end) return "N/A";
    const diff = end.getTime() - Date.now();
    if (diff <= 0) return "শেষ হয়েছে";
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours} ঘণ্টা ${minutes} মিনিট`;
    return `${minutes} মিনিট`;
  };

  // Classify exams by schedule

  const now = Date.now();

  // Filter exams by access control: students see only exams allowed for them
  const visibleExams = useMemo(() => {
    if (!exams || exams.length === 0) return [];
    // admins and teachers see all exams
    const role = user?.role;
    if (role === 'admin' || role === 'teacher') return exams;
    // anonymous users: only show exams that are not restricted to specific students
    const uid = user?.id || (user as any)?._id || null;
    return exams.filter((e: any) => {
      if (!e) return false;
      if (!e.accessType || e.accessType !== 'specific') return true;
      if (!uid) return false; // restricted and not logged in
      const allowed = e.allowedStudents || [];
      const allowedIds = new Set((allowed || []).map((a: any) => String(a._id || a.id || a)));
      return allowedIds.has(String(uid));
    });
  }, [exams, user]);

  // Helper: is exam completed by user?
  const isCompleted = (exam: Exam) => completedExamIds.includes(exam._id);

  // Upcoming: not completed, scheduled/future
  const upcomingExams = visibleExams.filter((e) => {
    if (isCompleted(e)) return false;
    const { start } = getSchedule(e);
    if (e.status === 'scheduled' && start && start.getTime() > now) return true;
    if (start && start.getTime() > now) return true;
    return false;
  });

  // Live: not completed, live window
  const liveNowExams = visibleExams.filter((e) => {
    if (isCompleted(e)) return false;
    const { start, end } = getSchedule(e);
    if (e.status === 'scheduled') return false;
    if (!start && !end) {
      return e.status === 'live';
    }
    const s = start ? start.getTime() : -Infinity;
    const en = end ? end.getTime() : Infinity;
    return now >= s && now <= en;
  });

  // Past: completed by user OR time ended
  const pastExams = visibleExams.filter((e) => {
    if (isCompleted(e)) return true;
    const { end, start } = getSchedule(e);
    if (end) return end.getTime() < now;
    if (start && e.duration) {
      const assumedEnd = new Date(start.getTime() + e.duration * 60000);
      return assumedEnd.getTime() < now;
    }
    return false;
  });

  return (
    <div className="space-y-6 font-bengali">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-0 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-display">📝 পরীক্ষা কেন্দ্র</h1>
          <p className="mt-1 text-sm text-white/80">লাইভ পরীক্ষায় অংশগ্রহণ করুন এবং আপনার ফলাফল দেখুন</p>
        </div>
      </div>

      {/* Exam Sections */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <BeautifulLoader message="পরীক্ষা লোড করছি..." className="w-full" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "upcoming" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              আসন্ন পরীক্ষা ({upcomingExams.length})
            </button>
            <button
              onClick={() => setActiveTab("live")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "live" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              চলমান পরীক্ষা ({liveNowExams.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "past" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              সম্পন্ন পরীক্ষা ({pastExams.length})
            </button>
          </div>

          {/* Upcoming Exams */}
          {activeTab === "upcoming" && (
            <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">আসন্ন পরীক্ষা</h2>
              <span className="text-sm text-muted-foreground">{upcomingExams.length} টি</span>
            </div>
            {upcomingExams.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
                  কোন আসন্ন পরীক্ষা নেই
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcomingExams.map((exam, index) => {
                  const { start } = getSchedule(exam);
                  return (
                    <motion.div key={exam._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Card className="rounded-2xl border hover:shadow-md transition-all min-w-0">
                        <CardContent className="p-5 space-y-3 min-w-0">
                          <div>
                            <h3 className="font-bold text-base">{exam.title}</h3>
                            <p className="text-sm text-muted-foreground">বিষয় / অধ্যায়: {exam.description || "উল্লেখ নেই"}</p>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-4 w-4" /> সময়কাল
                              </span>
                              <span className="font-semibold">{exam.duration} মিনিট</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" /> শুরু
                              </span>
                              <span className="font-semibold">{formatDateTime(start)}</span>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full" onClick={() => navigate(`/exam/${exam._id}/instructions?upcoming=true`)}>
                            বিস্তারিত দেখুন
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
            </section>
          )}

          {/* Live Exams */}
          {activeTab === "live" && (
            <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">চলমান পরীক্ষা</h2>
              <span className="text-sm text-muted-foreground">{liveNowExams.length} টি</span>
            </div>
            {liveNowExams.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
                  কোন চলমান পরীক্ষা নেই
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {liveNowExams.map((exam, index) => {
                  const { end } = getSchedule(exam);
                  const inProgress = inProgressExamIds.includes(exam._id);
                  return (
                    <motion.div key={exam._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Card className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 min-w-0">
                        <CardContent className="p-5 space-y-3 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base">{exam.title}</h3>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">লাইভ</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-4 w-4" /> সময় বাকি
                              </span>
                              <span className="font-semibold">{formatTimeRemaining(end)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <FileText className="h-4 w-4" /> মোট প্রশ্ন
                              </span>
                              <span className="font-semibold">{exam.questionIds?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Trophy className="h-4 w-4" /> সময়কাল
                              </span>
                              <span className="font-semibold">{exam.duration} মিনিট</span>
                            </div>
                          </div>
                          <Button className="w-full" onClick={() => navigate(`/exam/${exam._id}/instructions`)}>
                            <Play className="h-4 w-4 mr-2" /> {inProgress ? "পরীক্ষা চালিয়ে যান" : "পরীক্ষা শুরু করুন"}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
            </section>
          )}

          {/* Past Exams */}
          {activeTab === "past" && (
            <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">সম্পন্ন পরীক্ষা</h2>
              <span className="text-sm text-muted-foreground">{pastExams.length} টি</span>
            </div>
            {pastExams.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
                  কোন সম্পন্ন পরীক্ষা নেই
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {pastExams.map((exam, index) => {
                  const result = examResults[exam._id];
                  const passed = result ? result.percentage >= 50 : false;
                  return (
                    <motion.div key={exam._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Card className="rounded-2xl border min-w-0">
                        <CardContent className="p-5 space-y-3 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base">{exam.title}</h3>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {passed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Trophy className="h-4 w-4" /> প্রাপ্ত নম্বর
                              </span>
                              <span className="font-semibold">{result ? result.score : 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <FileText className="h-4 w-4" /> মোট নম্বর
                              </span>
                              <span className="font-semibold">{result ? result.totalMarks : exam.totalMarks}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 min-w-0">
                            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                              <Button variant="outline" className="w-full sm:flex-1 min-w-0" onClick={() => navigate(`/exam-result/${exam._id}`)}>
                                <Eye className="h-4 w-4 mr-1" /> ফলাফল দেখুন
                              </Button>
                              <Button className="w-full sm:flex-1 min-w-0" onClick={() => navigate(`/exam-result/${exam._id}`)}>
                                <BookOpen className="h-4 w-4 mr-1" /> উত্তরপত্র দেখুন
                              </Button>
                            </div>
                            <Button variant="outline" className="w-full min-w-0" onClick={() => navigate(`/exam/${exam._id}/instructions`)}>
                              পুনরায় পরীক্ষা দিন
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamList;
