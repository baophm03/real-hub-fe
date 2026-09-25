"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePostApiSubscribe } from "@/lib/api/endpoints/subscribers";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm() {
  const t = useTranslations("public.footer");
  const [email, setEmail] = useState("");

  const { mutateAsync: subscribe, isPending } = usePostApiSubscribe({
    mutation: {
      onSuccess: () => {
        toast.success(t("newsletterSuccess"));
        setEmail("");
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.error?.message?.[0] || t("newsletterError"),
        );
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_REGEX.test(value)) {
      toast.error(t("newsletterInvalid"));
      return;
    }
    try {
      await subscribe({ data: { email: value } });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-sm flex-col gap-3">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
        {t("newsletterTitle")}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletterPlaceholder")}
          className="h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-primary"
        />
        <Button
          type="submit"
          size="icon-lg"
          loading={isPending}
          aria-label={t("newsletterButton")}
          className="shrink-0"
        >
          <Send size={14} />
        </Button>
      </div>
    </form>
  );
}
