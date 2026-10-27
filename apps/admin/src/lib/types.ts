// src/lib/types.ts
// Global, shared TypeScript types for domain entities.

import type { VariantType, VariantValue } from "@online-store/db";

export type { VariantType, VariantValue };

export type UserStatus = "ACTIVE" | "BLOCKED";
export type VendorStatus = UserStatus;
export type CustomerStatus = UserStatus;

export type VendorSettings = {
  id?: number;
  storeName?: string | null;
  storeLogo?: string | null;
  storeBanner?: string | null;
  description?: string | null;
  taxId?: string | null;
  businessReg?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  branch?: string | null;
};

export type Vendor = {
  id: number;
  name?: string | null;
  image?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  province?: string | null;
  district?: string | null;
  city?: string | null;
  address?: string | null;
  password?: string | null;
  plainPassword?: string | null;
  status: VendorStatus;
  blockReason?: string | null;
  blockedAt?: string | null;
  createdAt: string | Date;
  productsCount?: number;
  payoutsCount?: number;
  notificationsCount?: number;
  vendorSettings?: VendorSettings | null;
};

export type Customer = Vendor;

export type VendorTier = "Gold" | "Silver" | "Bronze";
export type VendorPerformance = {
  name: string;
  gmv: number;
  orders: number;
  rating: number;
  tier: VendorTier;
  share: number;
};

export type Category = {
  id: number;
  name: string;
  createdAt: string;
  subcategoryId?: number | null;
  imageUrl?: string | null;
};

export type SubCategory = {
  id: number;
  name: string;
  description?: string | null;
  commission?: number | null;
  image?: string;
  createdAt: string;
  categoryId: number;
  status: "ACTIVE" | "PENDING";
  variantTypeIds: number[];
  variantTypes: VariantType[];
};

export type AttributeValue = {
  id: number;
  name: string;
  hexCode?: string | null;
  unit?: string | null;
  variantTypeId?: number;
};

export type Variant = {
  id: number;
  sku?: string | null;
  priceOverride?: number | null;
  stock?: number | null;
  image?: string | null;
  attributes: Record<string, AttributeValue>;
};

export type ProductImage = {
  id: number;
  url: string;
};

export type Product = {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  costPrice?: number | null;
  sellingPrice?: number | null;
  discountPercent?: number | null;
  stock?: number | null;
  featured?: boolean;
  vendorId?: number | null;
  vendor?: { id: number; name: string } | null;
  images?: ProductImage[];
  category?: { id: number; name: string };
  subcategory?: { id: number; name: string } | null;
  variants?: Variant[];
};

export type ProductDetail = Omit<Product, "variants"> & {
  variantTypeIds: number[];
  variants?: Variant[];
};

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItem = {
  id: number;
  orderId?: number;
  productId: number;
  productVariantId?: number | null;
  name: string;
  sellingPrice: number;
  quantity: number;
};

export type Order = {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  promoCode?: string | null;
  discountAmount?: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  user?: {
    id: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

/* ── Promo (API/Prisma response shape) ──
   GET /api/promos returns prisma.promo.findMany({ include:
   { targetCustomers: { include: { user } }, vendor, admin } })
   JSON-serialized (Date -> string). */
export type PromoDiscountType = "PERCENTAGE" | "FIXED";

export type PromoTargetType =
  | "ALL"
  | "NEW_CUSTOMER"
  | "OLD_CUSTOMER"
  | "SELECTED_CUSTOMER";

export type PromoStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

/* One targeted/assigned customer row — also carries the notification flag. */
export type PromoCustomer = {
  id: number;
  promoId: number;
  userId: number;
  notified: boolean;
  notifiedAt?: string | null;
  createdAt: string;
  user?: {
    id: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

/* One redemption of a promo code on an order — used for audit / usage
   history views. */
export type PromoUsage = {
  id: number;
  promoId: number;
  userId: number;
  orderId: number;
  discountAmount: number;
  createdAt: string;
  user?: {
    id: number;
    name?: string | null;
    email?: string | null;
  } | null;
  order?: {
    id: number;
    total: number;
  } | null;
};

export type Promo = {
  id: number;
  code: string;
  name: string;
  description?: string | null;

  discountType: PromoDiscountType;
  discountValue: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;

  targetType: PromoTargetType;

  // criteria used only when targetType === "SELECTED_CUSTOMER"
  minOrderCount?: number | null;
  minTotalSpent?: number | null;
  maxTotalSpent?: number | null;

  usageLimit?: number | null;
  usageLimitPerUser: number;
  usedCount: number;

  startsAt?: string | null;
  expiresAt?: string | null;

  status: PromoStatus;

  vendorId?: number | null;
  vendor?: { id: number; name: string } | null;
  adminId?: number | null;
  admin?: { id: number; name: string } | null;

  targetCustomers?: PromoCustomer[];
  usages?: PromoUsage[];

  createdAt: string;
  updatedAt: string;
};

/* ── CustomerNotification (API response shape) ── */
export type CustomerNotification = {
  id: number;
  userId: number;
  type: string; // e.g. "PROMO_CODE", "ORDER_UPDATE"
  title: string;
  message: string;
  read: boolean;
  promoId?: number | null;
  promo?: { id: number; code: string; name: string } | null;
  createdAt: string;
};

/* ── API payload helpers (create/edit product) ── */
export type OptionEntry = {
  variantValueId: number;
  name?: string;
  hexCode?: string | null;
  priceAdjustment?: number | string;
  stock?: number | string;
  image?: string | null;
  existingImageUrl?: string | null;
};

// Append to src/lib/types.ts
export type OfferStatus = "ACTIVE" | "INACTIVE";
export type OfferApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type OfferBasis =
  | "FESTIVE" | "SPECIAL_DAY" | "ANNIVERSARY" | "NEW_CUSTOMER"
  | "FLASH_SALE" | "END_OF_SEASON" | "PAYDAY" | "PAYMENT"
  | "LOYALTY" | "PRODUCT_LAUNCH" | "CLEARANCE" | "BUNDLE"
  | "CATEGORY" | "OTHER";

export type Offer = {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  images?: string[] | null;
  badgeText?: string | null;
  ctaText: string;
  ctaLink?: string | null;
  promoId?: number | null;
  promo?: { id: number; code: string } | null;
  vendorId?: number | null;
  vendor?: { id: number; name: string } | null;
  products?: { id: number; productId: number; product: { id: number; name: string } }[];
  sortOrder: number;
  showOnLanding: boolean;
  approvalStatus: OfferApprovalStatus;
  basis?: OfferBasis | null;
  subCategoryId?: number | null;
  subCategory?: { id: number; name: string } | null;
  reviewNote?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
};