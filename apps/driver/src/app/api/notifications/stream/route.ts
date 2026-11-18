import { NextRequest, NextResponse } from "next/server";

import { currentDriver } from "@/lib/auth";
import { addDriverNotificationListener } from "@/lib/notificationWatcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const driver = await currentDriver();
  if (!driver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send("connected", { ok: true });
      controller.enqueue(encoder.encode(": connected\n\n"));

      const unsubscribe = await addDriverNotificationListener(driver.id, (notification) => {
        try {
          send("new_notification", notification);
        } catch (error) {
          console.error("Driver notification SSE send error:", error);
        }
      });

      if (closed) {
        unsubscribe();
        return;
      }

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

      request.signal.addEventListener("abort", () => {
        closed = true;
        cleanup();
      });
    },
    cancel() {
      closed = true;
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
