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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-hero-gradient flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold">ExamPro</span>
          </Link>
          <h1 className="text-2xl font-display font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Start your exam preparation journey</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-8">
          <div className="flex gap-2 mb-6">
            {(["student", "teacher"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  role === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">Full Name {fieldErrors.name && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <Input id="name" placeholder="Your full name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              {fieldErrors.name && <p className="text-destructive text-sm mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email {fieldErrors.email && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors.email && <p className="text-destructive text-sm mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password {fieldErrors.password && <AlertCircle className="inline-block ml-2 text-destructive" />}</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-destructive text-sm mt-1">{fieldErrors.password}</p>}
            </div>
            {/* Removed Exam Category: simplified signup — students and teachers use same form */}
            <Button className="w-full" size="lg">Create Account</Button>
          </form>

          {apiError && (
            <div className="mt-4">
              <Alert variant="destructive">
                <AlertTitle>Registration error</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
