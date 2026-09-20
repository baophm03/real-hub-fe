"use client";

import {
  Download,
  FileText,
  Image as ImageIcon,
  Trash2,
  Video,
} from "lucide-react";
import type { FileItem, FileVisibility } from "@/lib/api/types/files";
import { formatDate } from "@/utils";
import { Button } from "@/components/ui/button";

const visibilityLabel: Record<string, string> = {
  PUBLIC: "Công khai",
  TENANT: "Thuê nhà",
  ASSIGNED: "Gán cho",
  PRIVATE: "Riêng tư",
  SENSITIVE: "Nhạy cảm",
};

const visibilityOptions: FileVisibility[] = [
  "PUBLIC",
  "TENANT",
  "ASSIGNED",
  "PRIVATE",
  "SENSITIVE",
];

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Video;
  if (type === "application/pdf") return FileText;
  return FileText;
}

function formatSize(bytes: number): string {
  if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
  if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
  if (bytes >= 1000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${bytes} B`;
}



interface FileCardProps {
  file: FileItem;
  canDelete: boolean;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export function FileCard({
  file,
  canDelete,
  onPreview,
  onDownload,
  onDelete,
}: FileCardProps) {
  const Icon = getFileIcon(file.mimeType);
  const isImage = file.mimeType.startsWith("image/");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {isImage && file.url ? (
          <img
            src={file.url}
            alt={file.original}
            className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300 hover:scale-105"
            onClick={() => onPreview(file)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-foreground-muted">
            <Icon size={32} />
            <span className="text-xs uppercase">{file.mimeType.split("/").pop()}</span>
          </div>
        )}

        {/* Action overlay */}
        {canDelete && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none [&>button]:pointer-events-auto">
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={() => onDownload(file)}
              title="Tải xuống"
            >
              <Download size={14} />
            </Button>
            {canDelete && (
              <Button
                size="icon-sm"
                variant="destructive"
                onClick={() => onDelete(file)}
                title="Xóa"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        )}

      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <span className="truncate text-sm font-medium" title={file.original}>
          {file.original}
        </span>
        <div className="flex items-center justify-between text-xs text-foreground-muted tabular-nums">
          <span>{formatSize(Number(file.fileSize || 0))}</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

export { visibilityLabel, visibilityOptions };
