import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createTranslator } from "next-intl";
import { BrandMark } from "@/components/common/brand-mark";
import type { AppLocale } from "@/i18n/routing";
import { formatMoneyParts } from "@/lib/format/money";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { landingExample } from "./example";
import { SHARE_MAX_BYTES, SHARE_SIZE } from "./share-size";

/**
 * The landing page's share images (public/og/landing-{ar,en}.png,
 * 1200×630): the page's own question, the "مثال" chip and the engine's
 * verdict for the same example, on the royal hero. satori (next/og) cannot
 * shape Arabic, so `pnpm og:render` draws this HTML in Chromium and commits
 * the PNGs. Everything that ends up in the picture (the messages, the
 * figure, the colour tokens, the hero and glass CSS, the key) goes into
 * the HTML, and the HTML's hash is recorded next to the PNGs: the test in
 * share-images.test.ts fails with "run pnpm og:render" when anything
 * drifts. Node-only (reads the repo's CSS); never imported by a page.
 */

export const SHARE_LOCALES = ["ar", "en"] as const satisfies readonly AppLocale[];
export { SHARE_MAX_BYTES, SHARE_SIZE };

const ROOT = process.cwd();
const MESSAGES = { ar, en } as const;

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The `@theme` colour tokens and the .royal-hero / .glass rules, verbatim from the repo's CSS. */
function designCss(): string {
  const tokens = readFileSync(join(ROOT, "src/styles/tokens.css"), "utf8");
  const globals = readFileSync(join(ROOT, "src/styles/globals.css"), "utf8");
  const colors = [...tokens.matchAll(/(--color-[a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => `${name}:${value!.trim()};`).join("");
  const rule = (selector: string) => {
    const match = globals.match(new RegExp(`\\n  ${selector.replace(".", "\\.")} \\{[\\s\\S]*?\\n  \\}`));
    if (!match) throw new Error(`share-card: ${selector} not found in globals.css`);
    return match[0].trim();
  };
  return `:root{${colors}}\n${rule(".royal-hero")}\n${rule(".glass")}`;
}

export function shareCardHtml(locale: (typeof SHARE_LOCALES)[number], fontCss = ""): string {
  const t = createTranslator({ locale, messages: MESSAGES[locale] });
  const example = landingExample();
  const parts = formatMoneyParts(example.net, { locale, decimals: 0 });
  const number = `<bdi dir="ltr" class="num">${escape(parts.sign + parts.integer)}</bdi>`;
  const currency = `<span class="cur">${escape(parts.currency)}</span>`;
  const wordmark = t.markup("landing.wordmark", {
    latin: (chunks) => `<span lang="en" dir="ltr">${chunks}</span>`,
    arabic: (chunks) => `<span lang="ar" dir="rtl">${chunks}</span>`,
  });
  const mark = renderToStaticMarkup(createElement(BrandMark)).replace('width="32" height="32"', 'width="52" height="52"');
  const dir = locale === "ar" ? "rtl" : "ltr";

  return `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><style>
${fontCss}
${designCss()}
*{box-sizing:border-box;margin:0}
html,body{width:${SHARE_SIZE.width}px;height:${SHARE_SIZE.height}px;overflow:hidden}
body{font-family:"IBM Plex Sans Arabic",sans-serif;color:#fff;font-feature-settings:"tnum" 1;-webkit-font-smoothing:antialiased}
.page{width:100%;height:100%;display:flex;align-items:center;gap:56px;padding:56px 72px}
.copy{flex:1;display:flex;flex-direction:column;gap:22px}
.brand{display:flex;align-items:center;gap:16px;font-size:30px;font-weight:600}
.key{display:flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:9999px}
h1{font-size:74px;line-height:1.18;font-weight:700}
.action{display:flex;flex-direction:column;align-items:flex-start;gap:10px}
.cta{white-space:nowrap;font-size:28px;font-weight:600;color:var(--color-royal-700);background:#fff;border-radius:9999px;padding:14px 32px}
.note{font-size:22px;color:rgb(255 255 255 / .8);padding-inline-start:32px}
.card{width:440px;border-radius:32px;padding:30px 30px 34px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px}
.chip{font-size:20px;font-weight:600;padding:4px 16px;border-radius:9999px;margin-bottom:8px}
.model{white-space:nowrap;font-size:21px;font-weight:600;color:rgb(255 255 255 / .9)}
.word{font-size:46px;line-height:1.3;font-weight:700;color:var(--color-hero-${example.outcome})}
.figure{display:flex;align-items:baseline;gap:10px}
.num{font-size:68px;line-height:1;font-weight:500;letter-spacing:-0.04em}
.cur{font-size:24px;font-weight:500;opacity:.7}
.per{font-size:22px;color:rgb(255 255 255 / .78);margin-top:6px}
</style></head><body class="royal-hero"><div class="page">
<div class="copy">
<p class="brand"><span class="key glass">${mark}</span><span>${wordmark}</span></p>
<h1>${escape(t("landing.headline"))}</h1>
<div class="action"><p class="cta">${escape(t("landing.cta"))}</p><p class="note">${escape(t("landing.ctaNote"))}</p></div>
</div>
<div class="card glass">
<span class="chip glass">${escape(t("common.exampleChip"))}</span>
<p class="model">${escape(t("landing.cardTitle", { model: example.model, area: example.area[locale] }))}</p>
<p class="word">${escape(t("firstRun.verdictWord", { outcome: example.outcome, owner: "no" }))}</p>
<p class="figure">${locale === "ar" ? number + currency : currency + number}</p>
<p class="per">${escape(t("firstRun.perMonth"))}</p>
</div>
</div></body></html>`;
}

/** What the committed PNG was drawn from: the HTML without the embedded fonts. */
export function shareCardInputsHash(locale: (typeof SHARE_LOCALES)[number]): string {
  return createHash("sha256").update(shareCardHtml(locale)).digest("hex");
}
