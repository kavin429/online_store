import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VendorProfileForm } from "@/components/profile/VendorProfileForm";

export const dynamic = "force-dynamic";

interface VendorSession {
  id: number;
  name?: string;
  email?: string;
}

export default async function VendorProfilePage() {
  const raw = cookies().get("vendor_session")?.value;
  if (!raw) redirect("/login");

  let session: VendorSession;
  try {
    session = JSON.parse(raw);
  } catch {
    redirect("/login");
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      province: true,
      district: true,
      city: true,
      address: true,
      status: true,
      createdAt: true,
      vendorSettings: { select: { storeName: true } },
    },
  });

  if (!vendor) redirect("/login");

  const [products, reviews] = await Promise.all([
    prisma.product.count({ where: { vendorId: vendor.id } }),
    prisma.review.count({ where: { product: { vendorId: vendor.id } } }),
  ]);

  return (
    <VendorProfileForm
      profile={{
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        country: vendor.country ?? "",
        province: vendor.province ?? "",
        district: vendor.district ?? "",
        city: vendor.city ?? "",
        address: vendor.address ?? "",
        status: vendor.status,
        createdAt: vendor.createdAt.toISOString(),
        storeName: vendor.vendorSettings?.storeName ?? null,
      }}
      stats={{ products, reviews }}
    />
  );
}
