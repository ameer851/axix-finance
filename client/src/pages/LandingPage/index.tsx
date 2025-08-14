import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import Navbar from "@/components/landing/Navbar";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import React from "react";
// Tip: Configure VITE_LANDING_VIDEO_URL in your .env to control the video src
import Certificates from "@/components/landing/Certificates";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import Pricing from "@/components/landing/Pricing";
import Team from "@/components/landing/Team";
import Testimonials from "@/components/landing/Testimonials";
import TopTradesSection from "@/components/landing/TopTradesSection";
import VideoSection from "@/components/landing/Video";
import WinPrizesSection from "@/components/landing/WinPrizesSection";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <WhyChooseUs />
        <VideoSection />
        <TopTradesSection />
        <WinPrizesSection />
        <Pricing />
        <Testimonials />
        <Team />
        <Certificates />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
