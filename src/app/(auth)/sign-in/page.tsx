import { SignInForm } from "@/components/auth/SignInForm";
import { brand } from "@/lib/brand";

export const metadata = {
  title: `Sign in — ${brand.name}`,
  description: "Sign in to your MindVault.",
};

export default function SignInPage() {
  return (
    <section className="flex w-full flex-col text-left">
      <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.625rem]">
        Welcome back
      </h1>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-white/45">
        Sign in to your MindVault.
      </p>
      <SignInForm />
    </section>
  );
}
