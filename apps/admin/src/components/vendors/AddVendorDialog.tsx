"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@online-store/ui/button";
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
  FormMessage,
} from "@online-store/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@online-store/ui/select";
import { toast } from "sonner";
import { vendorSchema, VendorFormValues } from "@/lib/validator/vendor_validator";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  onAdd: (vendor: any) => void;
  defaultValues?: {
    id?: number;
    name: string;
    email?: string;
    phone?: string;
    country?: string;
    province?: string;
    district?: string;
    city?: string;
    address?: string;
    status?: "PENDING" | "ACTIVE" | "CANCELLED" | "BLOCKED";
  };
};

const emptyValues: VendorFormValues = {
  name: "",
  email: "",
  phone: "",
  country: "",
  province: "",
  district: "",
  city: "",
  address: "",
  status: "PENDING",
  password: "",
};

export default function AddVendorDialog({
  open,
  setOpen,
  onAdd,
  defaultValues,
}: Props) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: emptyValues,
  });

  const [showPassword, setShowPassword] = useState(false);
  const loading = form.formState.isSubmitting;

  useEffect(() => {
    if (!open) {
      form.reset(emptyValues);
    } else {
      form.reset({
        name: defaultValues?.name || "",
        email: defaultValues?.email || "",
        phone: defaultValues?.phone || "",
        country: defaultValues?.country || "",
        province: defaultValues?.province || "",
        district: defaultValues?.district || "",
        city: defaultValues?.city || "",
        address: defaultValues?.address || "",
        status: defaultValues?.status ?? "PENDING",
        password: "",
      });
    }
  }, [open, defaultValues, form]);

  const onSubmit = async (values: VendorFormValues) => {
    const url = isEdit ? `/api/vendors/${defaultValues!.id}` : "/api/vendors";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save vendor");
      }

      const savedVendor = await res.json();
      onAdd(savedVendor);
      form.reset(emptyValues);
      setOpen(false);
      toast.success(isEdit ? "Vendor updated successfully!" : "Vendor added successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isEdit ? "Failed to update vendor" : "Failed to add vendor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Vendor Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      placeholder="Enter vendor name"
                      className="border p-2 w-full rounded"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact: Email + Phone */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        type="email"
                        placeholder="vendor@example.com"
                        className="border p-2 w-full rounded"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="Enter phone number"
                        className="border p-2 w-full rounded"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location: Country + Province */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="Enter country"
                        className="border p-2 w-full rounded"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="Enter province"
                        className="border p-2 w-full rounded"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location: District + City */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="Enter district"
                        className="border p-2 w-full rounded"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="Enter city"
                        className="border p-2 w-full rounded"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      placeholder="Enter full address"
                      className="border p-2 w-full rounded"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Status — only shown when adding */}
            {!isEdit && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="CANCELLED">Rejected</SelectItem>
                        <SelectItem value="BLOCKED">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEdit ? "New Password" : "Password"}
                    {isEdit && (
                      <span className="text-muted-foreground text-xs ml-1">
                        (leave blank to keep current)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder={isEdit ? "Enter new password" : "Enter password"}
                          className="border p-2 w-full rounded pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const generated = generatePassword();
                          field.onChange(generated);
                          setShowPassword(true);
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Update Vendor" : "Add Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  function generatePassword(length = 12) {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let password = "";
    const cryptoObj = typeof window !== "undefined" ? window.crypto : undefined;

    if (cryptoObj?.getRandomValues) {
      const values = new Uint32Array(length);
      cryptoObj.getRandomValues(values);
      for (let i = 0; i < length; i++) {
        password += chars[values[i] % chars.length];
      }
    } else {
      // fallback (SSR or older browsers)
      for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return password;
  }
}


