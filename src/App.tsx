import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import QuestionBank from "./pages/student/QuestionBank";
import QuestionListing from "./pages/student/QuestionListing";
import SelfTest from "./pages/student/SelfTest";
import ExamList from "./pages/student/ExamList";
import ExamInstructions from "./pages/student/ExamInstructions";
import TakeExam from "./pages/student/TakeExam";
import ExamResult from "./pages/student/ExamResult";
import MyResults from "./pages/student/MyResults";
import Leaderboard from "./pages/student/Leaderboard";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateQuestion from "./pages/teacher/CreateQuestion";
import TeacherQuestions from "./pages/teacher/TeacherQuestions";
import TeacherExams from "./pages/teacher/TeacherExams";
import StudentReports from "./pages/teacher/StudentReports";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminQuestionListing from "./pages/admin/AdminQuestionListing";
import AdminExamBuilder from "./pages/admin/AdminExamBuilder";
import AdminAllExams from "./pages/admin/AdminAllExams";
import AdminSections from "./pages/admin/AdminSections";
import AdminCreateSection from "./pages/admin/AdminCreateSection";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "teacher") return <TeacherDashboard />;
  return <StudentDashboard />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* Dashboard */}
    <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

    {/* Student */}
    <Route path="/questions" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
    <Route path="/questions/:subjectId/:chapterId" element={<ProtectedRoute><QuestionListing /></ProtectedRoute>} />
    <Route path="/self-test" element={<ProtectedRoute><SelfTest /></ProtectedRoute>} />
    <Route path="/exams" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
    <Route path="/exam/:examId/instructions" element={<ProtectedRoute><ExamInstructions /></ProtectedRoute>} />
    <Route path="/exam/:examId" element={<ProtectedRoute><TakeExam /></ProtectedRoute>} />
    <Route path="/exam-result/:examId" element={<ProtectedRoute><ExamResult /></ProtectedRoute>} />
    <Route path="/results" element={<ProtectedRoute><MyResults /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

    {/* Teacher */}
    <Route path="/teacher/questions" element={<ProtectedRoute><TeacherQuestions /></ProtectedRoute>} />
    <Route path="/teacher/create-question" element={<ProtectedRoute><CreateQuestion /></ProtectedRoute>} />
    <Route path="/teacher/exams" element={<ProtectedRoute><TeacherExams /></ProtectedRoute>} />
    <Route path="/teacher/reports" element={<ProtectedRoute><StudentReports /></ProtectedRoute>} />

    {/* Admin */}
    <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/questions" element={<ProtectedRoute><AdminQuestions /></ProtectedRoute>} />
    <Route path="/admin/questions/:subjectId/:chapterId" element={<ProtectedRoute><AdminQuestionListing /></ProtectedRoute>} />
    <Route path="/admin/exams/builder" element={<ProtectedRoute><AdminExamBuilder /></ProtectedRoute>} />
    <Route path="/admin/sections" element={<ProtectedRoute><AdminSections /></ProtectedRoute>} />
    <Route path="/admin/sections/create" element={<ProtectedRoute><AdminCreateSection /></ProtectedRoute>} />
    <Route path="/admin/sections/:id/edit" element={<ProtectedRoute><AdminCreateSection /></ProtectedRoute>} />
    <Route path="/admin/exams" element={<ProtectedRoute><AdminAllExams /></ProtectedRoute>} />
    <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
    <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
