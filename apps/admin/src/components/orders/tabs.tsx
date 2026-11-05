"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@online-store/ui/tabs";
import type {
  Driver,
  Order,
  Quotation,
  QuotationProductOption,
  QuotationVendorOption,
} from "@/lib/types";
import OrderMain from "./main";
import QuotationMain from "@/components/quotations/main";

type Props = {
  orders: Order[];
  quotations: Quotation[];
  vendors: QuotationVendorOption[];
  products: QuotationProductOption[];
  drivers: Driver[];
};

export default function OrdersTabs({
  orders,
  quotations,
  vendors,
  products,
  drivers,
}: Props) {
  return (
    <div className="p-6">
      <Tabs defaultValue="customer" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Orders</h1>
          <TabsList>
            <TabsTrigger value="customer">Customer orders</TabsTrigger>
            <TabsTrigger value="purchase">Purchase quotations</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="customer" className="mt-0">
          <OrderMain data={orders} embedded />
        </TabsContent>

        <TabsContent value="purchase" className="mt-0">
          <QuotationMain
            data={quotations}
            vendors={vendors}
            products={products}
            drivers={drivers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
