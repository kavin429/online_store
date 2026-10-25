"use client";

import { useEffect, useState } from "react";
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
import type { Offer, ProductOption } from "@/lib/types";

const MAX_GALLERY = 8;

type FormState = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  images: string[];
  badgeText: string;
  ctaText: string;
  ctaLink: string;
  productIds: number[];
  startsAt: string;
  endsAt: string;
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
  productIds: [],
  startsAt: "",
  endsAt: "",
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
  productIds: (o.products || []).map((p) => p.productId),
  startsAt: o.startsAt ? o.startsAt.slice(0, 10) : "",
  endsAt: o.endsAt ? o.endsAt.slice(0, 10) : "",
});

export const buildOfferPayload = (f: FormState) => ({
  title: f.title.trim(),
  subtitle: f.subtitle.trim() || null,
  description: f.description.trim() || null,
  image: f.image || null,
  images: f.images,
  badgeText: f.badgeText.trim() || null,
  ctaText: f.ctaText.trim() || "Shop Now",
  ctaLink: f.ctaLink.trim() || null,
  productIds: f.productIds,
  startsAt: f.startsAt || null,
  endsAt: f.endsAt || null,
});

export type OfferPayload = ReturnType<typeof buildOfferPayload>;

type Props = {
  open: boolean;
  mode: "create" | "edit";
  offer?: Offer | null;
  products: ProductOption[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OfferPayload) => Promise<void> | void;
  saving?: boolean;
  error?: string | null;
};

export default function OfferFormDialog({
  open, mode, offer, products, onOpenChange, onSubmit, saving = false, error = null,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [localError, setLocalError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    if (open) {
      setForm(offer ? toFormState(offer) : emptyForm);
      setLocalError(null);
      setProductSearch("");
    }
  }, [open, offer]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleProduct = (id: number) =>
    setForm((p) => ({
      ...p,
      productIds: p.productIds.includes(id)
        ? p.productIds.filter((x) => x !== id)
        : [...p.productIds, id],
    }));

  const handleImage = (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setLocalError("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleGallery = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    if (list.some((f) => f.size > 2 * 1024 * 1024)) {
      setLocalError("Each gallery image must be under 2 MB.");
      return;
    }
    const room = MAX_GALLERY - form.images.length;
    if (room <= 0) {
      setLocalError(`You can add up to ${MAX_GALLERY} gallery images.`);
      return;
    }
    setLocalError(null);
    Promise.all(
      list.slice(0, room).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("read failed"));
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((read) => setForm((p) => ({ ...p, images: [...p.images, ...read] })))
      .catch(() => setLocalError("Could not read the selected images."));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setLocalError("Title is required.");
      return;
    }
    if (form.productIds.length === 0) {
      setLocalError("Select at least one product for this offer.");
      return;
    }
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
      setLocalError("End date can't be before the start date.");
      return;
    }
    setLocalError(null);
    await onSubmit(buildOfferPayload(form));
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );
  const displayError = localError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg space-y-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Offer" : "New Offer"}</DialogTitle>
        </DialogHeader>

        <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
          Offers are reviewed by the store admin before they appear on the landing site.
        </p>

        <div className="space-y-4">
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
              Extra images shown as a gallery on the offer page.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Badge Text</Label>
              <Input value={form.badgeText} onChange={(e) => update("badgeText", e.target.value)} placeholder="20% OFF" />
            </div>
            <div className="space-y-1">
              <Label>Button Text</Label>
              <Input value={form.ctaText} onChange={(e) => update("ctaText", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Button Link</Label>
            <Input value={form.ctaLink} onChange={(e) => update("ctaLink", e.target.value)} placeholder="/products" />
          </div>

          <div className="space-y-1">
            <Label>Products in this offer ({form.productIds.length} selected)</Label>
            <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search your products..." />
            <div className="border rounded max-h-40 overflow-y-auto divide-y">
              {filtered.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground">No products found.</p>
              )}
              {filtered.map((p) => (
                <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={form.productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  {p.name}
                </label>
              ))}
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

          {displayError && <p className="text-sm text-destructive">{displayError}</p>}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button variant="shoe" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : mode === "edit" ? "Save & Resubmit" : "Submit for Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
