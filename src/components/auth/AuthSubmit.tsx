"use client";

type AuthSubmitProps = {
  label: string;
  loadingLabel: string;
  loading?: boolean;
};

export function AuthSubmit({ label, loadingLabel, loading }: AuthSubmitProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="group relative mt-0.5 inline-flex min-h-9 w-full items-center justify-center overflow-hidden rounded-full bg-brand-ink px-7 py-2 text-[0.8rem] tracking-[0.18em] text-brand-void uppercase disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(5,5,7,0.08)_48%,transparent_62%)] bg-[length:220%_100%] bg-[position:120%_0] transition-[background-position] duration-700 ease-out group-hover:bg-[position:-20%_0]"
      />
      <span className="relative">{loading ? loadingLabel : label}</span>
    </button>
  );
}
