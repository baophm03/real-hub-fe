"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import {
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { Can } from "@casl/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { usePagination } from "@/lib/hooks/use-pagination";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useGetApiNewsCategories,
  useDeleteApiNewsCategory,
} from "@/lib/api/endpoints/news-categories";
import type { GetNewsCategoriesResponse, NewsCategory } from "@/lib/api/types/news";
import { formatDate } from "@/utils";



export function CategoriesList() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pagination = usePagination(10);
  const { data: categoriesData, isLoading, refetch: refetchCategories } = useGetApiNewsCategories({
    limit: pagination.limit,
    offset: pagination.offset,
  });
  const categories: NewsCategory[] =
    (categoriesData as unknown as GetNewsCategoriesResponse)?.data ?? [];
  const meta = (categoriesData as unknown as GetNewsCategoriesResponse)?.meta;
  const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? 0) / pagination.pageSize));

  const { mutateAsync: deleteCategory } = useDeleteApiNewsCategory();

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa chuyên mục này? Các bài viết thuộc chuyên mục sẽ mất chuyên mục.")) return;
    setDeletingId(id);
    try {
      await deleteCategory({ id });
      await refetchCategories();
      router.refresh();
      toast.success("Đã xóa chuyên mục");
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Không thể xóa chuyên mục");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<NewsCategory>[] = [
    {
      accessorKey: "name",
      header: "Tên chuyên mục",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-[400px] text-sm text-foreground-muted">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      id: "count",
      header: "Số bài viết",
      cell: ({ row }) => {
        const count = row.original._count?.news ?? 0;
        return <Badge variant={count > 0 ? "green" : "outline"}>{count}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground-muted">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(portalPath(`/news/categories/${row.original.id}`));
            }}
            className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Sửa"
          >
            <Pencil size={16} />
          </button>
          <Can I="DELETE_OWN" a="NEWS">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.original.id);
              }}
              disabled={deletingId === row.original.id}
              className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              aria-label="Xóa"
            >
              {deletingId === row.original.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{filtered.length}</span> chuyên mục
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Tìm kiếm chuyên mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-auto min-w-0"
          />
          <Can I="CREATE" a="NEWS">
            <Button onClick={() => router.push(portalPath("/news/categories/new"))}>
              <Plus size={16} />
              Thêm chuyên mục
            </Button>
          </Can>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => router.push(portalPath(`/news/categories/${row.id}`))}
            emptyMessage="Không tìm thấy chuyên mục nào"
          />
          <PaginationBar
            pageSize={pagination.pageSize}
            setPageSize={pagination.setPageSize}
            currentPage={pagination.currentPage}
            setCurrentPage={pagination.setCurrentPage}
            totalPages={totalPages}
          />
        </>
      ) : (
        <EmptyState
          icon={<Tag size={24} />}
          title="Chưa có chuyên mục"
          description="Tạo chuyên mục đầu tiên để phân loại bài viết"
          action={
            <Can I="CREATE" a="NEWS">
              <Button onClick={() => router.push(portalPath("/news/categories/new"))}>
                <Plus size={16} />
                Thêm chuyên mục
              </Button>
            </Can>
          }
        />
      )}
    </div>
  );
}
