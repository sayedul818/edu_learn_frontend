import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { coursesAPI } from "@/services/api";

type StudentCourse = {
  courseId: string;
  courseTitle: string;
  teacherName?: string;
  examIds?: string[];
};

type StudentCourseContextValue = {
  courses: StudentCourse[];
  selectedCourseId: string;
  selectedCourse: StudentCourse | null;
  selectedCourseExamIds: string[];
  setSelectedCourseId: (courseId: string) => void;
  refreshCourses: () => Promise<void>;
};

const StudentCourseContext = createContext<StudentCourseContextValue>({
  courses: [],
  selectedCourseId: "",
  selectedCourse: null,
  selectedCourseExamIds: [],
  setSelectedCourseId: () => {},
  refreshCourses: async () => {},
});

const getStorageKey = (userId: string) => `selectedCourse_${userId}`;

export const StudentCourseProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseIdState] = useState("");

  const userId = String(user?.id || (user as any)?._id || "anon");
  const isStudent = user?.role === "student";

  const setSelectedCourseId = (courseId: string) => {
    setSelectedCourseIdState(courseId);
    try {
      localStorage.setItem(getStorageKey(userId), courseId);
    } catch {
      // no-op
    }
  };

  const refreshCourses = async () => {
    if (!isStudent) {
      setCourses([]);
      setSelectedCourseIdState("");
      return;
    }

    try {
      const response = await coursesAPI.listMyEnrolled();
      const rows = Array.isArray(response?.data) ? response.data : [];
      const normalized: StudentCourse[] = rows.map((item: any) => ({
        courseId: String(item.courseId || ""),
        courseTitle: String(item.courseTitle || "Course"),
        teacherName: item.teacherName ? String(item.teacherName) : "Teacher",
        examIds: Array.isArray(item.examIds) ? item.examIds.map((id: any) => String(id)).filter(Boolean) : [],
      })).filter((item) => Boolean(item.courseId));

      setCourses(normalized);

      let nextSelected = "";
      try {
        nextSelected = localStorage.getItem(getStorageKey(userId)) || "";
      } catch {
        nextSelected = "";
      }

      if (!nextSelected || !normalized.some((item) => item.courseId === nextSelected)) {
        nextSelected = normalized[0]?.courseId || "";
      }
      setSelectedCourseIdState(nextSelected);
    } catch {
      setCourses([]);
      setSelectedCourseIdState("");
    }
  };

  useEffect(() => {
    refreshCourses();
  }, [userId, isStudent]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.courseId === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const value = useMemo<StudentCourseContextValue>(() => ({
    courses,
    selectedCourseId,
    selectedCourse,
    selectedCourseExamIds: selectedCourse?.examIds || [],
    setSelectedCourseId,
    refreshCourses,
  }), [courses, selectedCourseId, selectedCourse]);

  return (
    <StudentCourseContext.Provider value={value}>
      {children}
    </StudentCourseContext.Provider>
  );
};

export const useStudentCourse = () => useContext(StudentCourseContext);
