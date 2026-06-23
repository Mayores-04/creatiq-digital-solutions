import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "CREATIQ | Digital Solutions for the Future",
  description:
    "Creatiq Digital Solutions creates websites, custom systems, mobile apps, branding, graphics design, and digital marketing materials.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-background text-foreground antialiased">
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "border border-cyan-300/30 bg-surface text-foreground shadow-[0_0_30px_rgba(8,189,255,0.2)]",
              title: "font-semibold text-primary",
              description: "text-muted",
            },
          }}
        />
      </body>
    </html>
  );
}
