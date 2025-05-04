import React from 'react';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Testimonials from '@/components/landing/Testimonials';
import Certificates from '@/components/landing/Certificates';
import Footer from '@/components/landing/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <Certificates />
      <Footer />
    </div>
  );
};

export default LandingPage;
