/** The production address: canonical URLs, Open Graph images, robots.txt and the sitemap point here. */
export const SITE_URL = "https://backdeskapp.com";

/**
 * The base for absolute URLs in page metadata. On a Vercel preview it is
 * the preview's own branch address, so its share card loads an image that
 * exists there (Vercel already keeps previews out of search); everywhere
 * else, production.
 */
export function metadataBase(): URL {
  const branch = process.env.VERCEL_BRANCH_URL;
  if (process.env.VERCEL_ENV === "preview" && branch) return new URL(`https://${branch}`);
  return new URL(SITE_URL);
}
