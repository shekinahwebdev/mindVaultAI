import Image from "next/image";

export const LANDING_COSMIC_BG = "/marketing/landing-cosmic-bg.png";

/**
 * Text-free cosmic photo — horizon, silhouette, arcs, starfield.
 */
export function LandingCosmicBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
      <Image
        src={LANDING_COSMIC_BG}
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="object-cover object-[72%_100%] sm:object-[64%_100%] lg:object-[56%_100%]"
      />

      {/* Light veil so the centered hero stays readable without hiding the horizon */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 via-[24%] to-black/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(0,0,0,0.42)_100%)]" />
    </div>
  );
}
