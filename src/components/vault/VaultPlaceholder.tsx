type VaultPlaceholderProps = {
  title: string;
  description: string;
};

export function VaultPlaceholder({ title, description }: VaultPlaceholderProps) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-8">
      <h1 className="font-editorial text-[1.5rem] text-brand-ink italic sm:text-[1.75rem]">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-[0.9rem] leading-relaxed text-white/46">
        {description}
      </p>
    </section>
  );
}
