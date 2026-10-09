/** The one public contact address (feedback, privacy requests, custom plans). It receives mail (confirmed by Amir, 2026-10-08). */
export const SUPPORT_EMAIL = "support@backdeskapp.com";

/** Subject of every feedback email ("a note on Backdesk"). */
export const FEEDBACK_SUBJECT = "ملاحظة على باك ديسك";

/** A mailto: link to the support address. Subject and body are encoded; nothing else is added. */
export function supportMailto(subject?: string, body?: string): string {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${SUPPORT_EMAIL}${params.length ? `?${params.join("&")}` : ""}`;
}
