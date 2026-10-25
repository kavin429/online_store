import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding VariantTypes...");

  const variantTypes = [
    { name: "Color", slug: "color" },
    { name: "Size", slug: "size" },
    { name: "Weight", slug: "weight" },
    { name: "Volume", slug: "volume" },
    { name: "Waist", slug: "waist" },
  ];

  for (const type of variantTypes) {
    await prisma.variantType.upsert({
      where: { slug: type.slug },
      update: {},
      create: type,
    });
  }

  console.log("VariantTypes seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });