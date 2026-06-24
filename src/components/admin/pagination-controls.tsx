import Link from "next/link";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type PageSize = 25 | 50 | 100 | "all";

const pageSizes: PageSize[] = [25, 50, 100, "all"];

function hrefWith(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  const query = search.toString();

  return query ? `?${query}` : "?";
}

export function PaginationControls({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: PageSize;
  total: number;
}) {
  const isAll = pageSize === "all";
  const numericSize = isAll ? total || 1 : pageSize;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / numericSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const start = total === 0 ? 0 : (safePage - 1) * numericSize + 1;
  const end = isAll ? total : Math.min(total, safePage * numericSize);

  return (
    <div className="flex flex-col gap-3 border-t border-cyan-300/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted">
        Showing <span className="font-bold text-primary">{start}</span>
        {" - "}
        <span className="font-bold text-primary">{end}</span>
        {" of "}
        <span className="font-bold text-primary">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-cyan-300/15 bg-background/40 p-1">
          {pageSizes.map((size) => {
            const active = pageSize === size;

            return (
              <Link
                key={size}
                href={hrefWith({ limit: size, page: 1 })}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                  active
                    ? "bg-cyan-300/15 text-secondary"
                    : "text-muted hover:bg-cyan-300/10 hover:text-primary"
                }`}
              >
                {size === "all" ? "All" : size}
              </Link>
            );
          })}
        </div>

        {!isAll ? (
          <div className="flex items-center gap-1">
            <Link
              aria-disabled={safePage <= 1}
              href={hrefWith({
                limit: pageSize,
                page: Math.max(1, safePage - 1),
              })}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/15 transition ${
                safePage <= 1
                  ? "pointer-events-none text-muted/35"
                  : "text-muted hover:border-secondary hover:bg-cyan-300/10 hover:text-secondary"
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </Link>

            <span className="min-w-16 text-center text-xs font-bold text-muted">
              {safePage} / {totalPages}
            </span>

            <Link
              aria-disabled={safePage >= totalPages}
              href={hrefWith({
                limit: pageSize,
                page: Math.min(totalPages, safePage + 1),
              })}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/15 transition ${
                safePage >= totalPages
                  ? "pointer-events-none text-muted/35"
                  : "text-muted hover:border-secondary hover:bg-cyan-300/10 hover:text-secondary"
              }`}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
