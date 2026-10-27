"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Textarea } from "@online-store/ui/textarea";
import { compressImageFile } from "@online-store/ui/lib/image";
import type { Offer, OfferStatus, OfferBasis } from "@/lib/types";

export type ProductOption = {
  id: number;
  name: string;
  subCategoryId?: number | null;
};
export type PromoOption = { id: number; code: string };
export type SubCategoryOption = { id: number; name: string };

export const MAX_GALLERY_IMAGES = 8;
const MAX_GALLERY = MAX_GALLERY_IMAGES;

/* What the offer is based on. Add/remove entries freely. */
export const OFFER_BASIS_OPTIONS: { value: OfferBasis; label: string }[] = [
  { value: "FESTIVE", label: "Festive season" },
  { value: "SPECIAL_DAY", label: "Special shopping day (11.11, Black Friday…)" },
  { value: "ANNIVERSARY", label: "Platform anniversary" },
  { value: "NEW_CUSTOMER", label: "New customer" },
  { value: "FLASH_SALE", label: "Flash sale" },
  { value: "END_OF_SEASON", label: "End-of-season sale" },
  { value: "PAYDAY", label: "Payday / monthly promotion" },
  { value: "PAYMENT", label: "Payment offer (bank / card / wallet)" },
  { value: "LOYALTY", label: "Customer loyalty" },
  { value: "PRODUCT_LAUNCH", label: "Product launch" },
  { value: "CLEARANCE", label: "Stock clearance" },
  { value: "BUNDLE", label: "Bundle offer" },
  { value: "CATEGORY", label: "Category-specific sale" },
  { value: "OTHER", label: "Other" },
];

/* Bases that need a sub category to be chosen. Keep in sync with
   BASES_REQUIRING_SUBCATEGORY in src/lib/offer-basis.ts */
export const BASIS_WITH_SUBCATEGORY: OfferBasis[] = [
  "CATEGORY",
  "END_OF_SEASON",
  "CLEARANCE",
];

type FormState = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  images: string[];
  badgeText: string;
  ctaText: string;
  ctaLink: string;
  promoId: string;
  basis: OfferBasis | "";
  subCategoryId: string;
  productIds: number[];
  sortOrder: string;
  showOnLanding: boolean;
  startsAt: string;
  endsAt: string;
  status: OfferStatus;
};

const emptyForm: FormState = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  images: [],
  badgeText: "",
  ctaText: "Shop Now",
  ctaLink: "",
  promoId: "",
  basis: "",
  subCategoryId: "",
  productIds: [],
  sortOrder: "0",
  showOnLanding: true,
  startsAt: "",
  endsAt: "",
  status: "ACTIVE",
};

const toFormState = (o: Offer): FormState => ({
  title: o.title,
  subtitle: o.subtitle || "",
  description: o.description || "",
  image: o.image || "",
  images: Array.isArray(o.images) ? o.images : [],
  badgeText: o.badgeText || "",
  ctaText: o.ctaText || "Shop Now",
  ctaLink: o.ctaLink || "",
  promoId: o.promoId != null ? String(o.promoId) : "",
  basis: o.basis || "",
  subCategoryId: o.subCategoryId != null ? String(o.subCategoryId) : "",
  productIds: (o.products || []).map((p) => p.productId),
  sortOrder: String(o.sortOrder ?? 0),
  showOnLanding: o.showOnLanding,
  startsAt: o.startsAt ? o.startsAt.slice(0, 10) : "",
  endsAt: o.endsAt ? o.endsAt.slice(0, 10) : "",
  status: o.status,
});

const needsSubCategory = (basis: FormState["basis"]) =>
  basis !== "" && BASIS_WITH_SUBCATEGORY.includes(basis);

export const buildOfferPayload = (f: FormState) => ({
  title: f.title.trim(),
  subtitle: f.subtitle.trim() || null,
  description: f.description.trim() || null,
  image: f.image || null,
  images: f.images,
  badgeText: f.badgeText.trim() || null,
  ctaText: f.ctaText.trim() || "Shop Now",
  ctaLink: f.ctaLink.trim() || null,
  promoId: f.promoId ? Number(f.promoId) : null,
  basis: f.basis || null,
  subCategoryId:
    needsSubCategory(f.basis) && f.subCategoryId ? Number(f.subCategoryId) : null,
  productIds: f.productIds,
  sortOrder: Number(f.sortOrder) || 0,
  showOnLanding: f.showOnLanding,
  startsAt: f.startsAt || null,
  endsAt: f.endsAt || null,
  status: f.status,
});

