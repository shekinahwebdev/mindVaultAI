import { landingFeatureHighlights } from "@/lib/marketing/landing-content";
import { cn } from "@/lib/utils";

export function LandingFeaturesRow() {
  return (
    <section
      id="features"
      aria-labelledby="landing-features-heading"
      className="relative z-10 border-t border-white/[0.06] px-[var(--mv-page-padding-x)] pb-10 pt-8 sm:pb-12 sm:pt-10 lg:pb-14"
    >
      <h2 id="landing-features-heading" className="sr-only">
        Features
      </h2>
      <ul className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        {landingFeatureHighlights.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="min-w-0">
              <div
                aria-hidden
                className={cn(
                  "mb-4 flex size-11 items-center justify-center rounded-[var(--landing-button-radius,0.5rem)]",
                  "border border-white/15 bg-white/[0.03] text-white/85",
                )}
              >
                <Icon className="size-[1.125rem]" strokeWidth={1.65} />
              </div>
              <h3 className="text-[0.9375rem] font-medium tracking-[-0.01em] text-white">
                {item.title}
              </h3>
              <p className="mt-2 max-w-[16rem] text-[0.8125rem] leading-relaxed text-white/45 sm:text-[0.875rem]">
                {item.description}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
