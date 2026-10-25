"use client";

import { useEffect, useState } from "react";
import AssetStats from "./AssetStats";
import RepairDialog from "./RepairDialog";
import { Spinner } from "@online-store/ui/spinner";


type Stats = {
  total: number;
  store: number;
  used: number;
  repair: number;
};

type RepairAsset = {
  id: string;
  name: string;
  repairDate: string;
};

export default function Main({ assetType }: { assetType: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [repairAssets, setRepairAssets] = useState<RepairAsset[]>([]);
  const [openRepair, setOpenRepair] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const statsRes = await fetch(`/api/assets/${assetType}`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const repairRes = await fetch(`/api/assets/${assetType}/repair`);
      const repairData = await repairRes.json();
      setRepairAssets(repairData);

      setLoading(false);
    }

    fetchData();
  }, [assetType]);

  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner className="h-10 w-10 text-fuchsia-800" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <AssetStats
        total={stats.total}
        store={stats.store}
        used={stats.used}
        repair={stats.repair}
        onRepairClick={() => setOpenRepair(true)}
      />

      <RepairDialog
        open={openRepair}
        onClose={() => setOpenRepair(false)}
        assets={repairAssets}
      />
    </>
  );
}
