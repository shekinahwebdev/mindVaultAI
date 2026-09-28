import { cn } from "@/lib/utils";

export const authFieldSplitClassName = cn(
  "w-full border-white/12 bg-[#141414] text-white",
  "placeholder:text-white/28 focus:border-white/25",
);

/** Sign-up reference uses slightly larger radii */
export const authFieldSignUpClassName = authFieldSplitClassName;

export const authSocialButtonClassName = cn(
  "inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl",
  "border border-white/12 bg-[#141414] px-4 text-[0.875rem] font-medium text-white/90",
  "transition-colors hover:border-white/20 hover:bg-[#1a1a1a]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
);

export const authSubmitSplitClassName = cn(
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl",
  "bg-white text-[0.9375rem] font-medium text-[#0d0d0d] transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
);

export const authSubmitSignInClassName = cn(
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--mv-radius-control,0.5rem)]",
  "border border-white/18 bg-[#0d0d0d] text-[0.9375rem] font-semibold text-white transition-colors hover:border-white/28 hover:bg-[#141414]",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
);

export const authOAuthCircleClassName = cn(
  "inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.03]",
  "text-white/80 transition-colors",
);
