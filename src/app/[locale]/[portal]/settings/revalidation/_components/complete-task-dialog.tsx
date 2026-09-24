"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CompleteRevalidationTaskDtoResult } from "@/lib/api/models/completeRevalidationTaskDtoResult";
import { taskResultLabel, type RevalidationTask } from "./types";

const resultOptions = Object.entries(CompleteRevalidationTaskDtoResult).map(([k]) => ({
  value: k,
  label: taskResultLabel[k] ?? k,
}));

interface Props {
  task: RevalidationTask | null;
  onOpenChange: (o: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (result: string, note: string) => Promise<void>;
}

export function CompleteTaskDialog({ task, onOpenChange, isSubmitting, onSubmit }: Props) {
  const [result, setResult] = useState<string>("CONFIRMED");
  const [note, setNote] = useState("");

  const close = () => {
    setResult("CONFIRMED");
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={!!task} onOpenChange={(o) => (!o ? close() : onOpenChange(o))}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hoàn thành revalidation</DialogTitle>
            <DialogDescription>
              {task?.property?.title ?? task?.property?.propertyCode}
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await onSubmit(result, note);
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-foreground-muted">Kết quả</label>
              <Select value={result} onValueChange={(v) => setResult((v as string) ?? "CONFIRMED")}>
                <SelectTrigger>
                  <SelectValue>
                    {(value: string) => resultOptions.find((o) => o.value === value)?.label ?? value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {resultOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-foreground-muted">Ghi chú</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Chủ nhà xác nhận còn bán, giá không đổi"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Xác nhận"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
