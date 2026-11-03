"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { toast } from "sonner";
import { Navigation, Radio, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  deliveryId: number;
  initialLat?: number | null;
  initialLng?: number | null;
  lastUpdated?: string | null;
};

export default function LocationTracker({
  deliveryId,
  initialLat,
  initialLng,
  lastUpdated,
}: Props) {
  const router = useRouter();
  const [tracking, setTracking] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null
      ? { lat: initialLat, lng: initialLng }
      : null,
  );
  const [lastSentAt, setLastSentAt] = useState<string | null>(lastUpdated ?? null);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);
  const lastPostRef = useRef(0);

  const stop = useCallback(() => {
    if (watchRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setTracking(false);
  }, []);

  useEffect(() => stop, [stop]);

  const send = useCallback(
    async (lat: number, lng: number) => {
      const res = await fetch(`/api/deliveries/${deliveryId}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      if (!res.ok) throw new Error("Could not send location");
      setLastSentAt(new Date().toISOString());
    },
    [deliveryId],
  );

  const start = () => {
    setError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This device does not support GPS location.");
      return;
    }

    setTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        // Send at most once every 15 seconds to keep the API light.
        const now = Date.now();
        if (now - lastPostRef.current < 15_000) return;
        lastPostRef.current = now;

        send(latitude, longitude).catch(() => {
          setError("Location could not be sent. Check your connection.");
        });
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access to share your position."
            : "Could not read your location.",
        );
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
  };

  const handleStop = () => {
    stop();
    toast.success("Stopped sharing live location");
    router.refresh();
  };

  return (
    <div className="space-y-3 rounded-xl border border-fuchsia-100 p-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <Radio
              className={cn(
                "h-4 w-4",
                tracking ? "animate-pulse text-green-500" : "text-fuchsia-500",
              )}
            />
            Live location
          </p>
          <p className="text-xs text-muted-foreground">
            The customer sees this position on their tracking page.
          </p>
        </div>

        {tracking ? (
          <Button variant="outline" size="sm" onClick={handleStop}>
            <Square className="mr-1 h-4 w-4" /> Stop sharing
          </Button>
        ) : (
          <Button size="sm" onClick={start}>
            <Radio className="mr-1 h-4 w-4" /> Share live location
          </Button>
        )}
      </div>

      {coords && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-gray-50 p-2 text-xs dark:bg-neutral-900">
          <span className="font-mono">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
          <a
            href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-fuchsia-700 hover:underline dark:text-fuchsia-300"
          >
            <Navigation className="h-3.5 w-3.5" /> Open map
          </a>
        </div>
      )}

      {lastSentAt && (
        <p className="text-[11px] text-muted-foreground">
          Last updated {new Date(lastSentAt).toLocaleTimeString()}
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
