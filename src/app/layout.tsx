import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import "./globals.css";

import { AuthInviteBridge } from "@/components/auth/auth-invite-bridge";
import { PwaRegister } from "@/components/pwa-register";
import { SplashScreen } from "@/components/site/splash-screen";

export const metadata: Metadata = {
  metadataBase: new URL("https://creatiqdigital.com"),
  title: {
    default: "CREATIQ | Digital Solutions for the Future",
    template: "%s | CREATIQ",
  },
  description:
    "Creatiq Digital Solutions creates websites, custom systems, mobile apps, branding, graphics design, and digital marketing materials.",
  applicationName: "CREATIQ",
  appleWebApp: {
    capable: true,
    title: "CREATIQ",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icons/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/icons/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: [
      {
        url: "/favicon.ico",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#020b1f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth no-scrollbar">
      <body className="bg-background text-foreground antialiased">
        <PwaRegister />
        <SplashScreen />
        <AuthInviteBridge />

        {children}

        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "border border-cyan-300/30 bg-surface text-foreground shadow-[0_0_30px_rgba(8,189,255,0.2)]",
              title: "font-semibold text-primary",
              description: "text-muted",
            },
          }}
        />
      </body>
    </html>
  );
}
