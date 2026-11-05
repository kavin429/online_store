import type { NextRequest } from "next/server";

export function getVendorIdFromRequest(req: NextRequest): number | null {
  const raw = req.cookies.get("vendor_session")?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const id = Number(parsed?.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
