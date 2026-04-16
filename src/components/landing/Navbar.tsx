import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, BookOpen, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light" : "Dark"}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "বৈশিষ্ট্য", href: "#features" },
    { label: "কিভাবে কাজ করে", href: "#how-it-works" },
    { label: "কোর্স", href: "#courses" },
    { label: "র‍্যাঙ্কিং", href: "#leaderboard" },
    { label: "মতামত", href: "#testimonials" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-hero-gradient flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <span className="block text-xl font-display font-bold text-foreground">ExamPathshala</span>
            <span className="hidden sm:block text-[11px] text-muted-foreground">স্মার্ট লার্নিং, দ্রুত অগ্রগতি</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link to="/login">লগ ইন</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">শুরু করুন</Link>
          </Button>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link to="/login">লগ ইন</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">শুরু করুন</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
