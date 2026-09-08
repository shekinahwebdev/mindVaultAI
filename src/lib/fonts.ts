import { Fraunces, Geist, Mrs_Saint_Delafield } from "next/font/google";

export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const signature = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-signature",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
});

export const editorial = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});
