// @vitest-environment node
import { describe, expect, it } from "vitest";
import { chromeIntentUrl, detectInAppBrowser, type InAppName } from "./in-app";

/** Representative user agents for each app and platform (the shapes inapp-spy and the apps publish). */
const IN_APP: [string, InAppName, "android" | "ios", string][] = [
  ["Facebook iOS", "facebook", "ios", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.40.98;FBBV/612222040;FBDV/iPhone14,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/ar_AR;FBOP/5;FBRV/0]"],
  ["Facebook Android", "facebook", "android", "Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.122 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/473.0.0.39.109;IABMV/1;]"],
  ["Messenger iOS", "messenger", "ios", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/458.0.0.40.108;FBBV/590181418;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/5]"],
  ["Messenger Android", "messenger", "android", "Mozilla/5.0 (Linux; Android 13; Redmi Note 12 Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.165 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/460.0.0.48.109;]"],
  ["Instagram iOS", "instagram", "ios", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 337.0.3.23.54 (iPhone14,5; iOS 17_5; ar_EG; ar; scale=3.00; 1170x2532; 614108412)"],
  ["Instagram Android", "instagram", "android", "Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/AP2A.240705.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.134 Mobile Safari/537.36 Instagram 339.0.0.30.105 Android (34/14; 420dpi; 1080x2400; Google/google; Pixel 7; panther; panther; en_US; 618228190)"],
  ["Threads iOS", "threads", "ios", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Barcelona 340.0.0.22.109 (iPhone15,2; iOS 17_5; en_US; en; scale=3.00; 1179x2556; 619327375)"],
  ["TikTok Android", "tiktok", "android", "Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 trill_340204 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/34.2.4 ByteLocale/en ByteFullLocale/en Region/EG BytedanceWebview/d8a21c6"],
  ["Snapchat iOS", "snapchat", "ios", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/13.3.0.36 (like Safari/8618.2.12.10.9, panda)"],
  ["LinkedIn iOS", "linkedin", "ios", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30.1394"],
  ["X/Twitter iOS", "twitter", "ios", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter for iPhone/10.50"],
  ["Line Android", "line", "android", "Mozilla/5.0 (Linux; Android 13; SM-S911B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 Line/14.8.1/IAB"],
  ["WeChat Android", "wechat", "android", "Mozilla/5.0 (Linux; Android 13; V2219 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 XWEB/1160117 MMWEBSDK/20240404 MMWEBID/1234 MicroMessenger/8.0.49.2600(0x28003133) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64"],
  ["WhatsApp iOS", "whatsapp", "ios", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WAiOS/24.14.79"],
  ["Pinterest Android", "pinterest", "android", "Mozilla/5.0 (Linux; Android 13; Pixel 6 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.144 Mobile Safari/537.36 [Pinterest/Android]"],
  ["unnamed Android web view", "webview", "android", "Mozilla/5.0 (Linux; Android 14; SM-A146P Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/127.0.6533.64 Mobile Safari/537.36"],
  ["unnamed iOS web view", "webview", "ios", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"],
];

const REAL_BROWSERS: [string, string][] = [
  ["Chrome Android", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36"],
  ["Samsung Internet", "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36"],
  ["Safari iOS", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"],
  ["Chrome iOS", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.46 Mobile/15E148 Safari/604.1"],
  ["Firefox iOS", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/130.0 Mobile/15E148 Safari/605.1.15"],
  ["Google app iOS (Safari view)", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/330.0.665236494 Mobile/15E148 Safari/604.1"],
  ["Desktop Chrome", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"],
  ["Desktop Safari", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15"],
];

describe("detectInAppBrowser", () => {
  it.each(IN_APP)("%s is an in-app browser", (_label, app, platform, ua) => {
    expect(detectInAppBrowser(ua)).toEqual({ inApp: true, app, platform });
  });

  it.each(REAL_BROWSERS)("%s is a real browser", (_label, ua) => {
    expect(detectInAppBrowser(ua).inApp).toBe(false);
  });

  it("never flags an app installed to the home screen (iOS drops Safari/ there too)", () => {
    const standaloneIos = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
    expect(detectInAppBrowser(standaloneIos, { standalone: true }).inApp).toBe(false);
  });

  it("an empty user agent is not in-app", () => {
    expect(detectInAppBrowser("")).toEqual({ inApp: false, app: null, platform: "other" });
  });
});

describe("chromeIntentUrl", () => {
  it("opens the same page in Chrome, falling back to the same page", () => {
    expect(chromeIntentUrl("https://backdeskapp.com/demo/more?utm_source=facebook")).toBe(
      "intent://backdeskapp.com/demo/more?utm_source=facebook#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fbackdeskapp.com%2Fdemo%2Fmore%3Futm_source%3Dfacebook;end",
    );
  });

  it("refuses anything that is not an http(s) URL", () => {
    expect(chromeIntentUrl("javascript:alert(1)")).toBeNull();
    expect(chromeIntentUrl("not a url")).toBeNull();
  });
});
