import CategoryMain from "@/components/category/category";
import { prisma } from "@/lib/prisma";
import { Category } from "@online-store/db"; 

export default async function Page() {
  const categories: Category[] = await prisma.category.findMany({
    orderBy: { id: "desc" },
  });

  const formatted = categories.map((c: Category) => ({
    id: c.id,
    name: c.name,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CategoryMain data={formatted} />;
}