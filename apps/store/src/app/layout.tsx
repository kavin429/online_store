// app/layout.tsx

import "./globals.css";
import { ThemeProvider } from "@/components/themeProvider";
import { Toaster } from "sonner";
import Providers from "./providers";
import { CartProvider } from "@/context/addToCard";
import { WishlistProvider } from "@/context/favorite";
import Header from "@/components/Navs/header";
import Footer from "@/components/Home/footer";

export const metadata = {
  title: "GrowMore Online Store",
  description: "This is my local project",
  icons: {
    icon: "/favicon.ico",
  },
};

import LayoutWrapper from "@/components/LayoutWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ThemeProvider attribute="class">
            <Header/>
            <CartProvider>
              <WishlistProvider>

                <LayoutWrapper>
                  {children}
                </LayoutWrapper>

              </WishlistProvider>
            </CartProvider>

            <Toaster position="bottom-center" />
            <Footer/>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}