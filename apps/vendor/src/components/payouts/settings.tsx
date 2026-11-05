"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@online-store/ui/tabs";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Save,
  Store as StoreIcon,
} from "lucide-react";

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

function isValidImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/") || trimmed.startsWith("data:image/")) return true;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SettingsMain() {
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

  const storeErrors = useMemo(() => {
    const errors: Partial<Record<keyof VendorSettings, string>> = {};

    if (!settings.storeName.trim()) {
      errors.storeName = "Store name is required.";
    } else if (settings.storeName.trim().length < 2) {
      errors.storeName = "Store name must be at least 2 characters.";
    }

    if (!settings.description.trim()) {
      errors.description = "Store description is required.";
    } else if (settings.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters.";
    }

    if (!isValidImageUrl(settings.storeLogo)) {
      errors.storeLogo = "Enter a valid image URL.";
    }

    if (!isValidImageUrl(settings.storeBanner)) {
      errors.storeBanner = "Enter a valid image URL.";
    }

    return errors;
  }, [settings]);

  const hasStoreErrors = Object.keys(storeErrors).length > 0;

  const handleSave = async () => {
    if (hasStoreErrors) {
      toast.error("Please fix the store profile fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/vendor-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      toast.success("Store settings saved successfully");
      if (data.isProfileComplete) {
        toast.success("Store profile complete!");
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
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Store</h1>
          <p className="text-sm text-muted-foreground">
            This is how your store appears to customers in the online store.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {!isProfileComplete && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Complete your store profile to go live
              </p>
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                Missing:{" "}
                {missingFields
                  .map((f) => f.replace(/([A-Z])/g, " $1").trim())
                  .join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {isProfileComplete && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="font-medium text-green-800 dark:text-green-200">
              Store profile complete. Your store is ready for customers.
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

        <TabsContent value="store" className="mt-4 space-y-4">
          {/* Live preview */}
          <div className="overflow-hidden rounded-xl border">
            <div className="relative h-32 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400">
              {settings.storeBanner ? (
                <img
                  src={settings.storeBanner}
                  alt="Store banner preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/80">
                  Store banner preview
                </div>
              )}
            </div>
            <div className="flex items-start gap-3 p-4">
              {settings.storeLogo ? (
                <img
                  src={settings.storeLogo}
                  alt="Store logo preview"
                  className="-mt-10 h-16 w-16 rounded-xl border-4 border-background bg-background object-cover"
                />
              ) : (
                <div className="-mt-10 flex h-16 w-16 items-center justify-center rounded-xl border-4 border-background bg-muted text-muted-foreground">
                  <StoreIcon className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {settings.storeName || "Your store name"}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {settings.description ||
                    "Your store description will appear here."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Store Name *</Label>
              <Input
                value={settings.storeName}
                onChange={(e) => update("storeName", e.target.value)}
                placeholder="My Store"
                aria-invalid={Boolean(storeErrors.storeName)}
              />
              {storeErrors.storeName && (
                <p className="text-xs text-red-500">{storeErrors.storeName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Store Logo URL</Label>
              <Input
                value={settings.storeLogo}
                onChange={(e) => update("storeLogo", e.target.value)}
                placeholder="https://..."
                aria-invalid={Boolean(storeErrors.storeLogo)}
              />
              {storeErrors.storeLogo && (
                <p className="text-xs text-red-500">{storeErrors.storeLogo}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Store Banner URL</Label>
              <Input
                value={settings.storeBanner}
                onChange={(e) => update("storeBanner", e.target.value)}
                placeholder="https://..."
                aria-invalid={Boolean(storeErrors.storeBanner)}
              />
              {storeErrors.storeBanner && (
                <p className="text-xs text-red-500">{storeErrors.storeBanner}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description *</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={settings.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Tell customers about your store..."
                aria-invalid={Boolean(storeErrors.description)}
              />
              {storeErrors.description && (
                <p className="text-xs text-red-500">
                  {storeErrors.description}
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="business" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

        <TabsContent value="banking" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
