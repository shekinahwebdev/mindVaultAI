import { LandingCosmicBackdrop } from "./LandingCosmicBackdrop";
import { LandingFeaturesRow } from "./LandingFeaturesRow";
import { HeroSection } from "./HeroSection";
import { MarketingHeader } from "./MarketingHeader";

export function LandingPage() {
  return (
    <div className="landing-page landing-page--viewport relative flex h-svh max-h-[100dvh] flex-col overflow-hidden bg-black text-white">
      <LandingCosmicBackdrop />
      <MarketingHeader />
      <main
        id="main-content"
        className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-[var(--mv-page-padding-x)] py-3 sm:py-4 lg:px-[max(2.5rem,6vw)]"
      >
        <HeroSection />
      </main>
      <LandingFeaturesRow className="landing-features-row--compact shrink-0" />
    </div>
  );
}
