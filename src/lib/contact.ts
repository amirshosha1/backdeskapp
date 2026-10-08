/** The public contact address (privacy requests, custom plans). It receives mail (confirmed by Amir, 2026-10-08). */
export const SUPPORT_EMAIL = "support@backdeskapp.com";

export function supportMailto(subject?: string): string {
  return subject ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}` : `mailto:${SUPPORT_EMAIL}`;
}
