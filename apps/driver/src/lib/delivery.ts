export type DeliveryStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const DELIVERY_LABELS: Record<DeliveryStatus, string> = {
  UNASSIGNED: "Unassigned",
  ASSIGNED: "Assigned to you",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED: "Delivery failed",
  CANCELLED: "Cancelled",
};

export const DELIVERY_TITLES: Record<DeliveryStatus, string> = {
  UNASSIGNED: "Awaiting a driver",
  ASSIGNED: "Driver assigned",
  PICKED_UP: "Order picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Order delivered",
  FAILED: "Delivery attempt failed",
  CANCELLED: "Delivery cancelled",
};

export function orderStatusForDelivery(status: DeliveryStatus): OrderStatus | null {
  switch (status) {
    case "PICKED_UP":
    case "OUT_FOR_DELIVERY":
      return "SHIPPED";
    case "DELIVERED":
      return "DELIVERED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return null;
  }
}

/** Statuses a rider may move an order to from the driver app. */
export const DRIVER_UPDATABLE_STATUSES: DeliveryStatus[] = [
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
];

/** Buttons shown on a delivery card, based on where it currently is. */
export function nextDriverActions(status: DeliveryStatus): DeliveryStatus[] {
  switch (status) {
    case "ASSIGNED":
      return ["PICKED_UP", "FAILED"];
    case "PICKED_UP":
      return ["OUT_FOR_DELIVERY", "FAILED"];
    case "OUT_FOR_DELIVERY":
      return ["DELIVERED", "FAILED"];
    default:
      return [];
  }
}

export function isActiveDelivery(status: DeliveryStatus): boolean {
  return ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(status);
}
