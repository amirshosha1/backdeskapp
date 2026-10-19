import { setQueryParam } from "@/lib/url-state";
import { UTM_KEYS, utmFromParams, type UtmProps } from "./events";

/**
 * The visit's campaign labels (GTM:D-063), read once from the address bar
 * and kept in this module's memory only: no cookie, no browser storage, no
 * identifier. The landing's button carries them in its link
 * (landing-events-script.ts), so they cross the page load into the app; the
 * app removes them from the address bar at once, like `from`. A reload or a
 * new visit without them starts untagged.
 */

let tags: UtmProps | null = null;

/** Reads (once) and removes the utm_* parameters; returns a copy. */
export function campaignTags(): UtmProps {
  if (tags === null) {
    let search = "";
    try {
      search = window.location.search;
    } catch {
      search = "";
    }
    const params = new URLSearchParams(search);
    tags = utmFromParams(params);
    for (const key of UTM_KEYS) if (params.has(key)) setQueryParam(key, null);
  }
  return { ...tags };
}

export function resetCampaignTagsForTests(): void {
  tags = null;
}
