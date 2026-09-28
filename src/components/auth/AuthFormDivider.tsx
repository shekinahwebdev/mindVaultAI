export function AuthFormDivider() {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-white/10" />
      </div>
      <p className="relative mx-auto w-fit bg-background px-3 text-[0.75rem] text-white/38">
        or
      </p>
    </div>
  );
}
