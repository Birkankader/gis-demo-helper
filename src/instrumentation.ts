/**
 * Next.js instrumentation hook - runs once when the server starts.
 *
 * Fixes "fetch failed" errors on Windows and some Linux configurations
 * by preferring IPv4 DNS resolution over IPv6.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
