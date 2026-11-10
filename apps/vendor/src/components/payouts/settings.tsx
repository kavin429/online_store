"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@online-store/ui/tabs";
import { toast } from "sonner";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Save,
  Store as StoreIcon,
  Trash2,
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

const MAX_FILE_MB = 5;
const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp";

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

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });
}

/**
 * Reads the chosen file, scales it down (keeps the page + API payload small)
 * and returns a data URL. The existing validator already accepts `data:image/`.
 */
async function fileToDataUrl(file: File, maxWidth: number, maxHeight: number) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/webp", 0.85);
}

export default function SettingsMain() {
  const [settings, setSettings] = useState<VendorSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const filledCount = REQUIRED_FIELDS.length - missingFields.length;

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

  // The Save button only appears once every required detail is filled and valid
  const canSave = isProfileComplete && !hasStoreErrors;

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

  const handleImagePick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "storeLogo" | "storeBanner"
  ) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG or WebP).");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_FILE_MB}MB.`);
      return;
    }

    try {
      const dataUrl =
        field === "storeBanner"
          ? await fileToDataUrl(file, 1600, 600)
          : await fileToDataUrl(file, 512, 512);
      update(field, dataUrl);
    } catch {
      toast.error("Could not read that image. Try another file.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Store</h1>
          <p className="text-sm text-muted-foreground">
            This is how your store appears to customers in the online store.
          </p>
        </div>

        {canSave ? (
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            <Save size={16} className="mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        ) : (
          <span className="inline-flex w-full items-center justify-center rounded-md border border-dashed border-fuchsia-300 px-3 py-2 text-sm text-fuchsia-700 sm:w-auto dark:border-fuchsia-800 dark:text-fuchsia-300">
            {isProfileComplete
              ? "Fix the highlighted fields to save"
              : "Fill all required details to save"}
          </span>
        )}
      </div>

      {!isProfileComplete && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Complete your store profile to go live
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                Missing:{" "}
                {missingFields
                  .map((f) => f.replace(/([A-Z])/g, " $1").trim())
                  .join(", ")}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-yellow-200 dark:bg-yellow-900/50">
                  <div
                    className="h-full rounded-full bg-fuchsia-600 transition-all"
                    style={{
                      width: `${(filledCount / REQUIRED_FIELDS.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                  {filledCount}/{REQUIRED_FIELDS.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isProfileComplete && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <p className="font-medium text-green-800 dark:text-green-200">
              {hasStoreErrors
                ? "All details filled. Fix the highlighted fields to save."
                : "All details filled. Press Save Changes to go live."}
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
          {/* Hidden file inputs */}
          <input
            ref={bannerInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => handleImagePick(e, "storeBanner")}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => handleImagePick(e, "storeLogo")}
          />

          {/* Live preview — click the banner / logo to choose an image */}
          <div className="overflow-hidden rounded-xl border">
            <div className="relative h-32 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 sm:h-44">
              {settings.storeBanner ? (
                <img
                  src={settings.storeBanner}
                  alt="Store banner preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-white/90 transition-colors hover:bg-black/10"
                >
                  <ImagePlus className="h-6 w-6" />
                  Choose banner image
                  <span className="text-xs text-white/70">
                    Recommended 1600×600 · PNG, JPG or WebP · max {MAX_FILE_MB}MB
                  </span>
                </button>
              )}

              {settings.storeBanner && (
                <div className="absolute right-2 top-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-1.5 h-4 w-4" /> Change
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    aria-label="Remove banner"
                    onClick={() => update("storeBanner", "")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 p-4">
              {/* z-10 keeps the logo above the banner (fixes the clipped logo) */}
              <div className="relative z-10 -mt-10 shrink-0 sm:-mt-12">
                {settings.storeLogo ? (
                  <img
                    src={settings.storeLogo}
                    alt="Store logo preview"
                    className="h-16 w-16 rounded-xl border-4 border-background bg-background object-cover sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border-4 border-background bg-muted text-muted-foreground sm:h-20 sm:w-20">
                    <StoreIcon className="h-6 w-6" />
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Choose store logo"
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-600 text-white shadow hover:bg-fuchsia-700"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {settings.storeName || "Your store name"}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {settings.description ||
                    "Your store description will appear here."}
                </p>
                {settings.storeLogo && (
                  <button
                    type="button"
                    onClick={() => update("storeLogo", "")}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    Remove logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
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
            <div className="space-y-2 md:col-span-2">
              <Label>Description *</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
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