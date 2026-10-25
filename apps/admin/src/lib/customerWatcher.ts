import { prisma } from "@/lib/prisma";
import { sendPushToAdmin } from "@/lib/push";

export type NewCustomerEvent = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  createdAt: string;
};

type CustomerListener = (customer: NewCustomerEvent) => void;

const POLL_INTERVAL_MS = 5000;
const SEEN_STORAGE_KEY = "__admin_customer_watcher_seen_id__";

type WatcherGlobal = typeof globalThis & {
  [SEEN_STORAGE_KEY]?: number;
  __admin_customer_watcher_started__?: boolean;
  __admin_customer_watcher_timer__?: ReturnType<typeof setInterval>;
  __admin_customer_watcher_listeners__?: Set<CustomerListener>;
};

const watcherGlobal = globalThis as WatcherGlobal;

function getListeners(): Set<CustomerListener> {
  if (!watcherGlobal.__admin_customer_watcher_listeners__) {
    watcherGlobal.__admin_customer_watcher_listeners__ = new Set();
  }
  return watcherGlobal.__admin_customer_watcher_listeners__;
}

function toEvent(user: {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  createdAt: Date;
}): NewCustomerEvent {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    createdAt: user.createdAt.toISOString(),
  };
}

async function pollForNewCustomers() {
  try {
    const lastSeenId = watcherGlobal[SEEN_STORAGE_KEY] ?? 0;

    const users = await prisma.user.findMany({
      where: { id: { gt: lastSeenId } },
      orderBy: { id: "asc" },
      select: { id: true, name: true, email: true, phone: true, city: true, createdAt: true },
    });

    if (users.length === 0) return;

    watcherGlobal[SEEN_STORAGE_KEY] = users[users.length - 1].id;

    const events = users.map(toEvent);
    for (const event of events) {
      for (const listener of getListeners()) {
        try {
          listener(event);
        } catch (error) {
          console.error("Customer watcher listener error:", error);
        }
      }
    }

    const first = events[0];
    const payload =
      events.length === 1
        ? {
            title: "New customer registered",
            body: `${first.name ?? first.email ?? "A new customer"} just signed up.`,
            url: "/dashboard/customers",
          }
        : {
            title: "New customers registered",
            body: `${events.length} new customers just signed up.`,
            url: "/dashboard/customers",
          };

    await sendPushToAdmin(payload);
  } catch (error) {
    console.error("Customer watcher poll error:", error);
  }
}

async function initWithRetry(delayMs = 5000) {
  try {
    const latest = await prisma.user.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    watcherGlobal[SEEN_STORAGE_KEY] = latest?.id ?? 0;

    const timer = setInterval(pollForNewCustomers, POLL_INTERVAL_MS);
    if (typeof (timer as { unref?: () => void }).unref === "function") {
      (timer as { unref: () => void }).unref();
    }
    watcherGlobal.__admin_customer_watcher_timer__ = timer;
  } catch (error) {
    console.error("Customer watcher init error:", error);
    watcherGlobal.__admin_customer_watcher_started__ = false;
    const nextDelay = Math.min(delayMs * 2, 60000);
    setTimeout(() => startCustomerWatcher(nextDelay), delayMs);
  }
}

export async function startCustomerWatcher(retryDelayMs = 5000) {
  if (watcherGlobal.__admin_customer_watcher_started__) return;
  watcherGlobal.__admin_customer_watcher_started__ = true;
  await initWithRetry(retryDelayMs);
}

export function addCustomerListener(listener: CustomerListener) {
  void startCustomerWatcher();
  const listeners = getListeners();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export async function getRecentCustomers(limit = 10): Promise<NewCustomerEvent[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true, email: true, phone: true, city: true, createdAt: true },
  });
  return users.map(toEvent);
}
