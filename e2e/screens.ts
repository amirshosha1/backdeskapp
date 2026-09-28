/** Every /demo screen, in Arabic (the default locale, no prefix). */
export const ALL_SCREENS = [
  "/demo",
  "/demo/expenses",
  "/demo/expenses/new",
  "/demo/calculator",
  "/demo/guide",
  "/demo/guide/3",
  "/demo/units",
  "/demo/units/downtown-cairo/statement",
  "/demo/pricing",
  "/demo/more",
];

/** Screens that sit under the floating bottom navigation. */
export const TAB_SCREENS = ALL_SCREENS.filter((path) => path !== "/demo/expenses/new");
