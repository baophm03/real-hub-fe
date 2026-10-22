"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSection, FormField } from "@/components/shared/form-section";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useGetApiNewsId,
  usePostApiNews,
  usePatchApiNews,
  getGetApiNewsIdQueryKey,
} from "@/lib/api/endpoints/news";
import { useGetApiNewsCategories } from "@/lib/api/endpoints/news-categories";
import type { GetNewsItemResponse, GetNewsCategoriesResponse } from "@/lib/api/types/news";
import { ThumbnailUploader } from "../../_components/thumbnail-uploader";
import { AuditLogSection } from "@/app/[locale]/[portal]/audit-logs/_components/audit-log-section";

const newsSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
  slug: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
      "Slug chỉ chứa chữ thường, số và dấu gạch nối",
    ),
  description: z.string().optional(),
  content: z.string().optional(),
  categoryNewsId: z.string().optional(),
});

type NewsFormData = z.infer<typeof newsSchema>;

export default function NewsFormPage() {
  const params = useParams();
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const isCreate = id === "new";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { data: articleData, isLoading } = useGetApiNewsId(id, {
    query: { enabled: !isCreate },
  });
  const article = (articleData as unknown as GetNewsItemResponse)?.data;

  const { mutateAsync: createNews } = usePostApiNews();
  const { mutateAsync: updateNews } = usePatchApiNews();
  const { data: categoriesData } = useGetApiNewsCategories({ limit: "100" });
  const categories = (categoriesData as unknown as GetNewsCategoriesResponse)?.data ?? [];
  const categoryItems = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {},
  });

  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (article && !initialized) {
      reset({
        title: article.title,
        slug: article.slug ?? "",
        description: article.description ?? "",
        content: article.content ?? "",
        categoryNewsId: article.category?.id ?? undefined,
      });
      setThumbnailId(article.thumbnail?.id ?? null);
      setInitialized(true);
    }
  }, [article, initialized, reset]);

  // Auto-generate slug from title when user hasn't manually edited slug
  const watchedTitle = watch("title");
  useEffect(() => {
    if (!slugTouched && watchedTitle) {
      const generated = watchedTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", generated);
    }
  }, [watchedTitle, slugTouched, setValue]);

  const watchedCategory = watch("categoryNewsId");

  const onSubmit = async (data: NewsFormData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: data.title,
        slug: data.slug || undefined,
        description: data.description || undefined,
        content: data.content || undefined,
        categoryNewsId: data.categoryNewsId || undefined,
        thumbnailId: thumbnailId || undefined,
      };
      if (isCreate) {
        await createNews({ data: payload });
        await queryClient.invalidateQueries({ queryKey: ["/api/news"] });
        toast.success("Tạo bài viết thành công");
      } else {
        await updateNews({ id, data: payload });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/news"] }),
          queryClient.invalidateQueries({ queryKey: getGetApiNewsIdQueryKey(id) }),
        ]);
        toast.success("Cập nhật bài viết thành công");
      }
      router.refresh();
      router.push(portalPath("/news"));
    } catch (err) {
      setError(
        (err as any)?.response?.data?.error?.message?.[0] ||
        (isCreate ?
          "Có lỗi xảy ra khi tạo bài viết" :
          "Có lỗi xảy ra khi cập nhật bài viết"
        )
      );
      toast.error(
        (err as any)?.response?.data?.error?.message?.[0] ||
        (isCreate ?
          "Có lỗi xảy ra khi tạo bài viết" :
          "Có lỗi xảy ra khi cập nhật bài viết"
        )
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isCreate && isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isCreate && !article) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-foreground-muted">Không tìm thấy bài viết.</p>
        <Button variant="outline" onClick={() => router.push(portalPath("/news"))}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(portalPath("/news"))}
          className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <PageHeader
          eyebrow="Tin tức"
          title={isCreate ? "Thêm bài viết" : "Chỉnh sửa bài viết"}
          description={isCreate ? "Tạo bài viết tin tức mới" : article?.title}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormSection title="Nội dung bài viết" description="Thông tin chính của bài viết">
          <FormField label="Tiêu đề" htmlFor="title" required error={errors.title?.message}>
            <Input id="title" placeholder="Thị trường bất động sản 2026..." {...register("title")} />
          </FormField>

          <FormField label="Slug" htmlFor="slug" error={errors.slug?.message}>
            <Input
              id="slug"
              placeholder="thi-truong-bat-dong-san-2026"
              {...register("slug")}
              onChange={(e) => {
                setSlugTouched(true);
                register("slug").onChange(e);
              }}
            />
          </FormField>

          <FormField label="Mô tả ngắn" htmlFor="description" error={errors.description?.message}>
            <Textarea
              id="description"
              rows={3}
              placeholder="Tóm tắt nội dung bài viết..."
              {...register("description")}
            />
          </FormField>

          <FormField label="Nội dung" htmlFor="content">
            <RichTextEditor
              value={watch("content") ?? ""}
              onChange={(val) => setValue("content", val)}
              placeholder="Nội dung chi tiết của bài viết..."
              height={500}
            />
          </FormField>
        </FormSection>

        <FormSection title="Phân loại & Hình ảnh" description="Chuyên mục và ảnh đại diện">
          <FormField label="Chuyên mục">
            <Select
              value={watchedCategory ?? "__none__"}
              items={{ __none__: "— Không chuyên mục —", ...categoryItems }}
              onValueChange={(val) =>
                setValue("categoryNewsId", val === "__none__" || val == null ? undefined : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chuyên mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" label="— Không chuyên mục —">— Không chuyên mục —</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} label={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Ảnh thumbnail">
            <ThumbnailUploader
              fileId={thumbnailId}
              thumbnail={article?.thumbnail}
              onChange={setThumbnailId}
            />
          </FormField>
        </FormSection>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(portalPath("/news"))}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : isCreate ? "Tạo bài viết" : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
      {!isCreate && article?.id && (
        <AuditLogSection entityType="news" entityId={id} />
      )}
    </div>
  );
}
