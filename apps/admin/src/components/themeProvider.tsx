"use client";

import { ThemeProvider as NextThemesProvider, Attribute } from "next-themes";
import { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
  attribute?: Attribute; // <- use Attribute type
}

export function ThemeProvider({ children, attribute }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute={attribute || "class"}>
      {children}
    </NextThemesProvider>
  );
}
