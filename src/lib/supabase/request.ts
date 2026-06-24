const REQUEST_TIMEOUT_MS = 3_500;

export async function fetchWithSupabaseTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const parentSignal = init?.signal;
  const abortFromParent = () => controller.abort();
  parentSignal?.addEventListener("abort", abortFromParent, { once: true });

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch {
    // Supabase treats a rejected fetch as a retryable transport failure and
    // repeats it, which produces a wall of ENOTFOUND errors during local
    // development when the project is offline. A regular 503 lets every
    // caller handle the failure as a normal API response instead. Use a
    // non-retryable status: Supabase retries 503 responses, defeating this
    // protection and adding several seconds to the page response.
    return new Response(
      JSON.stringify({ message: "Supabase is temporarily unavailable." }),
      {
        status: 400,
        statusText: "Supabase connection unavailable",
        headers: { "content-type": "application/json" },
      },
    );
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}
