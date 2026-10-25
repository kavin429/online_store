import { cookies } from "next/headers";
import InventoryMain from "@/components/inventory/main";
import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  const vendorSessionRaw = cookies().get("vendor_session")?.value;
  let vendorId: number | null = null;

  if (vendorSessionRaw) {
    try {
      vendorId = JSON.parse(vendorSessionRaw).id;
    } catch {}
  }

  if (!vendorId) {
    return <InventoryMain data={[]} lowStockCount={0} />;
  }

  const products = await prisma.product.findMany({
    where: { vendorId },
    include: {
      variants: {
        include: {
          values: {
            include: { variantValue: { include: { variantType: true } } },
          },
        },
      },
    },
  });

  const inventory = products.flatMap((product) =>
    product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      product: { id: product.id, name: product.name },
      attributes: variant.values.map((v) => ({
        type: v.variantValue.variantType.name,
        value: v.variantValue.name,
        hexCode: v.variantValue.hexCode,
      })),
      stock: variant.stock,
      priceOverride: variant.priceOverride,
    }))
  );

  const lowStockCount = inventory.filter((item) => item.stock < 10).length;

  return (
    <InventoryMain
      data={JSON.parse(JSON.stringify(inventory))}
      lowStockCount={lowStockCount}
    />
  );
}