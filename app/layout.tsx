import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./animations.css";
import "./homepage.css";
import "./web-additional.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Educore AI - School Management System",
  description: "AI-powered school management platform for Nigerian schools",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EduCore",
  },
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-152x152.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#6A5ACD",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
