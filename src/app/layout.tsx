import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthInviteBridge } from "@/components/auth/auth-invite-bridge";
import { PwaRegister } from "@/components/pwa-register";
import { SplashScreen } from "@/components/site/splash-screen";

export const metadata: Metadata = {
  title: "CREATIQ | Digital Solutions for the Future",
  description:
    "Creatiq Digital Solutions creates websites, custom systems, mobile apps, branding, graphics design, and digital marketing materials.",
  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
      },
    ],
  },
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
