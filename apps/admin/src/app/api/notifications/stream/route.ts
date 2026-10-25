import { NextRequest, NextResponse } from "next/server";
import {
  addCustomerListener,
  getRecentCustomers,
  type NewCustomerEvent,
} from "@/lib/customerWatcher";

import { isAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let recent: NewCustomerEvent[] = [];
      try {
        recent = await getRecentCustomers(10);
      } catch (error) {
        console.error("Failed to load recent customers:", error);
      }

      send("connected", { ok: true, recent });
      controller.enqueue(encoder.encode(": connected\n\n"));

      const unsubscribe = addCustomerListener((customer) => {
        try {
          send("new_customer", customer);
        } catch (error) {
          console.error("SSE send error:", error);
        }
      });

      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // stream already closed
        }
      }, 25000);

      cleanup = () => {
        clearInterval(ping);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
