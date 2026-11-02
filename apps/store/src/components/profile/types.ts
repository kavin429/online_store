export type TierName = "Silver" | "Gold" | "Platinum";

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Out for delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned";

export type OrderItemView = {
  productId: number;
  productVariantId: number | null;
  name: string;
  variant: string;
  qty: number;
  price: number;
};

export type OrderView = {
  /** Database id, used for API calls. */
  dbId: number;
  /** Human readable reference, e.g. ORD-00014. */
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItemView[];
  shipping: number;
  discount: number;
  promo?: string;
  payment: string;
  address: string;
  eta?: string;
  tracking?: string;
  canCancel: boolean;
  canReturn: boolean;
  returnStatus?: string | null;
};

export type PromoVisibility = "public" | "email";

export type PromoView = {
  code: string;
  title: string;
  description: string;
  value: string;
  valueSub: string;
  visibility: PromoVisibility;
  minSpend?: number;
  expires: string;
  locked?: boolean;
  // used promos
  usedOn?: string;
  usedInOrder?: string;
  saved?: number;
};

export type AddressView = {
  id: number;
  label: string;
  line: string;
  country: string;
  province: string;
  district: string;
  city: string;
  postal: string;
  isDefault: boolean;
};

export type ProfileUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  dial: string;
  dob: string;
  joined: string;
  offersEmail: boolean;
  offersSms: boolean;
};

export type MembershipView = {
  tier: TierName;
  points: number;
  memberNo: string;
  validThru: string;
  since: string;
  totalSpent: number;
  totalOrders: number;
  activeOrders: number;
  /** Spend and order count in the rolling 12 month membership window. */
  periodSpent: number;
  periodOrders: number;
};

export type ProfileData = {
  user: ProfileUser;
  membership: MembershipView;
  orders: OrderView[];
  promos: {
    available: PromoView[];
    used: PromoView[];
    expired: PromoView[];
  };
  addresses: AddressView[];
  countries: string[];
};

export type TabKey = "overview" | "orders" | "membership" | "promos" | "settings";
