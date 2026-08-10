import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";

const fieldBase =
  "w-full rounded-lg border border-line bg-background px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-gold focus:bg-surface focus:ring-2 focus:ring-gold/15 disabled:cursor-not-allowed disabled:opacity-60";

interface FieldWrapperProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
}

function FieldLabel({
  label,
  htmlFor,
}: {
  label?: string;
  htmlFor?: string;
}) {
  if (!label) return null;
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-ink-soft"
    >
      {label}
    </label>
  );
}

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, htmlFor, hint, error, className = "", ...rest }, ref) => (
    <div>
      <FieldLabel label={label} htmlFor={htmlFor} />
      <input
        ref={ref}
        id={htmlFor}
        className={`${fieldBase} ${error ? "border-danger" : ""} ${className}`}
        {...rest}
      />
      {hint && !error && (
        <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, htmlFor, hint, error, className = "", ...rest }, ref) => (
    <div>
      <FieldLabel label={label} htmlFor={htmlFor} />
      <textarea
        ref={ref}
        id={htmlFor}
        className={`${fieldBase} resize-none ${error ? "border-danger" : ""} ${className}`}
        {...rest}
      />
      {hint && !error && (
        <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  ),
);
Textarea.displayName = "Textarea";

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    FieldWrapperProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, htmlFor, hint, error, className = "", children, ...rest }, ref) => (
    <div>
      <FieldLabel label={label} htmlFor={htmlFor} />
      <select
        ref={ref}
        id={htmlFor}
        className={`${fieldBase} ${error ? "border-danger" : ""} ${className}`}
        {...rest}
      >
        {children}
      </select>
      {hint && !error && (
        <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  ),
);
Select.displayName = "Select";
