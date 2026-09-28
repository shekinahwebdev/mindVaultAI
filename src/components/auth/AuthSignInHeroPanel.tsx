import Image from "next/image";

export const SIGN_IN_HERO_BG = "/marketing/sign-in-hero-bg.png";

export function AuthSignInHeroPanel() {
  return (
    <div className="relative h-full min-h-[inherit] w-full overflow-hidden bg-black">
      <Image
        src={SIGN_IN_HERO_BG}
        alt=""
        fill
        unoptimized
        priority
        className="object-cover object-center"
        sizes="50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50% at_30%_85%,rgba(0,0,0,0.55)_0%,transparent_55%)]" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-8 sm:p-10 lg:p-12">
        <p className="max-w-[18rem] text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:max-w-[20rem] sm:text-[1.5rem]">
          Same thoughts,
          <br />
          more clarity.
        </p>
        <p className="mt-3 max-w-[16rem] text-[0.8125rem] leading-relaxed text-white/50 sm:max-w-[18rem]">
          Pick up right where you left off — on any device.
        </p>
      </div>
    </div>
  );
}
