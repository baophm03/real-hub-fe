import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getApiProjects } from "@/lib/api/endpoints/projects";
import type { GetProjectsResponse } from "@/lib/api/types/projects";
import { RevealSection } from "@/components/shared/reveal-section";
import { ProjectCard } from "@/components/shared/project-card";
import { PageBanner } from "@/components/shared/page-banner";
import { generateSeoMetadata } from "@/lib/seo";
import { buildPropertyListContext } from "@/lib/seo-context";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.projects" });
  return generateSeoMetadata("PROPERTY_LISTING", buildPropertyListContext(), {
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("public.projects");
  const tc = await getTranslations("public.common");

  const projectsRes = await getApiProjects({ limit: "100" });
  const projects = (projectsRes as unknown as GetProjectsResponse)?.data ?? [];

  return (
    <>
      <PageBanner
        title={t("bannerTitle")}
        description={t("bannerDesc")}
        backgroundImage="/background/projects.jpg"
        breadcrumbs={[{ label: tc("home"), href: "/" }, { label: t("breadcrumbTitle") }]}
      />

      <div className="container py-10">
        <RevealSection>
          <p className="mb-6 text-sm text-foreground-muted">
            {t("showing", { count: projects.length })}
          </p>
        </RevealSection>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <p className="text-base text-foreground-muted">{t("noProjects")}</p>
          </div>
        ) : (
          <RevealSection>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </RevealSection>
        )}
      </div>
    </>
  );
}
