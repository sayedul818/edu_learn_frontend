import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, BookOpen, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const navLinks = [
    { label: "হোম", href: "/" },
    { label: "ফিচার", href: "#features" },
    { label: "কোর্স", href: "/courses" },
    { label: "প্রশ্নোত্তর", href: "#faq" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${
      theme === "dark"
        ? "border-white/10 bg-black/96 backdrop-blur-md"
        : "border-black/10 bg-white/96 backdrop-blur-md"
    }`}>
      <div className="container mx-auto h-20 px-4">
        <div className="relative flex h-full items-center justify-between">
          <Link to="/" className={`flex items-center gap-3 ${theme === "dark" ? "text-white" : "text-black"}`}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              theme === "dark" ? "border-white/20 bg-white/5" : "border-black/20 bg-black/5"
            }`}>
              <BookOpen className="h-5 w-5" />
            </div>
            <span className={`hidden h-7 w-px ${theme === "dark" ? "bg-white/20" : "bg-black/20"} sm:block`} />
            <div className="leading-tight">
              <span className={`block text-xl font-display font-bold tracking-tight`}>ExamPathshala</span>
              <span className={`hidden text-[11px] ${theme === "dark" ? "text-white/60" : "text-black/60"} sm:block`}>
                Bangla First Learning Platform
              </span>
            </div>
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
            <div className={`flex items-center gap-1 rounded-xl border px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.55)] ${
              theme === "dark"
                ? "border-white/20 bg-[#0d0d0f]"
                : "border-black/20 bg-white/80"
            }`}>
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    theme === "dark"
                      ? "text-white/75 hover:bg-white/10 hover:text-white"
                      : "text-black/75 hover:bg-black/10 hover:text-black"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className={`hidden md:flex items-center gap-3`}>
            <button
              onClick={toggle}
              className={`flex items-center justify-center h-9 w-9 rounded-lg border transition-colors ${
                theme === "dark"
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  : "border-black/20 bg-black/10 text-black hover:bg-black/20"
              }`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Button variant="ghost" className={`${
              theme === "dark"
                ? "text-white hover:bg-white/10 hover:text-white"
                : "text-black hover:bg-black/10 hover:text-black"
            }`} asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>

          <button className={`${theme === "dark" ? "text-white" : "text-black"} md:hidden`} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={`space-y-3 border-b px-4 pb-4 md:hidden transition-colors ${
          theme === "dark"
            ? "border-white/10 bg-black"
            : "border-black/10 bg-white"
        }`}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-black/70 hover:bg-black/10 hover:text-black"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={toggle}
              className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium transition-colors ${
                theme === "dark"
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  : "border-black/20 bg-black/10 text-black hover:bg-black/20"
              }`}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </>
              )}
            </button>
            <Button variant="outline" className={`${
              theme === "dark"
                ? "border-white/20 text-white hover:bg-white/10"
                : "border-black/20 text-black hover:bg-black/10"
            }`} asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
