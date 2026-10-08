/**
 * In-app browsers: the web views inside Facebook, Messenger, Instagram and
 * other apps. Google refuses OAuth inside them ("Error 403:
 * disallowed_useragent"), so sign-in must open the page in the phone's real
 * browser first. Detection is by user agent only, so it is pure and
 * testable; most visitors arrive from Facebook, so those tokens come first.
 *
 * Tokens follow inapp-spy 5.0.10 (MIT, checked 2026-10-08), plus Android's
 * generic web-view marker `; wv)` and iOS web views (an iPhone or iPad user
 * agent without `Safari/`). An installed home-screen app on iOS also drops
 * `Safari/`, so callers pass `standalone` and it is never treated as in-app.
 * SFSafariViewController and Chrome Custom Tabs carry the full browser user
 * agent and are allowed by Google, so they are (correctly) not detected.
 */

export type InAppName =
  | "messenger"
  | "instagram"
  | "facebook"
  | "threads"
  | "tiktok"
  | "snapchat"
  | "linkedin"
  | "twitter"
  | "line"
  | "wechat"
  | "whatsapp"
  | "reddit"
  | "pinterest"
  | "kakaotalk"
  | "webview";

export type Platform = "android" | "ios" | "other";

export interface InAppResult {
  inApp: boolean;
  /** Which app, when it is one we can name; "webview" for an unnamed one. */
  app: InAppName | null;
  platform: Platform;
}

// Order matters: Messenger and Instagram user agents can also carry Facebook's tokens.
const APPS: [InAppName, RegExp][] = [
  ["messenger", /\bFBAN\/(?:Messenger|MessengerForiOS|MessengerLiteForiOS)\b|\bFB_IAB\/(?:Orca-Android|MessengerLite)\b|\bOrca-Android\b|\bMessengerLite\b/i],
  ["instagram", /\bInstagram\b/i],
  ["facebook", /\bFBAN\/|\bFBAV\/|\bFB_IAB\/|\bFBIOS\b|\bFB4A\b|\bFacebook\b/i],
  ["threads", /\bBarcelona\b/i],
  ["tiktok", /musical_ly|Bytedance|\bTikTok\b/i],
  ["snapchat", /\bSnapchat\b/i],
  ["linkedin", /\bLinkedInApp\b/i],
  ["twitter", /\bTwitter\b/i],
  ["line", /\bLine\/\d/i],
  ["wechat", /\bMicroMessenger\//i],
  ["whatsapp", /\b(?:WAiOS|WA4A)\//i],
  ["reddit", /\bReddit\//i],
  ["pinterest", /\bPinterest\b/i],
  ["kakaotalk", /\bKAKAOTALK\b/i],
];

const ANDROID_WEBVIEW = /\bAndroid\b.*;\s*wv\)/i;
const IOS_WEBVIEW = /\b(?:iPhone|iPod|iPad)\b(?!.*\bSafari\/)/i;

export function platformOf(ua: string): Platform {
  if (/\bAndroid\b/i.test(ua)) return "android";
  if (/\b(?:iPhone|iPod|iPad)\b/i.test(ua)) return "ios";
  return "other";
}

export function detectInAppBrowser(ua: string, options: { standalone?: boolean } = {}): InAppResult {
  const platform = platformOf(ua);
  if (!ua || options.standalone) return { inApp: false, app: null, platform };
  for (const [app, pattern] of APPS) if (pattern.test(ua)) return { inApp: true, app, platform };
  if (ANDROID_WEBVIEW.test(ua) || IOS_WEBVIEW.test(ua)) return { inApp: true, app: "webview", platform };
  return { inApp: false, app: null, platform };
}

/**
 * Android: a link that asks the system to open this page in Chrome. If
 * Chrome is missing, `browser_fallback_url` reloads the same page (our own
 * origin only), where the copy-link option is still offered.
 */
export function chromeIntentUrl(pageUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(pageUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const scheme = url.protocol.slice(0, -1);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url.href)};end`;
}
