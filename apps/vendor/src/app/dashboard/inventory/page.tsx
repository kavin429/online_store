import { cookies } from "next/headers";
import InventoryMain from "@/components/inventory/main";
import { getVendorInventory } from "@/lib/inventory";

export default async function InventoryPage() {
  const vendorSessionRaw = cookies().get("vendor_session")?.value;
  let vendorId: number | null = null;

  if (vendorSessionRaw) {
    try {
      vendorId = JSON.parse(vendorSessionRaw).id;
    } catch {}
  }

  if (!vendorId) {
    return (
      <InventoryMain
        data={[]}
        lowStockCount={0}
        expiredBatches={0}
        expiringSoonBatches={0}
      />
    );
  }

  const inventory = await getVendorInventory(vendorId);

  return (
    <InventoryMain
      data={JSON.parse(JSON.stringify(inventory.data))}
      lowStockCount={inventory.lowStockCount}
      expiredBatches={inventory.expiredBatches}
      expiringSoonBatches={inventory.expiringSoonBatches}
    />
  );
}
