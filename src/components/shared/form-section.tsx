import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface p-6",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-foreground-muted">{description}</p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helper?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
  labelClassName?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  helper,
  children,
  required,
  className,
  labelClassName,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className={cn("text-sm text-foreground-muted", labelClassName)}
      >
        {label}
        {required && <span className="ml-0.5 text-accent-red-text">*</span>}
      </label>
      {children}
      {helper && !error && (
        <p className="text-xs text-foreground-muted">{helper}</p>
      )}
      {error && (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="text-xs text-accent-red-text"
        >
          {error}
        </p>
      )}
    </div>
  );
}
