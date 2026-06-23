import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

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
      <body
        className={`${montserrat.variable} bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
