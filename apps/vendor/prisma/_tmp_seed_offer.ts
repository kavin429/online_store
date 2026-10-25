import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = "Test1234!";
  const hash = await bcrypt.hash(password, 10);
  const email = "vendoroffer@test.com";

  const vendor = await prisma.vendor.upsert({
    where: { email },
    update: { status: "ACTIVE", password: hash },
    create: {
      name: "Offer Test Vendor",
      email,
      phone: "0770000000",
      password: hash,
      plainPassword: password,
      status: "ACTIVE",
    },
  });

  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({ data: { name: "Test Category" } });
  }

  let product = await prisma.product.findFirst({ where: { vendorId: vendor.id } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Vendor Test Product",
        sellingPrice: 1000,
        status: "ACTIVE",
        categoryId: category.id,
        vendorId: vendor.id,
      },
    });
  }

  console.log(JSON.stringify({ vendorId: vendor.id, productId: product.id, email, password }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
