import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { NewsletterForm } from "@/components/layout/public/newsletter-form";
import { ContactInfoList } from "@/components/shared/contact-info-list";

export function PublicFooter() {
  const t = useTranslations("public");

  return (
    <footer className="bg-white">
      <div className="container pt-14 pb-8">
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          <div className="col-span-12 md:col-span-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="RealHub" className="size-8 rounded-lg object-cover" />
              <p className="font-serif text-xl font-semibold tracking-tight">
                RealHub
              </p>
            </div>
            <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-foreground-muted">
              {t("tagline")}
            </p>
            <NewsletterForm />
          </div>

          <div className="col-span-12 flex flex-col gap-3 sm:col-span-6 md:col-span-2">
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

          <div className="col-span-12 flex flex-col gap-3 sm:col-span-6 md:col-span-2">
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

          <div className="col-span-12 flex flex-col gap-3 md:col-span-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {t("footer.contactCol")}
            </p>
            <ContactInfoList variant="compact" />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="text-xs text-foreground-muted">
            {t("footer.rights", { year: new Date().getFullYear() })} | Powered By MeU Solutions
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
