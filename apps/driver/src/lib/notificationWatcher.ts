import { prisma } from "@/lib/prisma";

export type DriverNotificationEvent = {
  id: number;
  driverId: number;
  type: string;
  title: string;
  message: string;
  orderId: number | null;
  read: boolean;
  createdAt: string;
};

type DriverNotificationListener = (notification: DriverNotificationEvent) => void;

const POLL_INTERVAL_MS = 5000;
const SEEN_ID_KEY = "__driver_notification_watcher_seen_id__";

type WatcherGlobal = typeof globalThis & {
  [SEEN_ID_KEY]?: number;
  __driver_notification_watcher_start_promise__?: Promise<void>;
  __driver_notification_watcher_timer__?: ReturnType<typeof setInterval>;
  __driver_notification_watcher_listeners__?: Map<number, Set<DriverNotificationListener>>;
};

const watcherGlobal = globalThis as WatcherGlobal;

function getListeners() {
  if (!watcherGlobal.__driver_notification_watcher_listeners__) {
    watcherGlobal.__driver_notification_watcher_listeners__ = new Map();
  }
  return watcherGlobal.__driver_notification_watcher_listeners__;
}

function toEvent(notification: {
  id: number;
  driverId: number;
  type: string;
  title: string;
  message: string;
  orderId: number | null;
  read: boolean;
  createdAt: Date;
}): DriverNotificationEvent {
  return {
    id: notification.id,
    driverId: notification.driverId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    orderId: notification.orderId,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

async function pollForNewNotifications() {
  try {
    const lastSeenId = watcherGlobal[SEEN_ID_KEY] ?? 0;

    const notifications = await prisma.driverNotification.findMany({
      where: { id: { gt: lastSeenId } },
      orderBy: { id: "asc" },
      take: 100,
    });

    if (notifications.length === 0) return;

    watcherGlobal[SEEN_ID_KEY] = notifications[notifications.length - 1].id;

    const listeners = getListeners();
    for (const notification of notifications) {
      const event = toEvent(notification);
      for (const listener of listeners.get(event.driverId) ?? []) {
        try {
          listener(event);
        } catch (error) {
          console.error("Driver notification listener error:", error);
        }
      }
    }
  } catch (error) {
    console.error("Driver notification watcher poll error:", error);
  }
}

async function initWithRetry(retryDelayMs: number): Promise<void> {
  try {
    // Start from the latest row so notifications created before the first
    // listener connects are not replayed as live toasts.
    const latest = await prisma.driverNotification.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    watcherGlobal[SEEN_ID_KEY] = latest?.id ?? 0;

    const timer = setInterval(pollForNewNotifications, POLL_INTERVAL_MS);
    if (typeof (timer as { unref?: () => void }).unref === "function") {
      (timer as { unref: () => void }).unref();
    }
    watcherGlobal.__driver_notification_watcher_timer__ = timer;
  } catch (error) {
    console.error("Driver notification watcher init error:", error);
    watcherGlobal.__driver_notification_watcher_start_promise__ = undefined;
    const nextDelay = Math.min(retryDelayMs * 2, 60000);
    setTimeout(() => void startDriverNotificationWatcher(nextDelay), retryDelayMs);
  }
}

export function startDriverNotificationWatcher(retryDelayMs = 5000): Promise<void> {
  if (!watcherGlobal.__driver_notification_watcher_start_promise__) {
    watcherGlobal.__driver_notification_watcher_start_promise__ = initWithRetry(retryDelayMs);
  }
  return watcherGlobal.__driver_notification_watcher_start_promise__;
}

export async function addDriverNotificationListener(
  driverId: number,
  listener: DriverNotificationListener,
) {
  await startDriverNotificationWatcher();

  const listeners = getListeners();
  const driverListeners = listeners.get(driverId) ?? new Set<DriverNotificationListener>();
  driverListeners.add(listener);
  listeners.set(driverId, driverListeners);

  return () => {
    driverListeners.delete(listener);
    if (driverListeners.size === 0) listeners.delete(driverId);
  };
}
