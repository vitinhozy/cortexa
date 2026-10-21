export function publicAuthConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return null;
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== '/'
    )
      return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}
