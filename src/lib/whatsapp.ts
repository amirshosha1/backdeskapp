/**
 * The WhatsApp link to the feedback number (`NEXT_PUBLIC_FEEDBACK_WHATSAPP`,
 * digits only), optionally with a prefilled message. Null while the number
 * is unset: callers then render no action at all, never a silent one.
 */
export function feedbackWhatsAppUrl(text?: string): string | null {
  const number = process.env.NEXT_PUBLIC_FEEDBACK_WHATSAPP;
  if (!number) return null;
  return text ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : `https://wa.me/${number}`;
}
