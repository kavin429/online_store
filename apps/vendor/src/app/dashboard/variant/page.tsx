import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import VariantMain from "@/components/variant/VariantMain";
import { House } from "lucide-react";

export default async function VariantPage() {
  const cookieStore = cookies();
  const vendorSessionRaw = cookieStore.get("vendor_session")?.value;
  const vendorId = vendorSessionRaw ? JSON.parse(vendorSessionRaw)?.id ?? null : null;

  const [variantTypes, initialValues] = await Promise.all([
    prisma.variantType.findMany({ orderBy: { id: "asc" } }),
    // show admin-created defaults (vendorId null) + this vendor's own values
    prisma.variantValue.findMany({
      where: { OR: [{ vendorId: null }, { vendorId }] },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold border-r pr-4">Vendor Panel</h2>
        <div className="ml-3">
          <House size={16} />
        </div>
        <span className="text-sm text-gray-500 ml-1.5">- Product Variants</span>
      </div>
      <VariantMain variantTypes={variantTypes} initialValues={initialValues} vendorId={vendorId} />
    </div>
  );
}
