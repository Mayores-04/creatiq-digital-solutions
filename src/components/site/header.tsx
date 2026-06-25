"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { brand, navigationLinks } from "./brand";
import type { PublicCompanySettings } from "@/lib/crm/public-data";

export function Header({ settings }: { settings: PublicCompanySettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#home");
  const ticking = useRef(false);

  const visibleLinks = useMemo(() => {
    return navigationLinks.filter((link) => link.href !== "#home");
  }, []);

  const observedLinks = useMemo(() => {
    return [
      { href: "#home", label: "Home" },
      ...visibleLinks,
      { href: "#contact", label: "Contact" },
    ];
  }, [visibleLinks]);

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;

    html.style.scrollBehavior = "auto";

    window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo(0, 0);
    setActiveHref("#home");

    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      html.style.scrollBehavior = previousScrollBehavior;
    });
  }, []);

  useEffect(() => {
    function getSectionElements() {
      return observedLinks
        .map((link) => {
          const element = document.querySelector(link.href);

          if (!(element instanceof HTMLElement)) return null;

          return {
            href: link.href,
            element,
          };
        })
        .filter(
          (
            item,
          ): item is {
            href: string;
            element: HTMLElement;
          } => item !== null,
        );
    }

    function updateActiveSection() {
      const sections = getSectionElements();

      if (!sections.length) return;

      const headerOffset = 96;
      const readingLine =
        window.scrollY + headerOffset + window.innerHeight * 0.28;

      let currentHref = "#home";

      for (const section of sections) {
        const sectionTop = section.element.offsetTop;

        if (readingLine >= sectionTop) {
          currentHref = section.href;
        }
      }

      setActiveHref(currentHref);
    }

    function handleScroll() {
      if (ticking.current) return;

      ticking.current = true;

      requestAnimationFrame(() => {
        updateActiveSection();
        ticking.current = false;
      });
    }

    updateActiveSection();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [observedLinks]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  function handleLogoClick() {
    setActiveHref("#home");
    closeMenu();
  }

  function handleNavClick(href: string) {
    setActiveHref(href);
    closeMenu();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cyan-300/15 bg-background/80 shadow-[0_0_24px_rgba(0,186,252,0.12)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-16">
        <a
          href="#home"
          onClick={handleLogoClick}
          className="flex shrink-0 items-center"
          aria-label="Creatiq home"
        >
          <Image
            src={settings.logo_url || brand.landscape}
            alt={settings.company_name || "Creatiq Digital Solutions"}
            width={260}
            height={90}
            priority
            className="h-10 w-auto object-contain "
          />
        </a>

        <nav
          className="hidden items-center gap-5 lg:flex xl:gap-8"
          aria-label="Main navigation"
        >
          {visibleLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => handleNavClick(link.href)}
              aria-current={activeHref === link.href ? "page" : undefined}
              className={`relative py-2 text-xs font-black uppercase tracking-[0.16em] transition after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-secondary after:transition-transform after:duration-300 xl:tracking-[0.2em] ${
                activeHref === link.href
                  ? "text-secondary after:scale-x-100"
                  : "text-muted after:scale-x-0 hover:text-secondary hover:after:scale-x-100"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          onClick={() => handleNavClick("#contact")}
          className="primary-btn hidden h-11 items-center rounded-xl px-4 text-[11px] font-black uppercase tracking-widest text-white lg:inline-flex xl:px-6"
        >
          Get a Free Quote
        </a>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/[0.04] text-secondary transition hover:border-secondary hover:bg-cyan-300/10 lg:hidden"
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
        >
          <span className="sr-only">
            {isOpen ? "Close" : "Open"} navigation menu
          </span>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen ? (
        <nav
          id="mobile-navigation"
          className="border-t border-cyan-300/15 bg-background/95 px-4 py-4 shadow-2xl backdrop-blur-xl lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {visibleLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => handleNavClick(link.href)}
                aria-current={activeHref === link.href ? "page" : undefined}
                className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
                  activeHref === link.href
                    ? "bg-cyan-300/10 text-secondary"
                    : "text-muted hover:bg-cyan-300/10 hover:text-secondary"
                }`}
              >
                {link.label}
              </a>
            ))}

            <a
              href="#contact"
              onClick={() => handleNavClick("#contact")}
              className="primary-btn mt-2 rounded-xl px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white"
            >
              Get a Free Quote
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
