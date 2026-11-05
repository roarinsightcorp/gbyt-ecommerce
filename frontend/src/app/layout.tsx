
import type { Metadata } from "next";
import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "G-BYT Global Trading Ventures",
  description: "G-BYT Global Trading Ventures",
  verification: {
    google: "JZMyMGRp0D4AbiOI9vK2EGKFAVCsmDnrKtItpQEHiJ4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
    lang="en"
    suppressHydrationWarning
    data-scroll-behavior="smooth"
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}