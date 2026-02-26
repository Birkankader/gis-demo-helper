/**
 * Robust fetch wrapper for server-side API routes.
 *
 * Handles common Node.js fetch issues:
 *  - Adds AbortController timeout (default 30s)
 *  - Disables Next.js fetch cache
 *  - Retries on transient network errors
 *  - Reports detailed error info (including `cause`)
 */

interface FetchOptions extends Omit<RequestInit, "signal"> {
  /** Timeout in milliseconds (default: 30_000) */
  timeout?: number;
  /** Number of retry attempts on network error (default: 2) */
  retries?: number;
}

export async function robustFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { timeout = 30_000, retries = 2, ...init } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        cache: "no-store" as RequestCache,
      });
      clearTimeout(timer);
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;

      // Don't retry on abort (timeout) or non-network errors
      const isAbort = err.name === "AbortError";
      const isNetworkError =
        err.message === "fetch failed" ||
        err.cause?.code === "EAI_AGAIN" ||
        err.cause?.code === "ECONNRESET" ||
        err.cause?.code === "ENOTFOUND" ||
        err.cause?.code === "ETIMEDOUT" ||
        err.cause?.code === "UND_ERR_CONNECT_TIMEOUT";

      if (isAbort) {
        throw new Error(`Request timed out after ${timeout}ms`);
      }

      if (!isNetworkError || attempt >= retries) {
        break;
      }

      // Wait before retry: 1s, 2s, ...
      await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
    }
  }

  // Build a detailed error message
  const cause = lastError?.cause as any;
  const detail = cause?.code || cause?.message || "";
  const msg = detail
    ? `${lastError!.message} (${detail})`
    : lastError!.message;

  throw new Error(msg);
}
