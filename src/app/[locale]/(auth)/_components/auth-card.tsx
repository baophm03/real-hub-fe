"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  backHref?: string;
  backLabel?: React.ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  backHref,
  backLabel,
}: AuthCardProps) {
  const t = useTranslations("auth");
  const resolvedBackLabel = backLabel ?? t("back");
  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-[1.25rem] border border-border bg-surface/80 p-7 shadow-[0_24px_70px_-24px_rgba(45,95,63,0.14)] backdrop-blur-xl md:p-10">
        <header className="mb-7 md:mb-8">
          {backHref ? (
            <Link
              href={backHref}
              className="group mb-4 inline-flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft
                size={15}
                className="transition-transform duration-300 group-hover:-translate-x-0.5"
              />
              <span>{resolvedBackLabel}</span>
            </Link>
          ) : null}
          {title ? (
            <h2 className="font-serif text-[1.625rem] font-semibold leading-tight tracking-tight md:text-3xl">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              {subtitle}
            </p>
          ) : null}
        </header>
        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}

export default AuthCard;
