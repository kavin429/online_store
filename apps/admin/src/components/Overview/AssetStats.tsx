"use client";

import { Card } from "@online-store/ui/card";
import {
  CheckCircle,
  Circle,
  ToolCase,
  AlertTriangle,
} from "lucide-react";

type Props = {
  total: number;
  store: number;
  used: number;
  repair: number;
  onRepairClick: () => void;
};

export default function AssetStats({
  total,
  store,
  used,
  repair,
  onRepairClick,
}: Props) {
  return (
    <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Total */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium pb-1">Total</h2>
            <h2 className="text-xl font-semibold">{total}</h2>
          </div>
          <ToolCase size={24} className="text-yellow-600" />
        </div>
      </Card>

      {/* Store */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium pb-1">In Store</h2>
            <h2 className="text-xl font-semibold">{store}</h2>
          </div>
          <Circle size={24} className="text-blue-600" />
        </div>
      </Card>

      {/* Used */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium pb-1">Used</h2>
            <h2 className="text-xl font-semibold">{used}</h2>
          </div>
          <CheckCircle size={24} className="text-green-600" />
        </div>
      </Card>

      {/* Repair (CLICKABLE) */}
      <Card
        className="p-4 cursor-pointer hover:shadow-md transition"
        onClick={onRepairClick}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium pb-1">Repair</h2>
            <h2 className="text-xl font-semibold">{repair}</h2>
          </div>
          <AlertTriangle size={24} className="text-red-600" />
        </div>
      </Card>

    </div>
  );
}
