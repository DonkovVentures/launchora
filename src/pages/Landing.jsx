import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import ProductTypes from '@/components/landing/ProductTypes';
import Platforms from '@/components/landing/Platforms';
import WhyLaunchora from '@/components/landing/WhyLaunchora';
import PricingSection from '@/components/landing/PricingSection';
import FAQ from '@/components/landing/FAQ';
import FinalCTA from '@/components/landing/FinalCTA';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ProductTypes />
        <Platforms />
        <WhyLaunchora />
        <PricingSection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}