import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { generateSeoMetadata } from "@/lib/seo";
import { buildStaticContext } from "@/lib/seo-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.about");
  return generateSeoMetadata("ABOUT", buildStaticContext(), {
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
