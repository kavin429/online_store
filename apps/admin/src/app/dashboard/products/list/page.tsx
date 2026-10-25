import dynamic from "next/dynamic";
import LoadingScreen from "@online-store/ui/loading-screen";

const ManageProduct = dynamic(() => import("@/components/products/product_list"), {
  loading: () => <LoadingScreen label="Loading products..." />,
  ssr: false,
});

export default async function Page() {
  return <ManageProduct />;
}
