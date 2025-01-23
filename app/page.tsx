"use client"

import Footer from "@/components/app/footer";
import AboutSection from "@/components/app/home/aboutSection";
import IdealProjectsSection from "@/components/app/home/idealProjectsSection";
import OurTeamSection from "@/components/app/home/ourTeamSection";
import PartnerBuisnessSection from "@/components/app/home/partnerBuisnessSection";
import PortfolioSection from "@/components/app/home/portfolioSection";
import TitleSection from "@/components/app/home/titleSection";
import { useLayout } from "@/lib/context/layoutContext";

/**
 * Home page component that adjusts its height based on section translations
 */
export default function Home() {
  const { totalTranslation } = useLayout();
  return (
    <div 
      className="h-fit"
      style={{ 
        height: `calc(100vh - ${totalTranslation}px)`,
        marginBottom: `-${totalTranslation}px`
      }}
    >
      <TitleSection />
      <AboutSection />
      <PortfolioSection />
      <IdealProjectsSection />
      <OurTeamSection />
      {/* <PartnerBuisnessSection /> */}
      <Footer layer={5} />
    </div>
  );
}
