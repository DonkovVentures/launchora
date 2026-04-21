import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/landing/PricingSection';
import FinalCTA from '@/components/landing/FinalCTA';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}