import { VaultLandingHero } from "./hero/VaultLandingHero";
import { LandingCosmicBackdrop } from "./LandingCosmicBackdrop";
import { MarketingHeader } from "./MarketingHeader";

export function LandingPage() {
  return (
    <div className="landing-page landing-page--viewport relative flex min-h-dvh flex-col overflow-x-hidden bg-black text-white">
      <LandingCosmicBackdrop />
      <MarketingHeader onLanding primaryCtaLabel="Create account" />
      <main id="main-content" className="relative z-10 flex min-h-0 flex-1 flex-col">
        <VaultLandingHero />
      </main>
    </div>
  );
}
