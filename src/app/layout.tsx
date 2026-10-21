import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Waymark",
  description: "Field delivery round reminders for FMCG distribution",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Waymark",
  },
};

export const viewport: Viewport = {
  themeColor: "#2383E2",
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
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <div id="app-root" className="min-h-screen bg-bg text-text-primary antialiased selection:bg-accent/20">
          {children}
        </div>
      </body>
    </html>
  );
}
