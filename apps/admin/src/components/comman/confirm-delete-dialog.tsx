"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  loading?: boolean;
  error?: string | null;
};

export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm Delete",
  itemName,
  loading = false,
  error,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm space-y-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <p>
          Are you sure you want to delete{" "}
          <strong>{itemName || "this item"}</strong>? This can&apos;t be undone.
        </p>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}