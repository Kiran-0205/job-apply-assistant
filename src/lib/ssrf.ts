import { lookup } from "dns/promises";

// Private/loopback/link-local CIDR ranges to block
const BLOCKED_RANGES = [
  /^127\./,           // loopback
  /^10\./,            // RFC-1918
  /^192\.168\./,      // RFC-1918
  /^172\.(1[6-9]|2\d|3[01])\./,  // RFC-1918
  /^169\.254\./,      // link-local
  /^::1$/,            // IPv6 loopback
  /^fc00:/,           // IPv6 unique-local
  /^fe80:/,           // IPv6 link-local
];

function isPrivateIp(ip: string): boolean {
  return BLOCKED_RANGES.some((re) => re.test(ip));
}

export async function safeFetch(
  url: string,
  { timeoutMs = 10_000, maxBytes = 2 * 1024 * 1024 } = {}
): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }

  // Resolve the hostname to an IP and check it isn't private
  const { address } = await lookup(parsed.hostname, { family: 4 }).catch(() => {
    throw new Error("Could not resolve hostname");
  });

  if (isPrivateIp(address)) {
    throw new Error("URL resolves to a private/reserved IP address");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error("Request timed out");
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching URL`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (
    !contentType.includes("text/html") &&
    !contentType.includes("text/plain") &&
    !contentType.includes("text/markdown")
  ) {
    throw new Error("URL did not return an HTML or text page");
  }

  // Read up to maxBytes; discard the rest
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(
    chunks.reduce((acc, c) => {
      const merged = new Uint8Array(acc.length + c.length);
      merged.set(acc);
      merged.set(c, acc.length);
      return merged;
    }, new Uint8Array(0))
  );
}
