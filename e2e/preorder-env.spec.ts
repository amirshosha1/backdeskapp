import { expect, test } from "@playwright/test";
import { FEEDBACK_WHATSAPP, PREORDER_URL } from "../playwright.preorder.config";

/**
 * BUILD_PLAN.md Phase P.1.1, item 13: with NEXT_PUBLIC_PREORDER_URL set,
 * every pre-order action is a real link to it, opened in a new tab without
 * granting it access to `window.opener` (target=_blank, rel=noopener).
 * Run via `pnpm exec playwright test --config=playwright.preorder.config.ts`
 * — the default suite's build has no pre-order URL set (see its config).
 */
test("pre-order buttons open the configured URL, target=_blank rel=noopener", async ({ page }) => {
  await page.goto("/demo/pricing");

  const reserve = page.getByRole("link", { name: "احجز مكانك" });
  await expect(reserve).toHaveAttribute("href", PREORDER_URL);
  await expect(reserve).toHaveAttribute("target", "_blank");
  await expect(reserve).toHaveAttribute("rel", /noopener/);

  const orderKit = page.getByRole("link", { name: "اطلب الباقة" });
  await expect(orderKit).toHaveAttribute("href", PREORDER_URL);
  await expect(orderKit).toHaveAttribute("target", "_blank");
  await expect(orderKit).toHaveAttribute("rel", /noopener/);

  const choosePlan = page.getByRole("link", { name: /^اختر /u }).first();
  await expect(choosePlan).toHaveAttribute("href", PREORDER_URL);
});

test("with the WhatsApp number set, the custom-plans contact opens it with the question prefilled", async ({ page }) => {
  await page.goto("/demo/pricing");

  const contact = page.getByRole("link", { name: "تواصل معنا" });
  const href = new URL((await contact.getAttribute("href"))!);
  expect(`${href.origin}${href.pathname}`).toBe(`https://wa.me/${FEEDBACK_WHATSAPP}`);
  expect(href.searchParams.get("text")).toBe("مرحبًا، أسأل عن باقة خاصة في باك ديسك لأكثر من 5 شقق.");
  await expect(contact).toHaveAttribute("target", "_blank");
  await expect(contact).toHaveAttribute("rel", /noopener/);
  const box = await contact.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});
