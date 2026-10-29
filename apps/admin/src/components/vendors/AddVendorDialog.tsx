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
import { Input } from "@online-store/ui/components/input";

const GEO_API = "https://countriesnow.space/api/v0.1";

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

const labelClass = "text-fuchsia-900 dark:text-fuchsia-200";

/**
 * Dropdown fed by an API list. If the API returns nothing for the chosen
 * parent (some countries have no province/city data) it falls back to a
 * normal text input so the user can still type a value.
 */
function LocationSelect({
  value,
  onChange,
  options,
  placeholder,
  loading,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  loading: boolean;
  disabled: boolean;
}) {
  if (!disabled && !loading && options.length === 0) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  }

  // Keep a saved value (edit mode) visible even if the API list doesn't contain it
  const list = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <Select value={value || ""} onValueChange={onChange} disabled={disabled || loading}>
      <FormControl>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {list.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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

  // Location dropdown data
  const [countries, setCountries] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const country = form.watch("country") || "";
  const province = form.watch("province") || "";

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

  // Load countries once when the dialog opens
  useEffect(() => {
    if (!open || countries.length > 0) return;
    let cancelled = false;
    setLoadingCountries(true);

    fetch(`${GEO_API}/countries/iso`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const names: string[] = (json?.data ?? [])
          .map((c: { name: string }) => c.name)
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b));
        setCountries(names);
      })
      .catch((err) => console.error("Failed to fetch countries:", err))
      .finally(() => {
        if (!cancelled) setLoadingCountries(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, countries.length]);

  // Load provinces (states) when the country changes
  useEffect(() => {
    if (!country) {
      setProvinces([]);
      return;
    }
    let cancelled = false;
    setLoadingProvinces(true);

    fetch(`${GEO_API}/countries/states`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const names: string[] = (json?.data?.states ?? [])
          .map((s: { name: string }) => s.name)
          .filter(Boolean);
        setProvinces(names);
      })
      .catch((err) => {
        console.error("Failed to fetch provinces:", err);
        if (!cancelled) setProvinces([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });

    return () => {
      cancelled = true;
    };
  }, [country]);

  // Load cities when the province changes
  useEffect(() => {
    if (!country || !province) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);

    fetch(`${GEO_API}/countries/state/cities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, state: province }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setCities(Array.isArray(json?.data) ? json.data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch cities:", err);
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });

    return () => {
      cancelled = true;
    };
  }, [country, province]);

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
      <DialogContent className="max-w-2xl space-y-4 overflow-y-auto max-h-[90vh]">
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
                  <FormLabel className={labelClass}>Vendor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter vendor name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact: Email + Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="vendor@example.com"
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
                    <FormLabel className={labelClass}>Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location: Country + Province (dropdowns) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Country</FormLabel>
                    <LocationSelect
                      value={field.value || ""}
                      options={countries}
                      placeholder="Select country"
                      loading={loadingCountries}
                      disabled={false}
                      onChange={(val) => {
                        field.onChange(val);
                        // reset dependent fields when the country changes
                        form.setValue("province", "");
                        form.setValue("district", "");
                        form.setValue("city", "");
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Province</FormLabel>
                    <LocationSelect
                      value={field.value || ""}
                      options={provinces}
                      placeholder="Select province"
                      loading={loadingProvinces}
                      disabled={!country}
                      onChange={(val) => {
                        field.onChange(val);
                        form.setValue("city", "");
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location: District + City */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* No free global API covers districts, so this stays a text input */}
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>District</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter district" />
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
                    <FormLabel className={labelClass}>City</FormLabel>
                    <LocationSelect
                      value={field.value || ""}
                      options={cities}
                      placeholder="Select city"
                      loading={loadingCities}
                      disabled={!province}
                      onChange={field.onChange}
                    />
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
                  <FormLabel className={labelClass}>Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter full address" />
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
                    <FormLabel className={labelClass}>Status</FormLabel>
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
                  <FormLabel className={labelClass}>
                    {isEdit ? "New Password" : "Password"}
                    {isEdit && (
                      <span className="ml-1 text-xs text-fuchsia-700/70 dark:text-fuchsia-300/70">
                        (leave blank to keep current)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder={isEdit ? "Enter new password" : "Enter password"}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-fuchsia-500 hover:text-fuchsia-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
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

            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
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