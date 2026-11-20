import { prisma } from "@/lib/prisma";

export type NewQuotationEvent = {
  id: number;
  quotationId: number;
  title: string;
  message: string;
  href: string;
  createdAt: string;
};

type QuotationListener = (event: NewQuotationEvent) => void;

const POLL_INTERVAL_MS = 5000;
const SEEN_KEY = "__admin_quotation_watcher_seen_id__";

type WatcherGlobal = typeof globalThis & {
  [SEEN_KEY]?: number;
  __admin_quotation_watcher_started__?: boolean;
  __admin_quotation_watcher_timer__?: ReturnType<typeof setInterval>;
  __admin_quotation_watcher_listeners__?: Set<QuotationListener>;
};

const g = globalThis as WatcherGlobal;

function getListeners(): Set<QuotationListener> {
  if (!g.__admin_quotation_watcher_listeners__) {
    g.__admin_quotation_watcher_listeners__ = new Set();
  }
  return g.__admin_quotation_watcher_listeners__;
}

async function poll() {
  try {
    const lastSeenId = g[SEEN_KEY] ?? 0;

    const rows = await prisma.adminNotification.findMany({
      where: { id: { gt: lastSeenId } },
      orderBy: { id: "asc" },
    });

    if (rows.length === 0) return;

    g[SEEN_KEY] = rows[rows.length - 1].id;

    for (const row of rows) {
      const event: NewQuotationEvent = {
        id: row.id,
        quotationId: 0,
        title: row.title,
        message: row.message,
        href: row.href,
        createdAt: row.createdAt.toISOString(),
      };
      for (const listener of getListeners()) {
        try {
          listener(event);
        } catch (err) {
          console.error("Quotation watcher listener error:", err);
        }
      }
    }
  } catch (err) {
    console.error("Quotation watcher poll error:", err);
  }
}

async function init(delayMs = 5000) {
  try {
    const latest = await prisma.adminNotification.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    g[SEEN_KEY] = latest?.id ?? 0;

    const timer = setInterval(poll, POLL_INTERVAL_MS);
    if (typeof (timer as { unref?: () => void }).unref === "function") {
      (timer as { unref: () => void }).unref();
    }
    g.__admin_quotation_watcher_timer__ = timer;
  } catch (err) {
    console.error("Quotation watcher init error:", err);
    g.__admin_quotation_watcher_started__ = false;
    setTimeout(() => startQuotationWatcher(Math.min(delayMs * 2, 60000)), delayMs);
  }
}

export async function startQuotationWatcher(retryDelayMs = 5000) {
  if (g.__admin_quotation_watcher_started__) return;
  g.__admin_quotation_watcher_started__ = true;
  await init(retryDelayMs);
}

export function addQuotationListener(listener: QuotationListener) {
  void startQuotationWatcher();
  getListeners().add(listener);
  return () => getListeners().delete(listener);
}
