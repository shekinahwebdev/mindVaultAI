"use client";

type AuthErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function AuthError({ retry }: AuthErrorProps) {
  return (
    <section className="flex w-full flex-col items-center text-center">
      <h1 className="font-editorial text-[1.45rem] text-brand-ink italic sm:text-[1.65rem]">
        Something went wrong.
      </h1>
      <p className="mt-3 text-[0.88rem] leading-relaxed text-white/46">
        The page could not finish loading. Try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-white/28 px-7 text-[0.78rem] tracking-[0.18em] text-white uppercase"
      >
        Try again
      </button>
    </section>
  );
}
