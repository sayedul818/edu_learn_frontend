import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen, LayoutDashboard, FileText, ClipboardList, BarChart3,
  Trophy, Settings, LogOut, Menu, X, Users, PlusCircle, ChevronDown,
  Shield, Bell, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Question Bank", href: "/questions", icon: <FileText className="h-5 w-5" /> },
  { label: "Self Test", href: "/self-test", icon: <Target className="h-5 w-5" /> },
  { label: "Exams", href: "/exams", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "My Results", href: "/results", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Leaderboard", href: "/leaderboard", icon: <Trophy className="h-5 w-5" /> },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Questions", href: "/teacher/questions", icon: <FileText className="h-5 w-5" /> },
  { label: "Create Question", href: "/teacher/create-question", icon: <PlusCircle className="h-5 w-5" /> },
  { label: "Exams", href: "/teacher/exams", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "Student Reports", href: "/teacher/reports", icon: <BarChart3 className="h-5 w-5" /> },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
  { label: "Sections", href: "/admin/sections", icon: <PlusCircle className="h-5 w-5" /> },
  { label: "Questions", href: "/admin/questions", icon: <FileText className="h-5 w-5" /> },
  { label: "Exam", href: "/admin/exams/builder", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "All Exams", href: "/admin/exams", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;

  const navItems = user.role === "admin" ? adminNav : user.role === "teacher" ? teacherNav : studentNav;

  const roleColors = {
    student: "bg-primary",
    teacher: "bg-accent",
    admin: "bg-destructive",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-hero-gradient flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">ExamPro</span>
            <button className="lg:hidden ml-auto text-muted-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
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
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </button>

            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                <div className={`h-8 w-8 rounded-full ${roleColors[user.role]} flex items-center justify-center text-primary-foreground text-sm font-bold`}>
                   {user?.name?.charAt(0) || '?'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg border border-border shadow-card-hover py-1 z-50">
                  <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
