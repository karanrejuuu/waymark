import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waymark — FMCG Wholesale Supplier & Route Dispatch",
  description: "Offline-first FMCG wholesale delivery line, route dispatching, and walk-to-car store updates for suppliers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Waymark",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0D12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-[#0C0D12] text-white min-h-screen selection:bg-[#D4F638] selection:text-[#0A0D02] antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
