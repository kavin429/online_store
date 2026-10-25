import dynamic from "next/dynamic";

const CreateProduct = dynamic(() => import("@/components/products/create_prodcuts"), {
  loading: () => <div className="p-8 text-center text-muted-foreground">Loading...</div>,
  ssr: false,
});

export default async function Page() {
  return <CreateProduct />;
}