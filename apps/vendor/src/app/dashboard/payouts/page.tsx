import { cookies } from "next/headers";
import PayoutsMain from "@/components/payouts/main";
import { prisma } from "@/lib/prisma";

export default async function PayoutsPage() {
  const vendorSessionRaw = cookies().get("vendor_session")?.value;
  let vendorId: number | null = null;

  if (vendorSessionRaw) {
    try {
      vendorId = JSON.parse(vendorSessionRaw).id;
    } catch {}
  }

  if (!vendorId) {
    return <PayoutsMain data={[]} summary={{ totalEarned: 0, pendingAmount: 0 }} />;
  }

  const payouts = await prisma.payout.findMany({
    where: { vendorId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const data = payouts.map((p) => ({
    id: p.id,
    amount: p.amount,
    status: p.status,
    period: p.period,
    paidAt: p.paidAt,
    note: p.note,
    createdAt: p.createdAt,
    items: p.items.map((i) => ({ id: i.id, orderId: i.orderId, amount: i.amount })),
  }));

  const totalEarned = payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <PayoutsMain
      data={JSON.parse(JSON.stringify(data))}
      summary={{ totalEarned, pendingAmount }}
    />
  );
}