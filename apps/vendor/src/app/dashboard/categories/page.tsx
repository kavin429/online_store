import CategoryMain from "@/components/category/category";
import { prisma } from "@/lib/prisma";
import { Category } from "@prisma/client";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = cookies();
  const vendorSession = cookieStore.get("vendor_session")?.value;
  const role = vendorSession ? "vendor" : "admin";

  const categories: Category[] = await prisma.category.findMany({
    orderBy: { id: "desc" },
  });

  const formatted = categories.map((c: Category) => ({
    id: c.id,
    name: c.name,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CategoryMain data={formatted} role={role} />;
}
