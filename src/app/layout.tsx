import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "CamiSOL TV",
  description: "Accede a CamiSOL TV facilmente desde tu PWA.",
  themeColor: "#fff7ed",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/camisol-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/camisol-icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/camisol-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/camisol-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [
      { url: "/camisol-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
