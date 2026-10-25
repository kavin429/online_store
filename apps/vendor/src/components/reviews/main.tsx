"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, Review } from "./column";

export default function ReviewsMain({ data }: { data: Review[] }) {
  const [reviews] = useState<Review[]>(data);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reviews & Ratings</h1>
        <p className="text-sm text-muted-foreground">Customer reviews on your products</p>
      </div>

      <DataTable
        columns={columns()}
        data={reviews}
        filterBy="product"
      />
    </div>
  );
}