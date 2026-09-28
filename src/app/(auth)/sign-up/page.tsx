import { SignUpForm } from "@/components/auth/SignUpForm";
import { brand } from "@/lib/brand";

export const metadata = {
  title: `Create your account — ${brand.name}`,
  description: "Start building your personal knowledge space.",
};

export default function SignUpPage() {
  return (
    <section className="flex w-full flex-col text-left">
      <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.625rem]">
        Create your account
      </h1>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-white/45">
        Start building your personal knowledge space.
      </p>
      <SignUpForm />
    </section>
  );
}
