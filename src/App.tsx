import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StudentCourseProvider } from "@/contexts/StudentCourseContext";
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
import StudentProfile from "./pages/student/StudentProfile";
import CourseJoin from "./pages/student/CourseJoin";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentAssignmentSubmission from "./pages/student/StudentAssignmentSubmission";
import StudentMaterials from "./pages/student/StudentMaterials";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import StudentMessages from "./pages/student/StudentMessages";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateQuestion from "./pages/teacher/CreateQuestion";
import TeacherQuestions from "./pages/teacher/TeacherQuestions";
import StudentReports from "./pages/teacher/StudentReports";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherCourseDetails from "./pages/teacher/TeacherCourseDetails";
import TeacherStudentPerformance from "./pages/teacher/TeacherStudentPerformance.tsx";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherEnrollments from "./pages/teacher/TeacherEnrollments";
import TeacherMessages from "./pages/teacher/TeacherMessages";

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
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import AdminOfflineExamBuilder from "./pages/admin/AdminOfflineExamBuilder";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <StudentCourseProvider><DashboardLayout>{children}</DashboardLayout></StudentCourseProvider>;
};

const RoleRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Array<"student" | "teacher" | "admin">;
}) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <StudentCourseProvider><DashboardLayout>{children}</DashboardLayout></StudentCourseProvider>;
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
    <Route path="/assignments" element={<RoleRoute allowedRoles={["student"]}><StudentAssignments /></RoleRoute>} />
    <Route path="/assignments/:assignmentId" element={<RoleRoute allowedRoles={["student"]}><StudentAssignmentSubmission /></RoleRoute>} />
    <Route path="/announcements" element={<RoleRoute allowedRoles={["student"]}><StudentAnnouncements /></RoleRoute>} />
    <Route path="/messages" element={<RoleRoute allowedRoles={["student"]}><StudentMessages /></RoleRoute>} />
    <Route path="/materials" element={<RoleRoute allowedRoles={["student"]}><StudentMaterials /></RoleRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
    <Route path="/course-join/:token" element={<ProtectedRoute><CourseJoin /></ProtectedRoute>} />

    {/* Teacher */}
    <Route path="/teacher/courses" element={<RoleRoute allowedRoles={["teacher"]}><TeacherCourses /></RoleRoute>} />
    <Route path="/teacher/courses/create" element={<RoleRoute allowedRoles={["teacher"]}><TeacherCourses /></RoleRoute>} />
    <Route path="/teacher/courses/:courseId" element={<RoleRoute allowedRoles={["teacher"]}><TeacherCourseDetails /></RoleRoute>} />
    <Route path="/teacher/courses/:courseId/students/:studentId/performance" element={<RoleRoute allowedRoles={["teacher"]}><TeacherStudentPerformance /></RoleRoute>} />
    <Route path="/teacher/students" element={<RoleRoute allowedRoles={["teacher"]}><TeacherStudents /></RoleRoute>} />
    <Route path="/teacher/enrollments" element={<RoleRoute allowedRoles={["teacher"]}><TeacherEnrollments /></RoleRoute>} />
    <Route path="/teacher/messages" element={<RoleRoute allowedRoles={["teacher"]}><TeacherMessages /></RoleRoute>} />
    <Route path="/teacher/questions" element={<RoleRoute allowedRoles={["teacher"]}><AdminQuestions /></RoleRoute>} />
    <Route path="/teacher/questions/:subjectId/:chapterId" element={<RoleRoute allowedRoles={["teacher"]}><AdminQuestionListing /></RoleRoute>} />
    <Route path="/teacher/create-question" element={<RoleRoute allowedRoles={["teacher"]}><CreateQuestion /></RoleRoute>} />
    <Route path="/teacher/exams/builder" element={<RoleRoute allowedRoles={["teacher"]}><AdminExamBuilder /></RoleRoute>} />
    <Route path="/teacher/offline-exam/create/:examId" element={<RoleRoute allowedRoles={["teacher"]}><AdminOfflineExamBuilder /></RoleRoute>} />
    <Route path="/teacher/sections" element={<RoleRoute allowedRoles={["teacher"]}><AdminSections /></RoleRoute>} />
    <Route path="/teacher/sections/create" element={<RoleRoute allowedRoles={["teacher"]}><AdminCreateSection /></RoleRoute>} />
    <Route path="/teacher/sections/:id/edit" element={<RoleRoute allowedRoles={["teacher"]}><AdminCreateSection /></RoleRoute>} />
    <Route path="/teacher/leaderboard" element={<RoleRoute allowedRoles={["teacher"]}><AdminLeaderboard /></RoleRoute>} />
    <Route path="/teacher/analytics" element={<RoleRoute allowedRoles={["teacher"]}><AdminAnalytics /></RoleRoute>} />
    <Route path="/teacher/settings" element={<RoleRoute allowedRoles={["teacher"]}><AdminSettings /></RoleRoute>} />
    <Route path="/teacher/reports" element={<RoleRoute allowedRoles={["teacher"]}><StudentReports /></RoleRoute>} />

    {/* Admin */}
    <Route path="/admin/users" element={<RoleRoute allowedRoles={["admin"]}><AdminUsers /></RoleRoute>} />
    <Route path="/admin/questions" element={<RoleRoute allowedRoles={["admin"]}><AdminQuestions /></RoleRoute>} />
    <Route path="/admin/questions/:subjectId/:chapterId" element={<RoleRoute allowedRoles={["admin"]}><AdminQuestionListing /></RoleRoute>} />
    <Route path="/admin/create-question" element={<RoleRoute allowedRoles={["admin"]}><CreateQuestion /></RoleRoute>} />
    <Route path="/admin/exams/builder" element={<RoleRoute allowedRoles={["admin"]}><AdminExamBuilder /></RoleRoute>} />
    <Route path="/admin/sections" element={<RoleRoute allowedRoles={["admin"]}><AdminSections /></RoleRoute>} />
    <Route path="/admin/sections/create" element={<RoleRoute allowedRoles={["admin"]}><AdminCreateSection /></RoleRoute>} />
    <Route path="/admin/sections/:id/edit" element={<RoleRoute allowedRoles={["admin"]}><AdminCreateSection /></RoleRoute>} />
    <Route path="/admin/exams" element={<RoleRoute allowedRoles={["admin"]}><AdminAllExams /></RoleRoute>} />
    <Route path="/admin/offline-exam/create/:examId" element={<RoleRoute allowedRoles={["admin"]}><AdminOfflineExamBuilder /></RoleRoute>} />
    <Route path="/offline-exam/:examId" element={<ProtectedRoute><AdminOfflineExamBuilder /></ProtectedRoute>} />
    <Route path="/admin/leaderboard" element={<RoleRoute allowedRoles={["admin"]}><AdminLeaderboard /></RoleRoute>} />
    <Route path="/admin/analytics" element={<RoleRoute allowedRoles={["admin"]}><AdminAnalytics /></RoleRoute>} />
    <Route path="/admin/settings" element={<RoleRoute allowedRoles={["admin"]}><AdminSettings /></RoleRoute>} />

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
