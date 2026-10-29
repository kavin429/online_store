const DAY_MS = 24 * 60 * 60 * 1000;

export type ExpiryStatus = "expired" | "soon" | "ok" | "none";

export function formatExpiry(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Whole days from now until the expiry date. Negative when already expired. */
export function daysUntilExpiry(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / DAY_MS);
}

export function expiryStatus(value: string | Date | null | undefined): {
  status: ExpiryStatus;
  days: number | null;
  label: string;
} {
  const days = daysUntilExpiry(value);
  if (days === null) return { status: "none", days: null, label: "No expiry" };

  if (days < 0) {
    const total = Math.abs(days);
    return {
      status: "expired",
      days,
      label: `Expired ${total} day${total === 1 ? "" : "s"} ago`,
    };
  }
  if (days === 0) return { status: "expired", days, label: "Expires today" };
  if (days <= 7) {
    return { status: "soon", days, label: `${days} day${days === 1 ? "" : "s"} left` };
  }
  return { status: "ok", days, label: `${days} days left` };
}
