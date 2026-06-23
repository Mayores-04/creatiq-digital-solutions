import Image from "next/image";
import Link from "next/link";
import { AtSign, Globe2, Share2 } from "lucide-react";
import type { ReactNode } from "react";
import { brand } from "./brand";
import type { PublicCompanySettings } from "@/lib/crm/public-data";
import { DEFAULT_COMPANY_SETTINGS } from "@/lib/crm/constants";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/#about" },
      { label: "Our Portfolio", href: "/#portfolio" },
      { label: "The Process", href: "/#process" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Graphic Design", href: "/#graphic-design" },
      { label: "Web Systems", href: "/#web-custom-systems" },
      { label: "Social Strategy", href: "/#social-media" },
      { label: "App Development", href: "/#mobile-app" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Settings", href: "/cookies" },
      {
        label: "Contact Support",
        href: "mailto:creatiq.digitalsolutions@gmail.com",
      },
    ],
  },
];

export function Footer({
  settings = DEFAULT_COMPANY_SETTINGS,
}: {
  settings?: PublicCompanySettings;
}) {
  const publicEmail = settings.company_email;
  const socialLinks = [
    { label: "Visit Creatiq home", href: "/", icon: Globe2 },
    { label: "Email Creatiq", href: `mailto:${publicEmail}`, icon: AtSign },
    ...Object.entries(settings.social_links)
      .filter(([, href]) => href)
      .map(([network, href]) => ({
        label: `Visit Creatiq on ${network}`,
        href,
        icon: Share2,
      })),
  ];
  return (
    <footer className="border-t border-white/10 bg-background py-12 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10 xl:px-16">
        <div className="space-y-4">
          <Link href="/" aria-label="Creatiq home" className="inline-flex">
            <Image
              src={settings.logo_url || brand.landscape}
              alt={settings.company_name}
              width={280}
              height={100}
              className="h-16 w-auto object-contain sm:h-20 ml-[-0.5rem]"
            />
          </Link>
          <p className="max-w-xs text-sm leading-6 text-muted">
            Engineering the future of digital presence through visionary design
            and high-performance technology.
          </p>
          <div className="flex gap-3 text-muted">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <FooterLink
                key={label}
                href={href}
                label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/15 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-secondary"
              >
                <Icon size={18} />
              </FooterLink>
            ))}
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">
              {column.title}
            </h2>
            <ul className="space-y-2 text-sm text-muted">
              {column.links.map((link) => (
                <li key={link.label}>
                  <FooterLink
                    href={
                      link.href === "mailto:creatiq.digitalsolutions@gmail.com"
                        ? `mailto:${publicEmail}`
                        : link.href
                    }
                    className="transition hover:text-secondary"
                  >
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 px-4 pt-8 text-center text-xs text-muted/70 sm:mt-16 sm:px-6 lg:px-10 xl:px-16">
        &copy; 2026 {settings.company_name}. Engineered for the future.
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  className,
  label,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  if (
    href.startsWith("mailto:") ||
    href.startsWith("http://") ||
    href.startsWith("https://")
  ) {
    return (
      <a
        href={href}
        aria-label={label}
        className={className}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
