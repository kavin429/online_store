export type VendorStatus = "PENDING" | "ACTIVE" | "CANCELLED" | "BLOCKED";
export type CustomerStatus = "ACTIVE" | "BLOCKED";

export type VariantType = {
  id: number;
  name: string;
  slug: string;
};

export type VariantValue = {
  id: number;
  variantTypeId: number;
  name: string;
  hexCode?: string | null;
  unit?: string | null;
  status: "active" | "inactive";
  sortOrder: number;
  vendorId?: number | null;
};

/* ── VendorSettings (API response shape) ── */
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

/* ── Vendor (API response shape) ──
   Returned by /api/vendors (queries prisma.vendor with counts). */
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
  createdAt: string;
  productsCount?: number;
  payoutsCount?: number;
  notificationsCount?: number;
  vendorSettings?: VendorSettings | null;
};

/* ── Customer (API response shape) ──
   Returned by /api/customer (queries prisma.user). */
export type Customer = {
  id: number;
  name?: string | null;
  image?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  province?: string | null;
  district?: string | null;
  city?: string | null;
  address?: string | null;
  status: CustomerStatus;
  blockReason?: string | null;
  blockedAt?: string | null;
  createdAt: string;
};

/* ── Order (API/Prisma response shape) ──
   The dashboard orders page passes prisma.order.findMany({ include: { user,
   items } }) JSON-serialized (Date -> string). */
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

/* ── Review (API response shape) ──
   Returned by /api/reviews (queries prisma.review for the vendor's products). */
export type Review = {
  id: number;
  rating: number;
  comment: string | null;
  user: { id: number; name: string | null; email: string | null; image: string | null };
  product: { id: number; name: string };
  responses: { id: number; comment: string; createdAt: string }[];
  createdAt: string;
};

/* ── Inventory item (API response shape) ──
   Built by /api/inventory from product variants. */
export type InventoryBatch = {
  id: number;
  quantity: number;
  remaining: number;
  expiresAt: string | null;
  batchNumber: string | null;
  note: string | null;
  createdAt: string;
};

export type InventoryItem = {
  id: number;
  sku: string | null;
  product: { id: number; name: string };
  attributes: { type: string; value: string; hexCode: string | null }[];
  stock: number;
  priceOverride: number | null;
  batches: InventoryBatch[];
  nearestExpiry: string | null;
};

/* ── Payout (API response shape) ──
   Returned by /api/payouts (queries prisma.payout). */
export type Payout = {
  id: number;
  amount: number;
  status: string;
  period: string;
  paidAt: string | null;
  note: string | null;
  createdAt: string;
  items: { id: number; orderId: number; amount: number }[];
};

/* ── Offers ── */
export type OfferStatus = "ACTIVE" | "INACTIVE";
export type OfferApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  products?: { id: number; productId: number; product: { id: number; name: string } }[];
  basis?: string | null;
  sortOrder: number;
  showOnLanding: boolean;
  approvalStatus: OfferApprovalStatus;
  reviewNote?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProductOption = { id: number; name: string };