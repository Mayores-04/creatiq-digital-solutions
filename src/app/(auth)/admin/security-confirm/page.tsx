export default function MissingAdminSecurityTokenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(8,189,255,0.15),transparent_32rem),#020b1f] px-4">
      <section className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
          Creatiq CRM security
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-primary">
          Confirmation link incomplete
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          The confirmation token is missing from this URL. Please open the full
          link from the email, or ask another Admin to send a fresh confirmation
          request.
        </p>
        <a
          href="/admin/login"
          className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl border border-cyan-300/20 text-xs font-black uppercase tracking-widest text-secondary transition hover:border-secondary hover:bg-cyan-300/10"
        >
          Back to login
        </a>
      </section>
    </main>
  );
}
