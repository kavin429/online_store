import { prisma } from "@/lib/prisma";
import VariantMain from "@/components/variant/VariantMain";
import { House } from "lucide-react";

export default async function VariantPage() {
  const [variantTypes, initialValues] = await Promise.all([
    prisma.variantType.findMany({ orderBy: { id: "asc" } }),
    prisma.variantValue.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold border-r pr-4">Online store</h2>
        <div className="ml-3">
          <House size={16} />
        </div>
        <span className="text-sm text-gray-500 ml-1.5">- Product Variant</span>
      </div>
      <VariantMain variantTypes={variantTypes} initialValues={initialValues} />
    </div>
  )

}
