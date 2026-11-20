import { redirect } from "next/navigation";

type Props = {
  params: { id: string };
};

export default function CategoryDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (Number.isFinite(id) && id > 0) {
    redirect(`/products?categoryId=${id}`);
  }
  redirect("/categories");
}