type AuthAlertProps = {
  message: string;
};

export function AuthAlert({ message }: AuthAlertProps) {
  return (
    <p
      role="alert"
      className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-left text-[0.82rem] leading-relaxed text-white/70"
    >
      {message}
    </p>
  );
}
