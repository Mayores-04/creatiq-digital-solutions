import type { Metadata } from "next";
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
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
