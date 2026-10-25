"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@online-store/ui/progress";
import { Button } from "@online-store/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productSchema,
  ProductFormValues,
} from "@/lib/validator/product_validator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Step1 from "./step1";
import Step2 from "./step2";
import Step3 from "./step3";

type Step = 1 | 2 | 3;

export default function CreateProductPage() {
  const [step, setStep] = useState<Step>(1);
  const [previews, setPreviews] = useState<string[]>([]);
  const router = useRouter();
  const stepsLabels = [
    "Product Details",
    "Product Options",
    "Variants & Pricing",
  ];
  const stepPercentage = (step / stepsLabels.length) * 100;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      featured: false,
      images: undefined,

      optionTypes: [],

      options: {
        color: [],
        size: [],
        weight: [],
        volume: [],
      },

      costPrice: "",
      sellingPrice: "",
      discountPercent: "",
      // stock removed - Step 2 collects it per variant value instead
    },
  });

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    const urls = fileArray.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    form.setValue("images", fileArray);
  };

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const stepFields: Record<Step, (keyof ProductFormValues)[]> = {
    1: ["name", "description", "categoryId", "subcategoryId"],
    2: ["optionTypes"],
    // "stock" removed - Step 3 no longer has that field, so validating it here
    // used to silently block every submission (form stayed permanently invalid).
    3: ["costPrice", "sellingPrice"],
  };

  const handleNext = async () => {
    const valid = await form.trigger(stepFields[step]);
    if (valid) setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev));
  };
  const handleBack = () =>
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  const handleSubmit = form.handleSubmit(
    async (values) => {
      try {
        const formData = new FormData();

        formData.append("name", values.name);
        formData.append("description", values.description);
        formData.append("categoryId", values.categoryId);
        formData.append("subcategoryId", values.subcategoryId);
        formData.append("featured", String(values.featured));

        formData.append("optionTypes", JSON.stringify(values.optionTypes));
        formData.append("costPrice", values.costPrice);
        formData.append("sellingPrice", values.sellingPrice);
        if (values.discountPercent) formData.append("discountPercent", values.discountPercent);

        const options = values.options;

        // collect per-value images (only Color entries carry these) separately,
        // replacing the File with just its filename so options stays JSON-safe
        const cleanOptions = JSON.parse(JSON.stringify(
          Object.fromEntries(
            Object.entries(options).map(([key, arr]: any) => [
              key,
              arr.map((item: any) => {
                if (item.image instanceof File) {
                  formData.append("optionImages", item.image);
                  return { ...item, image: item.image.name };
                }
                return item;
              }),
            ])
          )
        ));
        formData.append("options", JSON.stringify(cleanOptions));

        const images = values.images;
        if (Array.isArray(images)) {
          images.forEach((file: File) => {
            formData.append("images", file);
          });
        }

        const res = await fetch("/api/products", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "Failed to create product");
        }

        toast.success("Product added successfully!");
        router.push("/dashboard/products/list");
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong!");
      }
    },
    // onInvalid - surfaces the previously-silent "form won't submit" case with
    // a real toast instead of the button doing nothing.
    (errors) => {
      console.error("Form validation failed:", errors);
      toast.error("Please check the highlighted fields before submitting.");
    },
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1>Create New Product</h1>
      <div className="space-y-4">
        <Progress value={stepPercentage} className="h-2 rounded-full" />
        <div className="flex justify-between text-sm font-medium mt-1">
          {stepsLabels.map((label, i) => (
            <span
              key={i}
              className={
                i + 1 === step ? "text-fuchsia-600 font-bold" : "text-gray-500"
              }
            >
              {label}
            </span>
          ))}
        </div>

        {/* Step Pages */}
        {step === 1 && (
          <Step1 form={form} previews={previews} setPreviews={setPreviews} />
        )}
        {step === 2 && <Step2 form={form} />}
        {step === 3 && <Step3 form={form} />}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          {step < 3 ? (
            <Button variant="shoesecondary" onClick={handleNext}>Next</Button>
          ) : (
            <Button variant="shoe" onClick={handleSubmit}>Create Product</Button>
          )}
        </div>
      </div>
    </div>
  );
}