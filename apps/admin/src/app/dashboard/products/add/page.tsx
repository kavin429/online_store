import dynamic from "next/dynamic";
import LoadingScreen from "@online-store/ui/loading-screen";

const CreateProduct = dynamic(() => import("@/components/products/create_prodcuts"), {
  loading: () => <LoadingScreen label="Loading product form..." />,
  ssr: false,
});

export default async function Page() {
  return <CreateProduct />;
}