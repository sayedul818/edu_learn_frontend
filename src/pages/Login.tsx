import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const mockCreds: Record<string, { email: string; password: string; label: string }> = {
    student: { email: 'student@demo.test', password: 'Student123!', label: 'Student' },
    teacher: { email: 'teacher@demo.test', password: 'Teacher123!', label: 'Teacher' },
    admin: { email: 'admin@local.test', password: 'ChangeMe123!', label: 'Administrator' },
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      setTimeout(() => document.getElementById(first)?.focus(), 0);
      return;
    }

    try {
      await login(email, password);
      toast({ title: "Signed in", description: `Welcome back`, variant: "default" });
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      setApiError(msg);
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    }
  };

  const handleQuickSignIn = async (key: keyof typeof mockCreds) => {
    const cred = mockCreds[key];
    setEmail(cred.email);
    setPassword(cred.password);
    setFieldErrors({});
    setApiError(null);
    try {
      await login(cred.email, cred.password);
      toast({ title: `Signed in as ${cred.label}`, variant: 'default' });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      setApiError(msg);
      toast({ title: 'Login failed', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-hero-gradient flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold">ExamPro</span>
          </Link>
          <h1 className="text-2xl font-display font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to continue your preparation</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-8">
          {/* Single unified login form for all roles (use credentials to authenticate) */}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => handleQuickSignIn('student')} className="flex-1 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground">Sign in as Student</button>
              <button type="button" onClick={() => handleQuickSignIn('teacher')} className="flex-1 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground">Sign in as Teacher</button>
              <button type="button" onClick={() => handleQuickSignIn('admin')} className="flex-1 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive">Sign in as Admin</button>
            </div>
            <div>
              <Label htmlFor="email">Email {fieldErrors.email && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors.email && <p className="text-destructive text-sm mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password {fieldErrors.password && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-destructive text-sm mt-1">{fieldErrors.password}</p>}
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <a href="#" className="text-primary hover:underline">Forgot password?</a>
            </div>
            <Button className="w-full" size="lg">Sign In</Button>
          </form>

          {/* keep field-level inline errors, general API errors are shown as toasts */}

          <p className="text-xs text-muted-foreground text-center mt-4">
            Demo: Select any role and click Sign In (use registered credentials to login)
          </p>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
