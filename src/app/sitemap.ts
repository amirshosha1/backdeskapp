import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** The landing in both languages, each pointing at the other. */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { ar: `${SITE_URL}/`, en: `${SITE_URL}/en` };
  return [
    { url: `${SITE_URL}/`, alternates: { languages } },
    { url: `${SITE_URL}/en`, alternates: { languages } },
  ];
}
