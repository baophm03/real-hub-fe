"use client";

import { useState } from "react";
import { Send, Loader2, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePostApiContactRequests } from "@/lib/api/endpoints/contact-requests";

export function ContactForm() {
  const t = useTranslations("public.contact");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const { mutateAsync: submitContact, isPending } = usePostApiContactRequests({
    mutation: {
      onSuccess: () => {
        toast.success(t("formSuccess"));
        setForm({ fullName: "", email: "", phone: "", subject: "", message: "" });
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.error?.message?.[0] ||
          t("formError")
        );
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error(t("formValidationError"));
      return;
    }
    try {
      await submitContact({
        data: {
          fullName: form.fullName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
          subject: form.subject.trim() || undefined,
          message: form.message.trim() || undefined,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold tracking-wide text-foreground">{t("formName")}<span className="ml-1 text-red-500">*</span></label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary transition-colors"
              placeholder={t("formNamePlaceholder")}
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold tracking-wide text-foreground">{t("formEmail")}<span className="ml-1 text-red-500">*</span></label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary transition-colors"
              placeholder={t("formEmailPlaceholder")}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold tracking-wide text-foreground">{t("formPhone")}<span className="ml-1 text-red-500">*</span></label>
        <div className="relative">
          <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary transition-colors"
            placeholder={t("formPhonePlaceholder")}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold tracking-wide text-foreground">{t("formSubject")}<span className="ml-1 text-red-500">*</span></label>
        <input
          className="h-11 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary transition-colors"
          placeholder={t("formSubjectPlaceholder")}
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold tracking-wide text-foreground">{t("formMessage")}<span className="ml-1 text-red-500">*</span></label>
        <textarea
          rows={5}
          className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
          placeholder={t("formMessagePlaceholder")}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
      </div>
      <Button type="submit" size="lg" className="w-fit" disabled={isPending} leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}>
        {isPending ? t("formSending") : t("formSubmit")}
      </Button>
    </form>
  );
}
