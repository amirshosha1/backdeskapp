import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/**
 * Any path that matches no route renders the localised not-found page
 * (src/app/[locale]/not-found.tsx) instead of Next.js's English default.
 */
export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
