import { HTMLAttributes } from "react";

export function Card({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between border-b border-line px-6 py-5 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}
