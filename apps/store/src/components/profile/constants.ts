import { Crown, Gift, Package, Settings, Tag, User } from "lucide-react";
import type { OrderStatus, TabKey, TierName } from "./types";

export const TIERS: {
  name: TierName;
  minSpend: number;
  minOrders: number;
  multiplier: string;
  multiplierValue: number;
  requirement: string;
  perks: string[];
  chip: string;
  ring: string;
  card: string; // card gradient
  cardText: string; // card text colour
}[] = [
  {
    name: "Silver",
    minSpend: 0,
    minOrders: 0,
    multiplier: "1x",
    multiplierValue: 1,
    requirement: "Create an account — you start here.",
    perks: [
      "1x points on every purchase",
      "Free shipping on orders over LKR 7,500",
      "Member-only newsletter deals",
    ],
    chip: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
    ring: "border-zinc-300 dark:border-zinc-600",
    card: "from-zinc-300 via-zinc-100 to-zinc-400",
    cardText: "text-zinc-800",
  },
  {
    name: "Gold",
    minSpend: 50_000,
    minOrders: 10,
    multiplier: "1.5x",
    multiplierValue: 1.5,
    requirement: "Spend LKR 50,000 or place 10 orders within 12 months.",
    perks: [
      "1.5x points on every purchase",
      "Free shipping on orders over LKR 4,000",
      "Early access to sales",
      "Birthday gift voucher",
    ],
    chip: "bg-amber-400 text-amber-950",
    ring: "border-amber-400",
    card: "from-amber-400 via-yellow-200 to-amber-500",
    cardText: "text-amber-950",
  },
  {
    name: "Platinum",
    minSpend: 150_000,
    minOrders: 25,
    multiplier: "2x",
    multiplierValue: 2,
    requirement: "Spend LKR 150,000 or place 25 orders within 12 months.",
    perks: [
      "2x points on every purchase",
      "Free shipping on every order",
      "Free returns",
      "Priority support & exclusive offers",
    ],
    chip: "bg-violet-600 text-white",
    ring: "border-violet-500",
    card: "from-slate-900 via-violet-800 to-fuchsia-700",
    cardText: "text-white",
  },
];

export const TIMELINE = ["Placed", "Processing", "Shipped", "Out for delivery", "Delivered"];

export const TIMELINE_INDEX: Partial<Record<OrderStatus, number>> = {
  Pending: 0,
  Processing: 1,
  Shipped: 2,
  "Out for delivery": 3,
  Delivered: 4,
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300",
  Processing: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  Shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300",
  "Out for delivery":
    "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/50 dark:text-fuchsia-300",
  Delivered: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  Returned: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
};

export const TABS: {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { key: "overview", label: "Overview", icon: User, desc: "Your card, points and recent activity." },
  { key: "orders", label: "Orders", icon: Package, desc: "Track and manage your orders." },
  { key: "membership", label: "Membership", icon: Crown, desc: "Tiers, benefits and how to level up." },
  { key: "promos", label: "Promos", icon: Tag, desc: "Your offers, secret email codes and savings." },
  { key: "settings", label: "Settings", icon: Settings, desc: "Profile, phone, addresses and account." },
];

export const DIAL_CODES = [
  { dial: "+94", label: "Sri Lanka" },
  { dial: "+91", label: "India" },
  { dial: "+977", label: "Nepal" },
  { dial: "+880", label: "Bangladesh" },
  { dial: "+92", label: "Pakistan" },
  { dial: "+971", label: "UAE" },
  { dial: "+65", label: "Singapore" },
  { dial: "+60", label: "Malaysia" },
  { dial: "+44", label: "United Kingdom" },
  { dial: "+1", label: "United States" },
  { dial: "+61", label: "Australia" },
];

/**
 * Country → Province → District → Cities reference data used by the address
 * dialog. Countries themselves come from the Country table when available;
 * this map provides the province/district/city cascade for supported regions.
 */
export const GEO: Record<string, Record<string, Record<string, string[]>>> = {
  "Sri Lanka": {
    "Western Province": {
      Colombo: ["Colombo", "Dehiwala", "Moratuwa", "Maharagama"],
      Gampaha: ["Negombo", "Gampaha", "Ja-Ela", "Wattala"],
      Kalutara: ["Kalutara", "Panadura", "Horana"],
    },
    "Central Province": {
      Kandy: ["Kandy", "Peradeniya", "Gampola"],
      Matale: ["Matale", "Dambulla", "Sigiriya"],
    },
    "Southern Province": {
      Galle: ["Galle", "Hikkaduwa", "Ambalangoda"],
      Matara: ["Matara", "Weligama", "Dikwella"],
    },
  },
  India: {
    "Tamil Nadu": {
      Chennai: ["Chennai", "Tambaram"],
      Coimbatore: ["Coimbatore", "Pollachi"],
    },
    Kerala: {
      Ernakulam: ["Kochi", "Aluva"],
      Thiruvananthapuram: ["Thiruvananthapuram", "Attingal"],
    },
  },
  Nepal: {
    "Bagmati Province": {
      Kathmandu: ["Kathmandu", "Kirtipur"],
      Lalitpur: ["Lalitpur", "Godawari"],
    },
    "Gandaki Province": {
      Kaski: ["Pokhara", "Lekhnath"],
    },
  },
};
