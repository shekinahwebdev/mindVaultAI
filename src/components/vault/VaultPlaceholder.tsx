type VaultPlaceholderProps = {
  title: string;
  description: string;
};

export function VaultPlaceholder({ title, description }: VaultPlaceholderProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
      <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.75rem]">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-[0.9rem] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </section>
  );
}
