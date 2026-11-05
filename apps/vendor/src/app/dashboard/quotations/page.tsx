import { cookies } from "next/headers";
import VendorQuotationMain from "@/components/quotations/main";
import { prisma } from "@/lib/prisma";
import type { Quotation } from "@/lib/types";

function readVendorId() {
  const raw = cookies().get("vendor_session")?.value;
  if (!raw) return null;
  try {
    const id = Number(JSON.parse(raw).id);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export default async function VendorQuotationsPage() {
  const vendorId = readVendorId();

  if (!vendorId) {
    return <VendorQuotationMain data={[]} />;
  }

  const quotations = await prisma.quotation.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    include: {
      admin: { select: { id: true, name: true } },
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          vehicleType: true,
          vehicleNumber: true,
        },
      },
      items: { orderBy: { id: "asc" } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <VendorQuotationMain
      data={JSON.parse(JSON.stringify(quotations)) as Quotation[]}
    />
  );
}
