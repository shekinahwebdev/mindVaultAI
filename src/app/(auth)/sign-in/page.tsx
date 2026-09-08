import { SignInForm } from "@/components/auth/SignInForm";
import { brand } from "@/lib/brand";

export const metadata = {
  title: `Sign in — ${brand.name}`,
  description: "Sign in to your MindVault.",
};

export default function SignInPage() {
  return (
    <section className="flex w-full flex-col items-center text-center">
      <h1 className="font-editorial text-[1.45rem] leading-snug text-pretty text-brand-ink italic sm:text-[1.65rem]">
        Welcome back.
      </h1>
      <p className="mt-1.5 max-w-[20rem] text-[0.86rem] leading-[1.6] text-pretty text-white/46">
        Find what you saved. Authentication will connect next.
      </p>
      <SignInForm />
    </section>
  );
}
