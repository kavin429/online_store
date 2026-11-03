import type { DeliveryStatus } from "./delivery";

export type DriverOrderItem = {
  id: number;
  name: string;
  sellingPrice: number;
  quantity: number;
};

export type DriverTrackingEvent = {
  id: number;
  status: DeliveryStatus;
  title: string;
  message?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
};

export type DriverOrder = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: string;
  total: number;
  shipping: number;
  status: string;
  deliveryStatus: DeliveryStatus;
  deliveryNote?: string | null;
  assignedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  currentLat?: number | null;
  currentLng?: number | null;
  locationUpdatedAt?: string | null;
  items: DriverOrderItem[];
  trackingEvents?: DriverTrackingEvent[];
};
