const USER_AGENT = process.env.SITE_ORIGIN
  ? `tachikawa-portal-collector (+${process.env.SITE_ORIGIN})`
  : 'tachikawa-portal-collector';

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}
