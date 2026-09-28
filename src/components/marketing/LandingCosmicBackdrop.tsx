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
        className="object-cover object-[62%_50%] sm:object-[58%_48%] lg:object-[55%_46%]"
      />

      {/* Readability for left-aligned hero — no longer masking baked mock text */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/92 from-0% via-black/55 via-[38%] to-transparent to-[72%]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 from-0% via-transparent via-[18%] to-black/45 to-100%" />
    </div>
  );
}