export type OfferPayload = ReturnType<typeof buildOfferPayload>;

type Props = {
  open: boolean;
  mode: "create" | "edit";
  offer?: Offer | null;
  products: ProductOption[];
  promos: PromoOption[];
  subCategories?: SubCategoryOption[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OfferPayload) => Promise<void> | void;
  saving?: boolean;
  error?: string | null;
};

export default function OfferFormDialog({
  open,
  mode,
  offer,
  products,
  promos,
  subCategories = [],
  onOpenChange,
  onSubmit,
  saving = false,
  error = null,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [localError, setLocalError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [processingImages, setProcessingImages] = useState(false);
  // The rest of the form stays hidden until the setup steps are completed.
  // Once unlocked it stays open (so it doesn't collapse while editing).
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(offer ? toFormState(offer) : emptyForm);
      setLocalError(null);
      setProductSearch("");
      setUnlocked(mode === "edit");
    }
  }, [open, offer, mode]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const showSubCategory = needsSubCategory(form.basis);

  // Step 1 done = basis chosen; Step 2 done = sub category chosen (when required).
  const setupComplete =
    form.basis !== "" && (!showSubCategory || form.subCategoryId !== "");

  useEffect(() => {
    if (setupComplete) setUnlocked(true);
  }, [setupComplete]);

  const showRest = unlocked || setupComplete;

  // Changing the basis: clear the sub category if the new basis doesn't use one.
  const handleBasisChange = (value: string) =>
    setForm((p) => {
      const basis = value as FormState["basis"];
      return {
        ...p,
        basis,
        subCategoryId: needsSubCategory(basis) ? p.subCategoryId : "",
      };
    });

  // Changing the sub category: drop selected products that don't belong to it.
  const handleSubCategoryChange = (value: string) =>
    setForm((p) => {
      if (!value) return { ...p, subCategoryId: "" };
      const subId = Number(value);
      const allowed = new Set(
        products.filter((x) => x.subCategoryId === subId).map((x) => x.id),
      );
      return {
        ...p,
        subCategoryId: value,
        productIds: p.productIds.filter((id) => allowed.has(id)),
      };
    });

  const toggleProduct = (id: number) =>
    setForm((p) => ({
      ...p,
      productIds: p.productIds.includes(id)
        ? p.productIds.filter((x) => x !== id)
        : [...p.productIds, id],
    }));

  const handleImage = async (file?: File) => {
    if (!file) return;
    setLocalError(null);
    setProcessingImages(true);
    try {
      update("image", await compressImageFile(file));
    } catch (err: any) {
      setLocalError(err?.message || "Could not read the selected image.");
    } finally {
      setProcessingImages(false);
    }
  };

  const handleGallery = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_GALLERY - form.images.length;
    if (room <= 0) {
      setLocalError(`You can add up to ${MAX_GALLERY} gallery images.`);
      return;
    }
    setLocalError(null);
    setProcessingImages(true);
    try {
      const read = await Promise.all(
        Array.from(files)
          .slice(0, room)
          .map((file) => compressImageFile(file)),
      );
      setForm((p) => ({ ...p, images: [...p.images, ...read] }));
    } catch (err: any) {
      setLocalError(err?.message || "Could not read the selected images.");
    } finally {
      setProcessingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (processingImages) return;
    if (mode === "create" && !form.basis) {
      setLocalError("Please select what this offer is based on.");
      return;
    }
    if (showSubCategory && !form.subCategoryId) {
      setLocalError("Please select a sub category for this offer type.");
      return;
    }
    if (!form.title.trim()) {
      setLocalError("Title is required.");
      return;
    }
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
      setLocalError("End date can't be before the start date.");
      return;
    }
    setLocalError(null);
    await onSubmit(buildOfferPayload(form));
  };

  // Products shown: limited to the chosen sub category (when one is required),
  // then narrowed by the search box.
  const filtered = useMemo(() => {
    const subId =
      showSubCategory && form.subCategoryId ? Number(form.subCategoryId) : null;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        (subId === null || p.subCategoryId === subId) &&
        p.name.toLowerCase().includes(q),
    );
  }, [products, productSearch, showSubCategory, form.subCategoryId]);

  const selectAllFiltered = () =>
    setForm((p) => ({
      ...p,
      productIds: Array.from(
        new Set([...p.productIds, ...filtered.map((x) => x.id)]),
      ),
    }));

  const displayError = localError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg space-y-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Offer" : "New Offer"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Step 1: what is the offer based on? ── */}
          <div className="space-y-1">
            <Label>1. What is this offer based on?</Label>
            <select
              value={form.basis}
              onChange={(e) => handleBasisChange(e.target.value)}
              className="border rounded p-2 w-full text-sm"
            >
              <option value="">Select a basis…</option>
              {OFFER_BASIS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {!form.basis && (
              <p className="text-xs text-muted-foreground">
                Choose a basis to continue.
              </p>
            )}
          </div>

          {/* ── Step 2: related sub category (only for bases that need one) ── */}
          {showSubCategory && (
            <div className="space-y-1">
              <Label>2. Which sub category?</Label>
              <select
                value={form.subCategoryId}
                onChange={(e) => handleSubCategoryChange(e.target.value)}
                className="border rounded p-2 w-full text-sm"
              >
                <option value="">Select a sub category…</option>
                {subCategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Only products from this sub category can be added to the offer.
              </p>
            </div>
          )}

          {/* ── Rest of the form opens once the steps above are complete ── */}
          {showRest && (
            <>
              <div className="border-t pt-4 space-y-4">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Festival Mega Sale" />
                </div>

                <div className="space-y-1">
                  <Label>Subtitle</Label>
                  <Input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="Up to 40% off selected items" />
                </div>

                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
                </div>

                <div className="space-y-1">
                  <Label>Banner Image</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleImage(e.target.files?.[0])} />
                  {form.image && (
                    <div className="flex items-center gap-2">
                      <img src={form.image} alt="preview" className="h-20 rounded object-cover" />
                      <Button type="button" variant="outline" size="sm" onClick={() => update("image", "")}>
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>
                    Gallery Images ({form.images.length}/{MAX_GALLERY})
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      handleGallery(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  {form.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {form.images.map((src, i) => (
                        <div key={i} className="relative">
                          <img src={src} alt={`Gallery ${i + 1}`} className="h-16 w-full rounded object-cover" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute right-1 top-1 h-5 px-1.5 text-xs"
                            onClick={() =>
                              setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))
                            }
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Extra images shown as a gallery on the offer page. The banner image is used as the cover.
                    Images are resized and compressed automatically before upload.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Badge Text</Label>
                    <Input value={form.badgeText} onChange={(e) => update("badgeText", e.target.value)} placeholder="20% OFF" />
                  </div>
                  <div className="space-y-1">
                    <Label>Display Order</Label>
                    <Input type="number" value={form.sortOrder} onChange={(e) => update("sortOrder", e.target.value)} />
                    <p className="text-xs text-muted-foreground">Lower number shows first.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Button Text</Label>
                    <Input value={form.ctaText} onChange={(e) => update("ctaText", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Button Link</Label>
                    <Input value={form.ctaLink} onChange={(e) => update("ctaLink", e.target.value)} placeholder="/products" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Show Promo Code (optional)</Label>
                  <select
                    value={form.promoId}
                    onChange={(e) => update("promoId", e.target.value)}
                    className="border rounded p-2 w-full text-sm"
                  >
                    <option value="">None</option>
                    {promos.map((p) => (
                      <option key={p.id} value={p.id}>{p.code}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label>Products in this offer ({form.productIds.length} selected)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={selectAllFiltered}
                      disabled={filtered.length === 0}
                    >
                      Select all shown
                    </Button>
                  </div>
                  <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products..." />
                  <div className="border rounded max-h-40 overflow-y-auto divide-y">
                    {showSubCategory && !form.subCategoryId ? (
                      <p className="p-2 text-xs text-muted-foreground">
                        Select a sub category to see its products.
                      </p>
                    ) : filtered.length === 0 ? (
                      <p className="p-2 text-xs text-muted-foreground">No products found.</p>
                    ) : (
                      filtered.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50">
                          <input
                            type="checkbox"
                            checked={form.productIds.includes(p.id)}
                            onChange={() => toggleProduct(p.id)}
                          />
                          {p.name}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Starts</Label>
                    <Input type="date" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Ends</Label>
                    <Input type="date" value={form.endsAt} onChange={(e) => update("endsAt", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <select
                      value={form.status}
                      onChange={(e) => update("status", e.target.value as OfferStatus)}
                      className="border rounded p-2 w-full text-sm"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm pt-6">
                    <input
                      type="checkbox"
                      checked={form.showOnLanding}
                      onChange={(e) => update("showOnLanding", e.target.checked)}
                    />
                    Show on landing page
                  </label>
                </div>
              </div>
            </>
          )}

          {displayError && <p className="text-sm text-destructive">{displayError}</p>}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || processingImages}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || processingImages || !showRest}>
            {processingImages
              ? "Processing images..."
              : saving
                ? "Saving..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Create Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}