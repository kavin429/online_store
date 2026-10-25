export type AutoNotifyResult = {
  evaluated: number;
  notified: number[];
} | null;

export async function triggerPromoAutoNotify(userId: number): Promise<AutoNotifyResult> {
  const base =
    process.env.ADMIN_API_URL ||
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    "http://localhost:3001";
  const secret = process.env.AUTO_NOTIFY_SECRET;

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/promos/auto-notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-auto-notify-secret": secret } : {}),
      },
      body: JSON.stringify({ userId }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Promo auto-notify failed:", response.status, await response.text().catch(() => ""));
      return null;
    }

    return (await response.json()) as AutoNotifyResult;
  } catch (error) {
    console.error("Promo auto-notify request error:", error);
    return null;
  }
}
