import React from 'react';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import WhyChooseUs from '@/components/landing/WhyChooseUs';
import VideoSection from '@/components/landing/Video';
import WinPrizesSection from '@/components/landing/WinPrizesSection';
import TopTradesSection from '@/components/landing/TopTradesSection';
import Pricing from '@/components/landing/Pricing';
import Testimonials from '@/components/landing/Testimonials';
import Team from '@/components/landing/Team';
import Certificates from '@/components/landing/Certificates';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
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
      <Footer />
    </div>
  );
};

export default LandingPage;
