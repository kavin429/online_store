import dynamic from "next/dynamic";

const ManageProduct = dynamic(() => import("@/components/products/product_list"), {
  loading: () => <div className="p-8 text-center text-muted-foreground">Loading...</div>,
  ssr: false,
});

export default async function Page() {
  return <ManageProduct />;
}
