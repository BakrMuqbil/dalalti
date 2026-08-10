import React from 'react';

/**
 * أيقونات SVG خفيفة مصممة خصيصاً للوحات التحكم — بدون أي مكتبة خارجية،
 * لتقليل حجم الحزمة وتسريع أول تجميع (مهم لبيئة تطوير محدودة الموارد).
 * كل أيقونة بخط رفيع (stroke-based) بما ينسجم مع طابع "الفخامة الهادئة".
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BoxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 7h20l-2 5H4L2 7Z" />
      <path d="M4 12v9h16v-9M9 21v-6h6v6" />
    </svg>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m2 20 2-10 5 5 3-9 3 9 5-5 2 10Z" />
      <path d="M2 20h20" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m10.29 3.86-8.18 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.89-3.14l-8.18-14a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function PackageCheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 16h6M19 13v6" />
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l1.5-.87" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
