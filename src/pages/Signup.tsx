import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name) errs.name = "Full name is required";
    if (!email) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
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
      await signup(name || "Demo User", email, password, role);
      navigate("/dashboard");
    } catch (err: any) {
      setApiError(err?.message || "Registration failed");
    }
  };

  return (
    <div className="dark min-h-screen relative flex items-center justify-center overflow-hidden bg-[#050505] px-4 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(240,90,40,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="text-left leading-tight">
              <span className="block text-2xl font-display font-bold">LearnSmart Prep</span>
              <span className="block text-xs text-white/60">Bangla First Learning Platform</span>
            </div>
          </Link>
          <h1 className="text-3xl font-display font-black tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-white/65">Start your journey with LearnSmart Prep</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-8 shadow-[0_28px_70px_rgba(0,0,0,0.55)]">
          <div className="flex gap-2 mb-6">
            {(["student", "teacher"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  role === r ? "bg-[#f05a28] text-white" : "bg-white/10 text-white/70"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name" className="text-white/85">Full Name {fieldErrors.name && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <Input id="name" placeholder="Your full name" className="mt-1 border-white/15 bg-black/40 text-white placeholder:text-white/35" value={name} onChange={(e) => setName(e.target.value)} />
              {fieldErrors.name && <p className="text-destructive text-sm mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-white/85">Email {fieldErrors.email && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1 border-white/15 bg-black/40 text-white placeholder:text-white/35" value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors.email && <p className="text-destructive text-sm mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-white/85">Password {fieldErrors.password && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" className="border-white/15 bg-black/40 text-white placeholder:text-white/35" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-destructive text-sm mt-1">{fieldErrors.password}</p>}
            </div>
            {/* Removed Exam Category: simplified signup — students and teachers use same form */}
            <Button className="w-full bg-[#f05a28] text-white hover:bg-[#e04e1f]" size="lg">Create Account</Button>
          </form>

          {apiError && (
            <div className="mt-4">
              <Alert variant="destructive">
                <AlertTitle>Registration error</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[#ff9f7c] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
