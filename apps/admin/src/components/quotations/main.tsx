"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { Button } from "@online-store/ui/button";
import { Plus } from "lucide-react";
import type {
  Driver,
  Quotation,
  QuotationProductOption,
  QuotationVendorOption,
} from "@/lib/types";
import { columns } from "./column";
import CreateQuotationDialog from "./create-request-dialog";
import QuotationDetailsDialog from "./details-dialog";

type Props = {
  data: Quotation[];
  vendors: QuotationVendorOption[];
  products: QuotationProductOption[];
  drivers: Driver[];
};

export default function QuotationMain({ data, vendors, products, drivers }: Props) {
  const [quotations, setQuotations] = useState<Quotation[]>(data);

  const [viewing, setViewing] = useState<Quotation | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  const handleView = (quotation: Quotation) => {
    setViewing(quotation);
    setViewOpen(true);
  };

  const handleUpdated = (updated: Quotation) => {
    setQuotations((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    setViewing(updated);
  };

  const refresh = async () => {
    try {
      const res = await fetch("/api/quotations");
      if (!res.ok) return;
      const json = await res.json();
      setQuotations(json.data ?? []);
    } catch (error) {
      console.error("Failed to refresh quotations", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Purchase quotations</h2>
          <p className="text-xs text-muted-foreground">
            Ask vendors to supply stock, then track acceptance, pickup and receiving.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New request
        </Button>
      </div>

      <DataTable
        columns={columns(handleView)}
        data={quotations}
        filterBy="vendorName"
      />

      <CreateQuotationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        vendors={vendors}
        products={products}
        onCreated={(quotation) => {
          setQuotations((prev) => [quotation, ...prev]);
          void refresh();
        }}
      />

      <QuotationDetailsDialog
        quotation={viewing}
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) void refresh();
        }}
        drivers={drivers}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
