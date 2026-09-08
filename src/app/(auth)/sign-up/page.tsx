import { SignUpForm } from "@/components/auth/SignUpForm";
import { brand } from "@/lib/brand";

export const metadata = {
  title: `Create your vault — ${brand.name}`,
  description: "Create a MindVault to keep what you learn.",
};

export default function SignUpPage() {
  return (
    <section className="flex w-full flex-col items-center text-center">
      <h1 className="font-editorial text-[1.45rem] leading-snug text-pretty text-brand-ink italic sm:text-[1.65rem]">
        Create your vault.
      </h1>
      <p className="mt-1.5 max-w-[20rem] text-[0.86rem] leading-[1.6] text-pretty text-white/46">
        Give what you save one home. Authentication will connect next.
      </p>
      <SignUpForm />
    </section>
  );
}
