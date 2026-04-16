import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-hero-gradient flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-bold">ExamPathshala</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              স্মার্ট লার্নিং, পরীক্ষা জয়ের সেরা পথ।
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4">আমাদের সম্পর্কে</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">বৈশিষ্ট্য</a></li>
              <li><a href="#courses" className="hover:text-foreground transition-colors">কোর্স</a></li>
              <li><a href="#leaderboard" className="hover:text-foreground transition-colors">লিডারবোর্ড</a></li>
              <li><a href="#dashboard-preview" className="hover:text-foreground transition-colors">ড্যাশবোর্ড</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4">যোগাযোগ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">সাহায্য কেন্দ্র</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">ইমেইল</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">ফেসবুক</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">ফোন</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4">নীতিমালা</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">গোপনীয়তা নীতি</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">শর্তাবলী</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">ব্যবহার নির্দেশিকা</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">কুকি নীতি</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ExamPathshala. সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
