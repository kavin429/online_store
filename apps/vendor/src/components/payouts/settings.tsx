"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@online-store/ui/tabs";
import { toast } from "sonner";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";

type VendorSettings = {
  storeName: string;
  storeLogo: string;
  storeBanner: string;
  description: string;
  taxId: string;
  businessReg: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
};

const DEFAULT_SETTINGS: VendorSettings = {
  storeName: "",
  storeLogo: "",
  storeBanner: "",
  description: "",
  taxId: "",
  businessReg: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  branch: "",
};

const REQUIRED_FIELDS: (keyof VendorSettings)[] = [
  "storeName",
  "description",
  "taxId",
  "bankName",
  "accountName",
  "accountNumber",
];

export default function SettingsMain() {
  const router = useRouter();
  const [settings, setSettings] = useState<VendorSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/vendor-settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setSettings({
            storeName: json.data.storeName || "",
            storeLogo: json.data.storeLogo || "",
            storeBanner: json.data.storeBanner || "",
            description: json.data.description || "",
            taxId: json.data.taxId || "",
            businessReg: json.data.businessReg || "",
            bankName: json.data.bankName || "",
            accountName: json.data.accountName || "",
            accountNumber: json.data.accountNumber || "",
            branch: json.data.branch || "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isProfileComplete = REQUIRED_FIELDS.every(
    (field) => settings[field]?.trim() !== ""
  );

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => !settings[field]?.trim()
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      toast.success("Settings saved successfully");
      if (data.isProfileComplete) {
        toast.success("Profile completed! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard/overview");
        }, 1500);
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof VendorSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {!isProfileComplete && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Complete your profile to access all features
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                Missing: {missingFields.map((f) => f.replace(/([A-Z])/g, " $1").trim()).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {isProfileComplete && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="font-medium text-green-800 dark:text-green-200">
              Profile complete! You have full access to all features.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="store" className="w-full">
        <TabsList>
          <TabsTrigger value="store">Store Profile</TabsTrigger>
          <TabsTrigger value="business">Business & Tax</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Store Name *</Label>
              <Input
                value={settings.storeName}
                onChange={(e) => update("storeName", e.target.value)}
                placeholder="My Store"
              />
            </div>
            <div className="space-y-2">
              <Label>Store Logo URL</Label>
              <Input
                value={settings.storeLogo}
                onChange={(e) => update("storeLogo", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Store Banner URL</Label>
              <Input
                value={settings.storeBanner}
                onChange={(e) => update("storeBanner", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description *</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={settings.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Tell customers about your store..."
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax ID / TIN *</Label>
              <Input
                value={settings.taxId}
                onChange={(e) => update("taxId", e.target.value)}
                placeholder="Tax identification number"
              />
            </div>
            <div className="space-y-2">
              <Label>Business Registration No.</Label>
              <Input
                value={settings.businessReg}
                onChange={(e) => update("businessReg", e.target.value)}
                placeholder="Business registration number"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="banking" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank Name *</Label>
              <Input
                value={settings.bankName}
                onChange={(e) => update("bankName", e.target.value)}
                placeholder="Bank name"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Holder Name *</Label>
              <Input
                value={settings.accountName}
                onChange={(e) => update("accountName", e.target.value)}
                placeholder="Account holder name"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number *</Label>
              <Input
                value={settings.accountNumber}
                onChange={(e) => update("accountNumber", e.target.value)}
                placeholder="Account number"
              />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Input
                value={settings.branch}
                onChange={(e) => update("branch", e.target.value)}
                placeholder="Branch name"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
