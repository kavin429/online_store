"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@online-store/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@online-store/ui/select";
import { Button } from "@online-store/ui/button";
import { Textarea } from "@online-store/ui/textarea";
import { Loader2 } from "lucide-react";
import StatusBadge from "@/components/comman/status-badge";

type ManageableEntity = {
  id: string | number;
  name?: string | null;
  status: string;
  blockReason?: string | null;
};

export type StatusOption<S extends string = string> = {
  value: S;
  label: string;               // shown in the dropdown, e.g. "Block"
  badgeLabel?: string;          // lowercase key passed to StatusBadge, defaults to value.toLowerCase()
  requiresReason?: boolean;     // shows textarea + validates before confirming
  buttonVariant?: "destructive" | "outline" | "shoesecondary" | "default";
  confirmText?: string;         // e.g. "Are you sure you want to reject this vendor?"
};

type ManageStatusDialogProps<T extends ManageableEntity> = {
  entity: T | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (
    entity: T,
    status: string,
    reason?: string,
  ) => Promise<T>;
  onUpdated?: (updated: T) => void;
  entityLabel?: string; // e.g. "vendor", "customer", "driver"
  statusOptions?: StatusOption[];
};

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { value: "ACTIVE", label: "Active", buttonVariant: "shoesecondary" },
  {
    value: "BLOCKED",
    label: "Blocked",
    requiresReason: true,
    buttonVariant: "destructive",
  },
];

export default function ManageStatusDialog<T extends ManageableEntity>({
  entity,
  open,
  onOpenChange,
  onStatusChange,
  onUpdated,
  entityLabel = "item",
  statusOptions = DEFAULT_STATUS_OPTIONS,
}: ManageStatusDialogProps<T>) {
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedValue(entity?.status ?? "");
      setReason("");
      setError(null);
    }
  }, [open, entity?.id]);

  const currentOption = statusOptions.find((s) => s.value === entity?.status);
  const selectedOption = statusOptions.find((s) => s.value === selectedValue);
  const hasChanged = selectedValue !== entity?.status;

  const handleConfirm = async () => {
    if (!entity || !selectedOption) return;

    if (selectedOption.requiresReason && !reason.trim()) {
      setError(`A reason is required to set this ${entityLabel} to ${selectedOption.label.toLowerCase()}.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await onStatusChange(
        entity,
        selectedOption.value,
        selectedOption.requiresReason ? reason.trim() : undefined,
      );
      onOpenChange(false);
      onUpdated?.(updated);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Manage Status
            {entity && (
              <StatusBadge
                status={(currentOption?.badgeLabel ?? entity.status.toLowerCase()) as any}
              />
            )}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {entity?.name || `This ${entityLabel}`}
        </p>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Show current block/reject reason if present */}
        {entity?.blockReason && (
          <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 space-y-1">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              Current reason on record
            </p>
            <p className="text-sm">{entity.blockReason}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={selectedValue}
            onValueChange={(value) => {
              setSelectedValue(value);
              setReason("");
              setError(null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reason textarea shows below the dropdown when required */}
        {selectedOption?.requiresReason && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason to {selectedOption.label.toLowerCase()}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Incomplete documents, policy violation, fraud suspicion..."
              rows={4}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This reason is stored and shown on the {entityLabel}&apos;s profile.
            </p>
          </div>
        )}

        {selectedOption && !selectedOption.requiresReason && hasChanged && (
          <p className="text-sm text-muted-foreground">
            {selectedOption.confirmText ||
              `This ${entityLabel} will be set to ${selectedOption.label.toLowerCase()}.`}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>

          <Button
            variant={selectedOption?.buttonVariant || "default"}
            onClick={handleConfirm}
            disabled={saving || !selectedOption || !hasChanged}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}