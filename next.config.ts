import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // `next dev` otherwise appends generated agent rules to CLAUDE.md, which
  // is hand-maintained project memory. (It also rewrites next-env.d.ts on
  // every start, which no option stops; that file is untracked instead.)
  agentRules: false,
  async headers() {
    // Phase P and its successors keep /demo out of search results until
    // BUILD_PLAN.md's launch checklist removes this (docs/LAUNCH.md).
    // Two sources are needed because Arabic, the default locale, carries no
    // URL prefix (src/i18n/routing.ts: localePrefix "as-needed") while
    // English does.
    const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };
    return [
      { source: "/demo/:path*", headers: [noindex] },
      { source: "/en/demo/:path*", headers: [noindex] },
    ];
  },
};

export default withNextIntl(nextConfig);
