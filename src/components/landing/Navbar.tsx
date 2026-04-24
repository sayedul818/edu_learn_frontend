import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "হোম", href: "#" },
    { label: "ফিচার", href: "#features" },
    { label: "কোর্স", href: "#courses" },
    { label: "প্রশ্নোত্তর", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/96 backdrop-blur-md">
      <div className="container mx-auto h-20 px-4">
        <div className="relative flex h-full items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/5">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="hidden h-7 w-px bg-white/20 sm:block" />
            <div className="leading-tight">
              <span className="block text-xl font-display font-bold tracking-tight">LearnSmart Prep</span>
              <span className="hidden text-[11px] text-white/60 sm:block">Bangla First Learning Platform</span>
            </div>
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
            <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-[#0d0d0f] px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>

          <button className="text-white md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="space-y-3 border-b border-white/10 bg-black px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
