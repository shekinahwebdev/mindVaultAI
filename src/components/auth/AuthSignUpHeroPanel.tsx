import Image from "next/image";

/** Wide black canvas + centered phone mockup (864×1152, 3:4) */
export const SIGN_UP_HERO_ART = "/marketing/sign-up-hero-art-portrait.png";

const HERO_W = 864;
const HERO_H = 1152;

export function AuthSignUpHeroPanel() {
  return (
    <div className="relative h-full min-h-[inherit] w-full bg-black">
      <Image
        src={SIGN_UP_HERO_ART}
        alt="Save, understand, and use your knowledge with MindVault"
        width={HERO_W}
        height={HERO_H}
        unoptimized
        priority
        quality={100}
        className="absolute inset-0 h-full w-full object-contain object-center p-6 sm:p-8 lg:p-10"
        sizes="50vw"
      />
    </div>
  );
}
