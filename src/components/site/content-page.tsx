import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { brand } from "./brand";
import { Footer } from "./footer";

type ContentSection = {
  title: string;
  paragraphs: string[];
};

export function ContentPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: ContentSection[];
}) {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-cyan-300/15 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-10">
          <Link href="/" aria-label="Creatiq home">
            <Image src={brand.landscape} alt="Creatiq Digital Solutions" width={240} height={80} priority className="h-10 w-auto object-contain sm:h-12" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-secondary transition hover:bg-cyan-300/10">
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-primary sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">{intro}</p>
          <div className="mt-12 space-y-5 sm:mt-16 sm:space-y-6">
            {sections.map((section, index) => (
              <article key={section.title} className="glass-card rounded-2xl p-6 sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">0{index + 1}</p>
                <h2 className="mt-3 text-xl font-bold text-foreground sm:text-2xl">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-7 text-muted sm:text-base">{paragraph}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
