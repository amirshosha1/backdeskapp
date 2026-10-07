/** Every /demo screen, in Arabic (the default locale, no prefix). */
export const ALL_SCREENS = [
  "/demo",
  "/demo/start",
  "/demo/expenses",
  "/demo/expenses/new",
  "/demo/calculator",
  "/demo/calculator?tab=all",
  "/demo/guide",
  "/demo/guide/3",
  "/demo/units",
  "/demo/units/downtown-cairo/statement",
  "/demo/pricing",
  "/demo/more",
];

/** Full-screen tasks with no bottom navigation. */
const TASK_SCREENS = ["/demo/expenses/new", "/demo/start"];

/** Screens that sit under the floating bottom navigation. */
export const TAB_SCREENS = ALL_SCREENS.filter((path) => !TASK_SCREENS.includes(path));
