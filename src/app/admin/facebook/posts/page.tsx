import { ExternalLink, Images, RefreshCw } from "lucide-react";
import { getFacebookPagePosts } from "@/lib/meta/facebook";
import { requireModuleAccess } from "@/lib/crm/auth";

export default async function FacebookPageUploadsPage() {
  await requireModuleAccess("facebook");

  let posts: Awaited<ReturnType<typeof getFacebookPagePosts>> = [];
  let errorMessage = "";

  try {
    posts = await getFacebookPagePosts(30);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to load Facebook Page uploads.";
  }

  return (
    <section className="flex min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Facebook Page
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">
            Page Uploads
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Real posts from your connected Facebook Page. This is useful for
            checking what already went live outside the website.
          </p>
        </div>

        <a
          href="/admin/facebook/posts"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:bg-cyan-300/15"
        >
          <RefreshCw size={14} />
          Refresh
        </a>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-950/25 p-5">
          <p className="text-sm font-bold text-red-100">Couldn’t load Facebook uploads</p>
          <p className="mt-2 text-sm leading-6 text-red-100/75">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {posts.length ? (
          posts.map((post) => <FacebookPostCard key={post.id} post={post} />)
        ) : (
          <div className="col-span-full flex min-h-[22rem] items-center justify-center rounded-2xl border border-cyan-300/15 bg-surface/60 p-8 text-center">
            <div>
              <Images className="mx-auto text-secondary" size={34} />
              <p className="mt-3 text-sm font-bold text-primary">No Facebook uploads found yet.</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Published page posts will show here once Meta returns them for
                the configured Page token.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FacebookPostCard({
  post,
}: {
  post: Awaited<ReturnType<typeof getFacebookPagePosts>>[number];
}) {
  const image =
    post.full_picture ??
    post.attachments?.data?.[0]?.media?.image?.src ??
    post.attachments?.data?.[0]?.subattachments?.data?.[0]?.media?.image?.src ??
    null;
  const copy = post.message ?? post.story ?? "Facebook Page post";

  return (
    <article className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
      {image ? (
        <div className="aspect-video overflow-hidden bg-background/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-cyan-300/10 text-secondary">
          <Images size={34} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              {post.status_type?.replaceAll("_", " ") ?? "Page post"}
            </p>
            <time className="mt-1 block text-[11px] font-bold uppercase tracking-widest text-muted">
              {post.created_time ? formatTime(post.created_time) : "No date"}
            </time>
          </div>

          {post.permalink_url ? (
            <a
              href={post.permalink_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 text-secondary transition hover:bg-cyan-300/10"
              aria-label="Open Facebook post"
            >
              <ExternalLink size={15} />
            </a>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-primary">
          {copy}
        </p>
      </div>
    </article>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
