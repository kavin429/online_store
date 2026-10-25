"use client";

import React from "react";
import { Spinner } from "./spinner";

type LoadingScreenProps = {
  fullScreen?: boolean;
  className?: string;
  label?: string;
};

export default function LoadingScreen({
  fullScreen = false,
  className = "",
  label,
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        fullScreen
          ? `fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background ${className}`
          : `flex h-full w-full flex-col items-center justify-center gap-5 py-16 ${className}`
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="GrowMore Online Store logo"
        className="h-24 w-24 animate-pulse rounded-2xl object-contain drop-shadow-sm"
      />
      <div className="flex items-center gap-2">
        <Spinner className="h-4 w-4 animate-spin text-fuchsia-500" />
        <span className="text-sm text-muted-foreground">
          {label || "Loading..."}
        </span>
      </div>
    </div>
  );
}
