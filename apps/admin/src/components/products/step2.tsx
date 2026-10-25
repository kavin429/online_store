"use client";

import React, { useEffect, useState } from "react";
import { Form } from "@online-store/ui/form";
import { Input } from "@online-store/ui/input";
import { Checkbox } from "@online-store/ui/checkbox";
import { Upload, X } from "lucide-react";
import type { VariantType, VariantValue } from "@/lib/types";

type Step2Props = {
  form: any;
};

export default function Step2({ form }: Step2Props) {
  const rawVariantTypeIds = form.watch("variantTypeIds");
  const variantTypeIds: number[] = Array.isArray(rawVariantTypeIds) ? rawVariantTypeIds : [];

  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [valuesByType, setValuesByType] = useState<Record<number, VariantValue[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/variants")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVariantTypes(data);
        } else {
          console.error("Unexpected /api/variants response:", data);
          setVariantTypes([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch variant types:", err);
        setVariantTypes([]);
      });
  }, []);

  useEffect(() => {
    if (variantTypeIds.length === 0) {
      setValuesByType({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      variantTypeIds.map((id) =>
        fetch(`/api/variant-values?variantTypeId=${id}`)
          .then((res) => res.json())
          .then((data) => [id, Array.isArray(data) ? data : []] as const),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        const map: Record<number, VariantValue[]> = {};
        results.forEach(([id, data]) => {
          map[id] = data;
        });
        setValuesByType(map);
      })
      .catch((err) => console.error("Failed to fetch variant values:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(variantTypeIds)]);

  if (variantTypeIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No variant types were selected for this subcategory. Go back to Step 1
        and choose at least one (e.g. Color, Size, Weight) to configure options here.
      </p>
    );
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        {variantTypeIds.map((typeId) => {
          const variantType = Array.isArray(variantTypes)
            ? variantTypes.find((v) => v.id === typeId)
            : undefined;
          const values = valuesByType[typeId] || [];
          return (
            <VariantTypeSection
              key={typeId}
              form={form}
              variantType={variantType}
              values={values}
            />
          );
        })}
        {loading && (
          <p className="text-sm text-muted-foreground">Loading variant values...</p>
        )}
      </div>
    </Form>
  );
}

type SelectedEntry = {
  variantValueId: number;
  name: string;
  hexCode?: string | null;
  priceAdjustment: number;
  stock: number;
  image: File | null;
  existingImageUrl?: string | null;
};

function supportsImage(variantType?: VariantType) {
  return variantType?.slug === "color";
}

function VariantTypeSection({
  form,
  variantType,
  values,
}: {
  form: any;
  variantType?: VariantType;
  values: VariantValue[];
}) {
  if (!variantType) return null;

  const fieldName = `options.${variantType.slug}`;
  const rawSelected = form.watch(fieldName);
  const selected: SelectedEntry[] = Array.isArray(rawSelected) ? rawSelected : [];
  const showImage = supportsImage(variantType);

  const toggleValue = (value: VariantValue, checked: boolean) => {
    const current: SelectedEntry[] = form.getValues(fieldName) || [];
    if (checked) {
      form.setValue(fieldName, [
        ...current,
        {
          variantValueId: value.id,
          name: value.name,
          hexCode: value.hexCode,
          priceAdjustment: 0,
          stock: 0,
          image: null,
        },
      ]);
    } else {
      form.setValue(
        fieldName,
        current.filter((c) => c.variantValueId !== value.id),
      );
    }
  };

  const updateEntry = (valueId: number, patch: Partial<SelectedEntry>) => {
    const current: SelectedEntry[] = form.getValues(fieldName) || [];
    form.setValue(
      fieldName,
      current.map((c) => (c.variantValueId === valueId ? { ...c, ...patch } : c)),
    );
  };

  return (
    <div className="border p-4 rounded space-y-4">
      <h3 className="font-semibold text-lg">{variantType.name}</h3>

      {values.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No {variantType.name.toLowerCase()} values found in the database yet.
          Add some under Manage Variants first.
        </p>
      )}

      <div className="space-y-4">
        {values.map((value) => {
          const entry = selected.find((s) => s.variantValueId === value.id);
          const checked = !!entry;

          return (
            <div key={value.id} className="rounded-lg border p-3 sm:p-4 space-y-3">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(isChecked) => toggleValue(value, !!isChecked)}
                />
                {value.hexCode && (
                  <span
                    className="w-5 h-5 rounded-full border inline-block shrink-0 border-2 border-gray-400 dark:border-gray-200"
                    style={{ backgroundColor: value.hexCode }}
                  />
                )}
                <span className="font-medium">
                  {value.name}
                  {value.unit ? ` ${value.unit}` : ""}
                </span>
              </label>

              {checked && (
                <div
                  className={`grid grid-cols-1 gap-4 sm:gap-6 items-start pl-0 sm:pl-7 ${showImage ? "sm:grid-cols-3" : "sm:grid-cols-2"
                    }`}
                >
                  {showImage && (
                    <div className="flex flex-col gap-1 w-full">
                      <label className="flex h-8 items-end text-xs text-muted-foreground leading-tight">
                        Variant Image
                      </label>

                      <input
                        id={`image-${variantType.id}-${value.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateEntry(value.id, { image: file });
                          }
                        }}
                      />

                      <div className="relative inline-block h-9 w-9 sm:h-24 sm:w-24">
                        <label
                          htmlFor={`image-${variantType.id}-${value.id}`}
                          className="flex h-full w-full shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed hover:bg-muted transition overflow-hidden"
                        >
                          {entry?.image ? (
                            <img
                              src={URL.createObjectURL(entry.image)}
                              alt={value.name}
                              className="h-full w-full object-cover"
                            />
                          ) : entry?.existingImageUrl ? (
                            <img
                              src={entry.existingImageUrl}
                              alt={value.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                              <Upload className="h-4 w-4 sm:h-5 sm:w-5 sm:mb-1" />
                              <span className="hidden sm:block text-xs">Upload</span>
                            </div>
                          )}
                        </label>
                        {(entry?.image || entry?.existingImageUrl) && (
                          <button
                            type="button"
                            onClick={() => updateEntry(value.id, { image: null, existingImageUrl: null })}
                            className="absolute -top-1.5 -left-1.5 rounded-full bg-destructive text-white p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price adjustment */}
                  <div className="flex flex-col gap-1 w-full">
                    <label
                      htmlFor={`price-${variantType.id}-${value.id}`}
                      className="flex h-8 items-end text-xs text-muted-foreground leading-tight"
                    >
                      Adjust base price (+/-)
                    </label>
                    <Input
                      id={`price-${variantType.id}-${value.id}`}
                      type="number"
                      placeholder="0"
                      className="w-full"
                      value={
                        entry?.priceAdjustment === undefined || entry?.priceAdjustment === null
                          ? ""
                          : entry.priceAdjustment
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "" || raw === "-") {
                          updateEntry(value.id, { priceAdjustment: raw as unknown as number });
                          return;
                        }
                        const num = Number(raw);
                        if (!Number.isNaN(num)) {
                          updateEntry(value.id, { priceAdjustment: num });
                        }
                      }}
                      onBlur={() => {
                        if (
                          entry?.priceAdjustment === ("" as unknown as number) ||
                          entry?.priceAdjustment === ("-" as unknown as number)
                        ) {
                          updateEntry(value.id, { priceAdjustment: 0 });
                        }
                      }}
                    />
                    <span className="text-[10px] text-fuchsia-500 leading-tight">
                      Add or subtract from the base price.
                    </span>
                  </div>

                  {/* Stock */}
                  <div className="flex flex-col gap-1 w-full">
                    <label
                      htmlFor={`stock-${variantType.id}-${value.id}`}
                      className="flex h-8 items-end text-xs text-muted-foreground leading-tight"
                    >
                      Stock
                    </label>
                    <Input
                      id={`stock-${variantType.id}-${value.id}`}
                      type="number"
                      placeholder="0"
                      className="w-full"
                      value={
                        entry?.stock === undefined || entry?.stock === null ? "" : entry.stock
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          updateEntry(value.id, { stock: raw as unknown as number });
                          return;
                        }
                        const num = Number(raw);
                        if (!Number.isNaN(num)) {
                          updateEntry(value.id, { stock: num });
                        }
                      }}
                      onBlur={() => {
                        if (entry?.stock === ("" as unknown as number)) {
                          updateEntry(value.id, { stock: 0 });
                        }
                      }}
                    />
                  </div>

                  
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}