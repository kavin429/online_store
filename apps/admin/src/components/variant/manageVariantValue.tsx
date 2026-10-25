"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@online-store/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@online-store/ui/form";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { toast } from "sonner";
import type { VariantType, VariantValue } from "@/lib/types";

type FormValues = {
  name: string;
  hexCode: string;
  unit: string;
};

const COLOR_NAMES: { name: string; hex: string }[] = [
  { name: "Red", hex: "#FF0000" },
  { name: "Maroon", hex: "#800000" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Olive", hex: "#808000" },
  { name: "Green", hex: "#008000" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Teal", hex: "#008080" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Navy", hex: "#000080" },
  { name: "Purple", hex: "#800080" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Black", hex: "#000000" },
  { name: "Gray", hex: "#808080" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Turquoise", hex: "#40E0D0" },
  { name: "Indigo", hex: "#4B0082" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Khaki", hex: "#F0E68C" },
  { name: "Lavender", hex: "#E6E6FA" },
];

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function findNearestColorName(hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return "";

  const target = hexToRgb(hex);
  let closest = COLOR_NAMES[0];
  let minDistance = Infinity;

  for (const color of COLOR_NAMES) {
    const c = hexToRgb(color.hex);
    const distance =
      Math.pow(target.r - c.r, 2) +
      Math.pow(target.g - c.g, 2) +
      Math.pow(target.b - c.b, 2);

    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  }

  return closest.name;
}

export default function AddVariantValueDialog({
  open,
  setOpen,
  variantType,
  onAdd,
  defaultValues,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  variantType: VariantType;
  onAdd: (val: VariantValue) => void;
  defaultValues?: VariantValue;
}) {
  const variantName = variantType.name.toLowerCase();
  const isColor = variantName === "color";
  const isWeight = variantName === "weight";
  const isVolume = variantName === "volume";
  const isWeightOrVolume = isWeight || isVolume;

  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      hexCode: defaultValues?.hexCode ?? "#000000",
      unit: defaultValues?.unit ?? "",
    },
  });

  const loading = form.formState.isSubmitting;

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? "",
      hexCode: defaultValues?.hexCode ?? "#000000",
      unit: isWeightOrVolume ? (defaultValues?.unit ?? "") : "",
    });
    setNameManuallyEdited(!!defaultValues?.name);
  }, [defaultValues, open, variantType.id, isWeightOrVolume, form]);

  const handleHexChange = (value: string) => {
    form.setValue("hexCode", value);
    if (!nameManuallyEdited) {
      const suggested = findNearestColorName(value);
      if (suggested) form.setValue("name", suggested);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const isEdit = !!defaultValues;

    try {
      const res = await fetch(
        isEdit
          ? `/api/variant-values/${defaultValues!.id}`
          : "/api/variant-values",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            hexCode: isColor ? values.hexCode || null : null,
            unit: isWeightOrVolume ? values.unit || null : null,
            variantTypeId: variantType.id,
          }),
        }
      );

      if (!res.ok) throw new Error("Save failed");

      const saved = await res.json();
      onAdd(saved);
      setOpen(false);

      toast.success(isEdit ? "Value updated!" : "Value added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save value");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm space-y-4">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit" : "Add"} {variantType.name}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Hex Code - only for Color, placed first so name can auto-fill */}
            {isColor && (
              <FormField
                control={form.control}
                name="hexCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hex Code</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={field.value || "#000000"}
                          onChange={(e) => handleHexChange(e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer shrink-0"
                        />
                        <Input
                          value={field.value}
                          onChange={(e) => handleHexChange(e.target.value)}
                          placeholder="#FF0000"
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Picking a color auto-suggests a name below — you can still edit it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Name - always shown */}
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{variantType.name} Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setNameManuallyEdited(true);
                      }}
                      placeholder={
                        isColor
                          ? "e.g. Red"
                          : isWeightOrVolume
                          ? "e.g. 500"
                          : "e.g. M"
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit - only for Weight / Volume */}
            {isWeightOrVolume && (
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={isWeight ? "g / kg" : "ml / L"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="shoe" disabled={loading}>
                {loading ? "Saving..." : defaultValues ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}