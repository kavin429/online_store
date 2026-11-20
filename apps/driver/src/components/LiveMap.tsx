"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import { ExternalLink, MapPin, Navigation, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Human-readable destination used for the "Directions" link. */
  destination: string;
  lat?: number | null;
  lng?: number | null;
  updatedAt?: string | null;
  /** When provided, the map quietly refreshes this delivery's position. */
  deliveryId?: number;
  title?: string;
  description?: string;
  emptyMessage?: string;
  className?: string;
};

type Coordinates = { lat: number; lng: number };

function hasCoordinates(value: Coordinates | null): value is Coordinates {
  return (
    value !== null &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng)
  );
}

export default function LiveMap({
  destination,
  lat,
  lng,
  updatedAt,
  deliveryId,
  title = "Live map",
  description = "Your shared position updates here while you are on the job.",
  emptyMessage = "Start sharing your live location on this job and the map will appear here.",
  className,
}: Props) {
  const [coords, setCoords] = useState<Coordinates | null>(() =>
    lat != null && lng != null ? { lat, lng } : null,
  );
  const [lastUpdated, setLastUpdated] = useState<string | null>(updatedAt ?? null);

  useEffect(() => {
    setCoords(lat != null && lng != null ? { lat, lng } : null);
    setLastUpdated(updatedAt ?? null);
  }, [lat, lng, updatedAt]);

  useEffect(() => {
    if (!deliveryId) return;

    let active = true;
    const refresh = async () => {
      try {
        const res = await fetch(`/api/deliveries/${deliveryId}/location`, {
          cache: "no-store",
        });
        if (!res.ok || !active) return;
        const body = await res.json();
        if (
          Number.isFinite(body.lat) &&
          Number.isFinite(body.lng)
        ) {
          setCoords({ lat: body.lat, lng: body.lng });
          setLastUpdated(body.updatedAt ?? null);
        }
      } catch {
        // Keep the last known position when a refresh fails.
      }
    };

    const timer = window.setInterval(refresh, 10_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [deliveryId]);

  const mapUrl = useMemo(() => {
    if (!hasCoordinates(coords)) return null;
    const delta = 0.015;
    const bbox = [
      coords.lng - delta,
      coords.lat - delta,
      coords.lng + delta,
      coords.lat + delta,
    ].join(",");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`;
  }, [coords]);

  const directionsUrl = hasCoordinates(coords)
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const openMapUrl = hasCoordinates(coords)
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

  return (
    <Card className={cn("overflow-hidden border-fuchsia-100 dark:border-fuchsia-900/40", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="flex items-center gap-2 font-semibold">
              {title}
              {deliveryId && hasCoordinates(coords) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:bg-green-950/50 dark:text-green-300">
                  <Radio className="h-3 w-3 animate-pulse" /> Live
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a href={directionsUrl} target="_blank" rel="noreferrer">
            <Button size="sm">
              <Navigation className="mr-1.5 h-4 w-4" /> Directions
            </Button>
          </a>
          <a href={openMapUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1.5 h-4 w-4" /> Open map
            </Button>
          </a>
        </div>
      </div>

      {mapUrl ? (
        <iframe
          key={mapUrl}
          title={`Map for ${destination}`}
          src={mapUrl}
          className="h-64 w-full border-0 sm:h-80"
          loading="lazy"
        />
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-2 border-t border-fuchsia-100 bg-gradient-to-br from-fuchsia-50 to-white px-4 text-center dark:border-fuchsia-900/40 dark:from-fuchsia-950/30 dark:to-neutral-950">
          <MapPin className="h-7 w-7 text-fuchsia-400" />
          <p className="text-sm font-medium">No shared position yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {emptyMessage} You can still open directions to {destination}.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-fuchsia-100 px-4 py-2.5 text-[11px] text-muted-foreground dark:border-fuchsia-900/40">
        <span className="min-w-0 truncate">
          {destination}
        </span>
        {hasCoordinates(coords) ? (
          <span className="font-mono">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            {lastUpdated && ` · ${new Date(lastUpdated).toLocaleTimeString()}`}
          </span>
        ) : (
          <span>Waiting for GPS</span>
        )}
      </div>
    </Card>
  );
}
