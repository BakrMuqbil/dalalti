import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "whatsapp" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-deep disabled:hover:bg-brand focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  secondary:
    "bg-transparent text-ink border border-line hover:border-brand disabled:hover:border-line focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ghost:
    "bg-transparent text-ink-soft hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  whatsapp:
    "bg-whatsapp text-white hover:bg-whatsapp-deep disabled:hover:bg-whatsapp focus-visible:ring-2 focus-visible:ring-whatsapp/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  danger:
    "bg-transparent text-danger border border-danger/30 hover:bg-danger-bg disabled:hover:bg-transparent focus-visible:ring-2 focus-visible:ring-danger/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-7 py-3.5 text-base rounded-lg",
};

/**
 * زر أساسي موحّد لكل المنصة.
 * يغطي كل الحالات: primary (إجراء رئيسي)، secondary (إجراء ثانوي)،
 * ghost (إجراء خفيف مثل تحديث)، whatsapp (إجراء الطلب عبر واتساب تحديداً)،
 * و danger (حذف / إجراءات تحذيرية).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-medium font-body transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...rest}
      >
        {loading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
