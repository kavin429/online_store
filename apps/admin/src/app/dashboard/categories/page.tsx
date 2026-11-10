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
    // Convert image bytes to a data URL so the table can display it
    imageUrl: c.image
      ? `data:image/png;base64,${Buffer.from(c.image).toString("base64")}`
      : null,
  }));

  return <CategoryMain data={formatted} />;
}