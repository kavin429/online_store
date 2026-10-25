// app/layout.tsx
import "./globals.css";
import { ThemeProvider } from "@/components/themeProvider";
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
    <html lang="en">
      <body>
        <ThemeProvider attribute="class">
          {children}
          <Toaster position="bottom-center"/>
        </ThemeProvider>
      </body>
    </html>
  );
}
