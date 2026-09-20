"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "../pagination";

export interface PaginationBarProps {
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

export function PaginationBar({
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  totalPages,
}: PaginationBarProps) {
  return (
    <div className="px-4 py-3 -mt-3 flex items-center justify-between bg-surface rounded-md border border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground-muted">Hiển thị</span>
        <Select
          value={String(pageSize)}
          items={{ 10: "10", 20: "20", 50: "50", 100: "100" }}
          onValueChange={(value) => {
            if (value) {
              setPageSize(Number(value));
              setCurrentPage(1);
            }
          }}
        >
          <SelectTrigger className="w-17.5 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10" label="10">10</SelectItem>
            <SelectItem value="20" label="20">20</SelectItem>
            <SelectItem value="50" label="50">50</SelectItem>
            <SelectItem value="100" label="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-foreground-muted">mục</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-foreground-muted">
          Trang {currentPage} / {totalPages || 1}
        </span>
        <Pagination
          page={currentPage}
          pageCount={totalPages || 1}
          onChangePage={setCurrentPage}
        />
      </div>
    </div>
  );
}
