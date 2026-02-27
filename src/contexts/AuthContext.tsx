import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "../services/api";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("exampro_user");
    return saved ? JSON.parse(saved) : null;
  });

  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    if (res?.token) {
      localStorage.setItem('authToken', res.token);
    }
    if (res?.user) {
      setUser(res.user);
      localStorage.setItem('exampro_user', JSON.stringify(res.user));
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
    const res = await authAPI.register({ name, email, password, role });
    if (res?.token) localStorage.setItem('authToken', res.token);
    if (res?.user) {
      setUser(res.user);
      localStorage.setItem('exampro_user', JSON.stringify(res.user));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("exampro_user");
    localStorage.removeItem('authToken');
    // show a small toast notification
    try {
      toast({ title: 'Signed out', description: 'You have been logged out', variant: 'default' });
    } catch (e) {
      // noop
    }
  };

  // Migrate legacy, shared local/session storage keys to user-scoped keys when a user becomes available.
  // This prevents cached results from one user leaking into another user's session on the same browser.
  useEffect(() => {
    if (!user) return;
    try {
      const uid = (user as any).id || (user as any)._id || 'anon';

      // examResults
      const legacyResults = localStorage.getItem('examResults');
      const targetResultsKey = `examResults_${uid}`;
      if (legacyResults && !localStorage.getItem(targetResultsKey)) {
        localStorage.setItem(targetResultsKey, legacyResults);
        localStorage.removeItem('examResults');
      }

      // completedExams
      const legacyCompleted = localStorage.getItem('completedExams');
      const targetCompletedKey = `completedExams_${uid}`;
      if (legacyCompleted && !localStorage.getItem(targetCompletedKey)) {
        localStorage.setItem(targetCompletedKey, legacyCompleted);
        localStorage.removeItem('completedExams');
      }

      // lastExamResult (session)
      const legacyLast = sessionStorage.getItem('lastExamResult');
      const targetLastKey = `lastExamResult_${uid}`;
      if (legacyLast && !sessionStorage.getItem(targetLastKey)) {
        sessionStorage.setItem(targetLastKey, legacyLast);
        sessionStorage.removeItem('lastExamResult');
      }
    } catch (e) {
      // Do not block auth flow on migration errors
      console.error('Failed to migrate legacy storage keys', e);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
