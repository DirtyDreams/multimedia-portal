import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ContentShowcase } from "@/components/landing/content-showcase";
import { CallToAction } from "@/components/landing/call-to-action";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ContentShowcase />
      <CallToAction />
    </>
  );
}
