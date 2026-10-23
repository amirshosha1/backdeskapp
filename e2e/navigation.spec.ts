import { expect, test, type Page } from "@playwright/test";
import { resetGuestOnEveryLoad, withOwnUnit } from "./guest";
import { ALL_SCREENS, TAB_SCREENS } from "./screens";

/**
 * Phase P / P.1 acceptance: every screen is reachable, renders right-to-left
 * at 360 px with no horizontal scroll, and the floating navigation never
 * hides the last piece of content when a screen is scrolled to the bottom.
 */
const TABS = [
  { name: "الرئيسية", path: "/demo" },
  { name: "الحاسبة", path: "/demo/calculator" },
  { name: "الدليل", path: "/demo/guide" },
  { name: "الوحدات", path: "/demo/units" },
  { name: "المزيد", path: "/demo/more" },
];

const bottomNav = (page: Page) =>
  page.getByRole("navigation", { name: "التنقل الرئيسي" });

test.describe("bottom navigation", () => {
  test("every tab is reachable in a single walkthrough, with the active tab marked", async ({ page }) => {
    await page.goto("/demo");
    for (const tab of TABS) {
      const link = bottomNav(page).getByRole("link", { name: tab.name });
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${tab.path}$`));
      await expect(link).toHaveAttribute("aria-current", "page");
    }
  });

  test("Home stays the active tab on the expense-details screen", async ({ page }) => {
    await page.goto("/demo/expenses");
    await expect(bottomNav(page).getByRole("link", { name: "الرئيسية" })).toHaveAttribute("aria-current", "page");
  });
});

test.describe("deeper screens", () => {
  test("Home with no apartment → its one call to action → the first-run flow", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByTestId("home-apartment")).toHaveCount(0);
    await page.getByTestId("home-start").click();
    await expect(page).toHaveURL(/\/demo\/start$/);
  });

  test("Home with the visitor's apartment → its row → the calculator; عرض الكل → Units", async ({ page }) => {
    await resetGuestOnEveryLoad(page, withOwnUnit());
    await page.goto("/demo");
    await expect(page.getByText("سبتمبر 2026")).toHaveCount(0);
    await expect(page.getByRole("radio", { name: "أدير لملاك" })).toHaveCount(0);
    await page.getByTestId("home-apartment").click();
    await expect(page).toHaveURL(/\/demo\/calculator$/);
    await page.goto("/demo");
    await page.getByRole("link", { name: "عرض الكل" }).click();
    await expect(page).toHaveURL(/\/demo\/units$/);
  });

  test("Units → owner statement", async ({ page }) => {
    await page.goto("/demo/units");
    // Both statement actions on the managed sample cards (a link and a toast button) meet the 44 px touch target.
    const statementActions = page.getByText("عرض كشف الحساب");
    await expect(statementActions).toHaveCount(2);
    for (const action of await statementActions.all()) {
      const box = await action.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("link", { name: "عرض كشف الحساب" }).click();
    await expect(page).toHaveURL(/\/demo\/units\/downtown-cairo\/statement$/);
  });

  test("Guide → stage 3 detail", async ({ page }) => {
    await page.goto("/demo/guide");
    await page.getByRole("link", { name: /الميزانية والتجهيز/ }).click();
    await expect(page).toHaveURL(/\/demo\/guide\/3$/);
  });

  test("More → Pricing", async ({ page }) => {
    await page.goto("/demo/more");
    await page.getByRole("link", { name: /الباقات والأسعار/ }).click();
    await expect(page).toHaveURL(/\/demo\/pricing$/);
  });
});

test.describe("360 px layout", () => {
  for (const path of ALL_SCREENS) {
    test(`${path} renders right-to-left with no horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }

  for (const path of TAB_SCREENS) {
    test(`${path}: the floating nav never covers the last content`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const navBox = await bottomNav(page).boundingBox();
      expect(navBox).not.toBeNull();
      const lastContentBottom = await page.evaluate(() => {
        let bottom = 0;
        for (const el of document.querySelectorAll("main *")) {
          if (el.closest("nav")) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) bottom = Math.max(bottom, rect.bottom);
        }
        return bottom;
      });
      expect(lastContentBottom).toBeLessThanOrEqual(navBox!.y);
    });
  }
});

test.describe("right-to-left numbers", () => {
  test("a negative amount shows its minus sign to the left of the digits", async ({ page }) => {
    await page.goto("/demo/units/downtown-cairo/statement");
    const fees = page.locator("bdi", { hasText: /^\u22127,347\.00$/ });
    await expect(fees).toBeVisible();
    const [minusX, digitX] = await fees.evaluate((el) => {
      // React renders the sign and the digits as separate text nodes.
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const chars: { node: Text; offset: number; char: string }[] = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node as Text;
        for (let offset = 0; offset < text.length; offset++) {
          chars.push({ node: text, offset, char: text.data[offset]! });
        }
      }
      const left = (match: (char: string) => boolean) => {
        const found = chars.find((c) => match(c.char))!;
        const range = document.createRange();
        range.setStart(found.node, found.offset);
        range.setEnd(found.node, found.offset + 1);
        return range.getBoundingClientRect().left;
      };
      return [left((c) => c === "\u2212"), left((c) => /[0-9]/.test(c))];
    });
    expect(minusX).toBeLessThan(digitX);
  });
});
