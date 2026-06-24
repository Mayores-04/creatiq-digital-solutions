"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { brand, navigationLinks } from "./brand";
import type { PublicCompanySettings } from "@/lib/crm/public-data";

export function Header({ settings }: { settings: PublicCompanySettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#services");

  useEffect(() => {
    const sections = navigationLinks
      .map((link) => document.querySelector(link.href))
      .filter(
        (section): section is HTMLElement => section instanceof HTMLElement,
      );

    const observer = new IntersectionObserver(
      (entries) => {
        const activeSection = entries.find((entry) => entry.isIntersecting);
        if (activeSection) setActiveHref(`#${activeSection.target.id}`);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cyan-300/20 bg-surface/85 shadow-[0_0_20px_rgba(0,186,252,0.15)] backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:h-24 lg:px-10 xl:px-16">
        <a
          href="#home"
          className="shrink-0"
          onClick={closeMenu}
          aria-label="Creatiq home"
        >
          <Image
            src={settings.logo_url || brand.landscape}
            alt={settings.company_name}
            width={260}
            height={90}
            loading="eager"
            className="h-12 w-auto object-contain sm:h-14 lg:h-14 ml-[-0.5rem]"
          />
        </a>

        <nav
          className="hidden items-center gap-5 lg:flex xl:gap-8"
          aria-label="Main navigation"
        >
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setActiveHref(link.href)}
              aria-current={activeHref === link.href ? "page" : undefined}
              className={`relative py-2 text-xs font-semibold uppercase tracking-[0.16em] transition after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-secondary after:transition-transform after:duration-300 xl:tracking-[0.2em] ${activeHref === link.href ? "text-secondary after:scale-x-100" : "text-muted after:scale-x-0 hover:text-secondary hover:after:scale-x-100"}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className="primary-btn hidden rounded-lg px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-white lg:inline-flex xl:px-6"
        >
          Get a Free Quote
        </a>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-cyan-300/30 text-secondary lg:hidden"
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
        >
          <span className="sr-only">
            {isOpen ? "Close" : "Open"} navigation menu
          </span>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && (
        <nav
          id="mobile-navigation"
          className="border-t border-cyan-300/20 bg-surface px-4 py-4 shadow-2xl lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => {
                  setActiveHref(link.href);
                  closeMenu();
                }}
                aria-current={activeHref === link.href ? "page" : undefined}
                className={`rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-cyan-300/10 hover:text-secondary ${activeHref === link.href ? "bg-cyan-300/10 text-secondary" : "text-muted"}`}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={closeMenu}
              className="primary-btn mt-2 rounded-lg px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white"
            >
              Get a Free Quote
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
