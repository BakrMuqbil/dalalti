interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label, className = "" }: SpinnerProps) {
  return (
    <div className={`p-12 text-center ${className}`}>
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label && <p className="text-sm text-ink-soft">{label}</p>}
    </div>
  );
}
