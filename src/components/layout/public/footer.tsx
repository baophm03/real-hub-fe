import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/layout/public/newsletter-form";

export function PublicFooter() {
  const t = useTranslations("public");

  return (
    <footer className="bg-white">
      <div className="container pt-14 pb-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4">
            <div className="flex items-center gap-2">
              <Building2 size={22} className="text-primary" />
              <p className="font-serif text-xl font-semibold tracking-tight">
                RealHub
              </p>
            </div>
            <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-foreground-muted">
              {t("tagline")}
            </p>
            <NewsletterForm />
          </div>

          <div className="col-span-6 md:col-span-2 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {t("footer.sale")}
            </p>
            <Link href="/listings?types=APARTMENT&transactionType=SALE" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.apartment")}
            </Link>
            <Link href="/listings?types=VILLA&transactionType=SALE" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.villa")}
            </Link>
            <Link href="/listings?types=HOUSE,SHOPHOUSE&transactionType=SALE" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.townhouse")}
            </Link>
            <Link href="/listings?types=LAND&transactionType=SALE" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.land")}
            </Link>
            <Link href="/listings?types=OFFICE,WAREHOUSE,SHOP&transactionType=SALE" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.commercial")}
            </Link>
          </div>

          <div className="col-span-6 md:col-span-2 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {t("footer.rent")}
            </p>
            <Link href="/listings?types=APARTMENT&transactionType=RENT" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.apartment")}
            </Link>
            <Link href="/listings?types=VILLA&transactionType=RENT" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.villa")}
            </Link>
            <Link href="/listings?types=HOUSE,SHOPHOUSE&transactionType=RENT" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.townhouse")}
            </Link>
            <Link href="/listings?types=LAND&transactionType=RENT" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.land")}
            </Link>
            <Link href="/listings?types=OFFICE,WAREHOUSE,SHOP&transactionType=RENT" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("footer.commercial")}
            </Link>
          </div>

          <div className="col-span-6 md:col-span-2 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {t("footer.explore")}
            </p>
            <Link href="/projects" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("nav.projects")}
            </Link>
            <Link href="/news/all" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("nav.news")}
            </Link>
            <Link href="/about" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              {t("nav.about")}
            </Link>
          </div>

          <div className="col-span-6 md:col-span-2 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {t("footer.contactCol")}
            </p>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Phone size={14} className="shrink-0 text-primary" />
              <a href="tel:+84901234567" className="transition-colors hover:text-foreground tabular-nums">
                0901 234 567
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Mail size={14} className="shrink-0 text-primary" />
              <a href="mailto:contact@realhub.vn" className="transition-colors hover:text-foreground">
                contact@realhub.vn
              </a>
            </div>
            <div className="flex items-start gap-2 text-sm text-foreground-muted">
              <MapPin size={14} className="shrink-0 text-primary mt-0.5" />
              <span className="leading-relaxed">
                123 Lê Lợi, Q.1, TP. HCM
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="text-xs text-foreground-muted">
            {t("footer.rights", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-xs text-foreground-muted transition-colors hover:text-foreground"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/about"
              className="text-xs text-foreground-muted transition-colors hover:text-foreground"
            >
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
