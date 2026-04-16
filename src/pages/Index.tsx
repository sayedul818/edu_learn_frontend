import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import StatisticsSection from "@/components/landing/StatisticsSection";
import DashboardPreviewSection from "@/components/landing/DashboardPreviewSection";
import CoursesSection from "@/components/landing/CoursesSection";
import LeaderboardSection from "@/components/landing/LeaderboardSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import ChatbotWidget from "@/components/landing/ChatbotWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatisticsSection />
      <DashboardPreviewSection />
      <HowItWorksSection />
      <CoursesSection />
      <LeaderboardSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default Index;
