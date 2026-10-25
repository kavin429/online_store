"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, Payout } from "./column";
import { DollarSign, Clock, CheckCircle } from "lucide-react";

export default function PayoutsMain({
  data,
  summary,
}: {
  data: Payout[];
  summary: { totalEarned: number; pendingAmount: number };
}) {
  const [payouts] = useState<Payout[]>(data);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Payouts & Earnings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-md p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="font-mono text-xl font-semibold">
              Rs. {summary.totalEarned.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border rounded-md p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="font-mono text-xl font-semibold">
              Rs. {summary.pendingAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border rounded-md p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <DollarSign size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Payouts</p>
            <p className="font-mono text-xl font-semibold">{payouts.length}</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payouts}
        filterBy="period"
      />
    </div>
  );
}