import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentCourse } from "@/contexts/StudentCourseContext";
import {
  BookOpen, LayoutDashboard, FileText, ClipboardList, BarChart3,
  Trophy, Settings, LogOut, Menu, X, Users, PlusCircle, ChevronDown,
  Shield, Bell, Target, Sun, Moon, User, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
  { label: "Question Bank", href: "/questions", icon: <FileText className="h-5 w-5" /> },
  { label: "Self Test", href: "/self-test", icon: <Target className="h-5 w-5" /> },
  { label: "Exams", href: "/exams", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "Assignments", href: "/assignments", icon: <BookOpen className="h-5 w-5" /> },
  { label: "Leaderboard", href: "/leaderboard", icon: <Trophy className="h-5 w-5" /> },
  { label: "Announcements", href: "/announcements", icon: <Bell className="h-5 w-5" /> },
  { label: "Messages", href: "/messages", icon: <MessageCircle className="h-5 w-5" /> },
  { label: "Materials", href: "/materials", icon: <BookOpen className="h-5 w-5" /> },
  { label: "My Results", href: "/results", icon: <BarChart3 className="h-5 w-5" /> },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Courses", href: "/teacher/courses", icon: <BookOpen className="h-5 w-5" /> },
  { label: "Students", href: "/teacher/students", icon: <Users className="h-5 w-5" /> },
  { label: "Enrollments", href: "/teacher/enrollments", icon: <Shield className="h-5 w-5" /> },
  { label: "Question Bank", href: "/teacher/questions", icon: <FileText className="h-5 w-5" /> },
  { label: "Reports", href: "/teacher/reports", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Messages", href: "/teacher/messages", icon: <Bell className="h-5 w-5" /> },
  { label: "Settings", href: "/teacher/settings", icon: <Settings className="h-5 w-5" /> },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
  { label: "Sections", href: "/admin/sections", icon: <PlusCircle className="h-5 w-5" /> },
  { label: "Questions", href: "/admin/questions", icon: <FileText className="h-5 w-5" /> },
  { label: "Exam", href: "/admin/exams/builder", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "All Exams", href: "/admin/exams", icon: <ClipboardList className="h-5 w-5" /> },
    { label: "Leaderboard", href: "/admin/leaderboard", icon: <Trophy className="h-5 w-5" /> },
  { label: "Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { courses, selectedCourseId, setSelectedCourseId, refreshCourses } = useStudentCourse();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [courseSwitcherOpen, setCourseSwitcherOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [joinToken, setJoinToken] = useState("");

  if (!user) return null;

  const navItems = user.role === "admin" ? adminNav : user.role === "teacher" ? teacherNav : studentNav;
  const panelButtonClass = user.role === "teacher" || user.role === "student" ? "panel-button-shell" : "";

  const roleColors = {
    student: "bg-sky-500/20 border border-sky-300/35 text-sky-100",
    teacher: "bg-emerald-500/20 border border-emerald-300/35 text-emerald-100",
    admin: "bg-rose-500/20 border border-rose-300/35 text-rose-100",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "?";
  const selectedCourse = courses.find((course) => course.courseId === selectedCourseId) || null;
  const courseCode = useMemo(() => {
    const title = selectedCourse?.courseTitle || "Course";
    const letters = title.replace(/[^A-Za-z0-9 ]/g, "").trim();
    if (!letters) return "CRS";
    const chunks = letters.split(/\s+/).filter(Boolean);
    if (chunks.length >= 2) {
      return `${chunks[0][0] || ""}${chunks[1][0] || ""}${chunks[2]?.[0] || ""}`.toUpperCase();
    }
    return letters.slice(0, 3).toUpperCase();
  }, [selectedCourse?.courseTitle]);

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) => {
      return (
        course.courseTitle.toLowerCase().includes(query) ||
        String(course.teacherName || "").toLowerCase().includes(query)
      );
    });
  }, [courseSearch, courses]);

  const openJoinByToken = () => {
    const raw = joinToken.trim();
    if (!raw) return;

    let token = raw;
    if (raw.includes("/")) {
      const parts = raw.split("/").filter(Boolean);
      token = parts[parts.length - 1] || raw;
    }
    token = token.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!token) return;

    setCourseSwitcherOpen(false);
    setJoinToken("");
    navigate(`/course-join/${token}`);
  };

  return (
    <div className={`relative flex min-h-screen overflow-x-hidden bg-background text-foreground ${panelButtonClass}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_30%),radial-gradient(circle_at_bottom_left,hsl(var(--accent)/0.12),transparent_28%)]" />
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card/90 backdrop-blur-xl transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] flex items-center justify-center shadow-glow">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-display font-bold text-foreground">LearnSmart Prep</span>
              <span className="text-[11px] text-muted-foreground">Smart learning, better outcomes.</span>
            </div>
            <button className="lg:hidden ml-auto text-muted-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="no-scrollbar flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "border border-white/20 bg-white/12 text-foreground backdrop-blur-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}

            {user.role === "student" && (
              <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3">
                <button
                  type="button"
                  onClick={() => setCourseSwitcherOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left backdrop-blur-md hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Current course</p>
                    <p className="truncate text-sm font-semibold text-foreground">{selectedCourse?.courseTitle || "Select Course"}</p>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-semibold text-foreground">{courseCode}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${courseSwitcherOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {courseSwitcherOpen && (
                  <div className="mt-3 space-y-3">
                    <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                      {filteredCourses.map((course) => {
                        const short = (course.courseTitle || "").slice(0, 3).toUpperCase();
                        const active = String(course.courseId) === String(selectedCourseId);
                        return (
                          <button
                            key={course.courseId}
                            type="button"
                            onClick={() => {
                              setSelectedCourseId(course.courseId);
                              setCourseSwitcherOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${active ? "border-white/25 bg-white/12" : "border-border/60 hover:bg-muted/30"}`}
                          >
                            <div>
                              <p className="text-sm font-medium">{short} - {course.courseTitle}</p>
                              <p className="text-xs text-muted-foreground">{course.teacherName || "Teacher"}</p>
                            </div>
                            {active ? <span className="text-xs font-semibold text-foreground">Active</span> : null}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-border/70 pt-3">
                      <p className="mb-2 text-xs text-muted-foreground">Join Course</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Paste invite token"
                          value={joinToken}
                          onChange={(event) => setJoinToken(event.target.value)}
                        />
                        <Button size="sm" variant="glass" onClick={openJoinByToken}>Join</Button>
                      </div>
                      <Button
                        variant="glass"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={async () => {
                          await refreshCourses();
                        }}
                      >
                        Refresh Courses
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-border">
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full">
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="relative z-10 flex-1 min-w-0 lg:ml-64">
        {/* Top bar */}
        <header className="h-16 bg-card/85 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggleInline />
            <button className="relative rounded-lg border border-white/15 bg-white/5 p-2 text-muted-foreground backdrop-blur-md transition-colors hover:bg-white/10">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </button>

            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-white/10">
                <Avatar className="h-8 w-8 border border-border/70">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
                  <AvatarFallback className={`${roleColors[user.role]} text-sm font-bold`}>
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg border border-border shadow-card-hover py-1 z-50">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setProfileOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <User className="h-4 w-4" /> Profile
                  </button>
                  <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 overflow-x-hidden p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

  const ThemeToggleInline: React.FC = () => {
    const { theme, toggle } = useTheme();
    return (
      <button onClick={toggle} className="relative rounded-lg border border-white/15 bg-white/5 p-2 text-muted-foreground backdrop-blur-md transition-colors hover:bg-white/10" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    );
  };

export default DashboardLayout;
