import { LandingCosmicBackdrop } from "./LandingCosmicBackdrop";
import { LandingFeaturesRow } from "./LandingFeaturesRow";
import { HeroSection } from "./HeroSection";
import { MarketingHeader } from "./MarketingHeader";

export function LandingPage() {
  return (
    <div className="landing-page relative flex min-h-svh flex-col overflow-x-hidden bg-black text-white">
      <LandingCosmicBackdrop />
      <MarketingHeader />
      <main
        id="main-content"
        className="relative z-10 flex flex-1 flex-col justify-center px-[var(--mv-page-padding-x)] pb-6 pt-4 sm:pb-8 lg:px-[max(2.5rem,6vw)]"
      >
        <div className="mx-auto w-full max-w-6xl">
          <HeroSection />
        </div>
      </main>
      <LandingFeaturesRow />
    </div>
  );
}
