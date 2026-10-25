"use client";

import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const EditProductDialog = dynamic(() => import("@/components/products/edit-product-dialog"), {
  loading: () => <div className="p-8 text-center text-muted-foreground">Loading...</div>,
  ssr: false,
});

export default function EditProductPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  if (!id) return <div className="p-8 text-red-500">No product id provided</div>;

  return (
    <div className="p-6">
      <EditProductDialog
        productId={Number(id)}
        open={true}
        onOpenChange={(o) => { if (!o) router.push("/dashboard/products/list"); }}
        onSaved={() => router.push("/dashboard/products/list")}
      />
    </div>
  );
}
