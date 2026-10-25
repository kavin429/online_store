// app/layout.tsx
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

export const metadata = {
  title: "GrowMore Online Store",
  description: "This is my local project",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster position="bottom-center" />
        </Providers>
      </body>
    </html>
  );
}
