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


  return (
    <div className="dark min-h-screen relative flex items-center justify-center overflow-hidden bg-[#050505] px-4 py-10 text-white">
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
          <h1 className="text-3xl font-display font-black tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-white/65">Sign in to continue your preparation journey</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-8 shadow-[0_28px_70px_rgba(0,0,0,0.55)]">
          {/* Single unified login form for all roles (use credentials to authenticate) */}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="text-white/85">Email {fieldErrors.email && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1 border-white/15 bg-black/40 text-white placeholder:text-white/35" value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors.email && <p className="text-destructive text-sm mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-white/85">Password {fieldErrors.password && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="border-white/15 bg-black/40 text-white placeholder:text-white/35" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-destructive text-sm mt-1">{fieldErrors.password}</p>}
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/60">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <a href="#" className="text-[#ff9f7c] hover:underline">Forgot password?</a>
            </div>
            <Button className="w-full bg-[#f05a28] text-white hover:bg-[#e04e1f]" size="lg">Sign In</Button>
          </form>

          {/* keep field-level inline errors, general API errors are shown as toasts */}

          

          <p className="mt-6 text-center text-sm text-white/60">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-[#ff9f7c] hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
