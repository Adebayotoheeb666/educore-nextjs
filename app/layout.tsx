import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./animations.css";
import "./homepage.css";
import "./web-additional.css";
import "./dark-mode-marketing.css";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6A5ACD" },
    { media: "(prefers-color-scheme: dark)", color: "#04060d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
      document.documentElement.style.colorScheme = t;
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
