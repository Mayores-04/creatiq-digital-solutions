"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { brand, navigationLinks } from "./brand";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cyan-300/20 bg-surface/85 shadow-[0_0_20px_rgba(0,186,252,0.15)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-10 xl:px-16">
        <a href="#home" className="shrink-0" onClick={closeMenu} aria-label="Creatiq home">
          <Image src={brand.landscape} alt="Creatiq Digital Solutions" width={260} height={90} priority className="h-10 w-auto object-contain sm:h-12" />
        </a>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Main navigation">
          {navigationLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:text-secondary xl:tracking-[0.2em]">
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#contact" className="primary-btn hidden rounded-lg px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-white lg:inline-flex xl:px-6">
          Get a Free Quote
        </a>

        <button type="button" onClick={() => setIsOpen((open) => !open)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-cyan-300/30 text-secondary lg:hidden" aria-controls="mobile-navigation" aria-expanded={isOpen}>
          <span className="sr-only">{isOpen ? "Close" : "Open"} navigation menu</span>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && (
        <nav id="mobile-navigation" className="border-t border-cyan-300/20 bg-surface px-4 py-4 shadow-2xl lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigationLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu} className="rounded-lg px-3 py-3 text-sm font-semibold text-muted transition hover:bg-cyan-300/10 hover:text-secondary">
                {link.label}
              </a>
            ))}
            <a href="#contact" onClick={closeMenu} className="primary-btn mt-2 rounded-lg px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white">
              Get a Free Quote
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
