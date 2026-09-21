"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send, Phone, CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePostApiPropertyContacts, usePostApiPropertyContactsConsultation } from "@/lib/api/endpoints/property-contacts";
import { useGetApiAssignmentByPublicLink } from "@/lib/api/endpoints/assignments";
import { useAuthStore } from "@/lib/stores/auth-store";

interface ContactInfo {
  id?: string | null;
  name?: string | null;
  phone?: string | null;
  position?: string | null;
}

interface ContactSidebarProps {
  property?: any;
  direction?: string | null;
}

export function ContactSidebar(props: ContactSidebarProps) {
  return (
    <Suspense fallback={<ContactSidebarInner {...props} />}>
      <ContactSidebarInner {...props} />
    </Suspense>
  );
}

function ContactSidebarInner({
  property,
  direction,
}: ContactSidebarProps) {
  const t = useTranslations("public.listingDetail");
  const tp = useTranslations("public");
  const { mutateAsync: submitContact, isPending } = usePostApiPropertyContacts();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const { data: assignmentData } = useGetApiAssignmentByPublicLink(refCode ?? "", {
    query: { enabled: !!refCode },
  });

  const refAssignment = (assignmentData as any)?.data ?? assignmentData;
  const refAssignedUser = refAssignment?.assignedUser;

  const sellingMode: string | undefined = property?.sellingMode;
  // Chỉ SELF_SELL mới liên hệ trực tiếp owner. Sales chỉ hiện khi khách đi qua
  // ref link của sales đó; mọi trường hợp còn lại → RealHub support (pool).
  const assignedUser = refAssignedUser ?? null;
  const owner = sellingMode === "SELF_SELL" ? property?.owner : null;

  // Fallback chain: ref sales → owner (SELF_SELL) → RealHub support (pool)
  const contacts: ContactInfo[] = assignedUser && (assignedUser.fullName || assignedUser.phone)
    ? [{
      id: assignedUser.id ?? null,
      name: assignedUser.fullName ?? null,
      phone: assignedUser.phone ?? null,
      position: t("contactSalesPosition"),
    }]
    : owner && (owner.fullName || owner.phone)
      ? [{
        id: owner.id ?? null,
        name: owner.fullName ?? null,
        phone: owner.phone ?? null,
        position: t("contactOwnerPosition"),
      }]
      : [{
        id: null,
        name: t("contactName"),
        phone: null,
        position: t("contactSupportPosition"),
      }];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(t("contactValidationError"));
      return;
    }
    try {
      const recipientUserId = contacts.find((c) => c.id)?.id ?? "";
      await submitContact({
        data: {
          propertyId: property?.id,
          recipientUserId: recipientUserId || (undefined as any),
          userName: form.name.trim(),
          userPhone: form.phone.trim(),
          userContent: form.message.trim() || undefined,
        },
      });
      toast.success(t("contactSuccess"));
      setForm({ name: "", phone: "", message: "" });
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || t("contactError"));
      console.error(err);
    }
  };

  const consultationMutation = usePostApiPropertyContactsConsultation();

  const handleBookConsultation = async () => {
    const recipientUserId = contacts.find((c) => c.id)?.id ?? undefined;
    try {
      const result: any = await consultationMutation.mutateAsync({
        data: { propertyId: property?.id, recipientUserId } as any,
      });
      const isDuplicate = result?.data?.duplicate ?? result?.duplicate;
      if (isDuplicate) {
        toast.info(t("contactAlreadyRegistered"));
      } else {
        toast.success(t("contactRegistered"));
      }
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || t("contactRegisterFailed"));
      console.error(err);
    }
  };

  return (
    <div className="w-full lg:w-1/3 lg:sticky lg:top-24">
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6 space-y-6">
        {/* Agent Info */}
        {contacts.map((item) => (
          <div key={`${item.id ?? item.name ?? item.phone ?? "contact"}`} className="flex flex-col gap-3 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="size-16 overflow-hidden rounded-lg border border-primary/20">
                <img
                  src="/avatar-fallback.png"
                  alt={item.name ?? ""}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-lg font-bold text-primary">{item.name || t("contactNoInfo")}</h3>
                <p className="text-sm text-foreground-muted">{item.position || t("contactNoPosition")}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Contact Form / Consultation Booking */}
        <div className="space-y-3">
          {isAuthenticated ? (
            <Button
              type="button"
              className="w-full"
              size="lg"
              leftIcon={consultationMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
              onClick={handleBookConsultation}
              disabled={consultationMutation.isPending}
            >
              {consultationMutation.isPending ? t("contactSending") : t("contactConsultNow")}
            </Button>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input
                type="text"
                placeholder={t("contactNamePlaceholder")}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Input
                type="tel"
                placeholder={t("contactPhonePlaceholder")}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Textarea
                placeholder={t("contactMessagePlaceholder")}
                rows={3}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" className="w-full" size="lg" disabled={isPending} leftIcon={<Send size={16} />}>
                {isPending ? t("contactSending") : t("contactSendRequest")}
              </Button>
            </form>
          )}
          {contacts.map((item) => (
            <div key={`${item.id ?? item.name ?? item.phone ?? "phone"}`} className="flex flex-col gap-3">
              {item.phone && (
                <Button type="button" variant="outline" className="w-full" leftIcon={<Phone size={16} />} render={<a href={`tel:${item.phone}`} />}>
                  {item.phone}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Property Meta */}
        <div className="border-t border-border pt-4 space-y-2 text-xs text-foreground-muted">
          <div className="flex justify-between">
            <span>{t("contactCategory")}</span>
            <span className="font-medium text-foreground">{property?.propertyType?.name ?? "—"}</span>
          </div>
          {direction && (
            <div className="flex justify-between">
              <span>{t("contactDirection")}</span>
              <span className="font-medium text-foreground">{direction}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{t("contactSellingMode")}</span>
            <span className="font-medium text-foreground">
              {property?.sellingMode ? tp(`enums.sellingMode.${property.sellingMode}`) : "—"}
            </span>
          </div>
          {property?.createdAt && (
            <div className="flex justify-between">
              <span>{t("contactPostedDate")}</span>
              <span className="font-medium text-foreground">
                {new Date(property.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
