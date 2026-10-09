import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** The landing (/, /en) and the privacy page are public; the app (/demo) stays out of search until launch (it also sends noindex). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/demo", "/en/demo"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
