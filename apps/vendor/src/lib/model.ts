import {prisma} from "@/lib/prisma";

export async function getCategoriesWithSubcategories() {
  const categories = await prisma.category.findMany({
    where: { status: "ACTIVE" },
    include: { subcategories: { where: { status: "ACTIVE" } } },
  });
  return categories;
}