/**
 * The first-run answer to "how many apartments do you have?" (a range).
 * Kept in the browser for a visitor and in `profiles.apartment_count_answer`
 * for an account; the database's check constraint lists the same four.
 */
export const APARTMENT_COUNTS = ["1", "2-3", "4-10", "10+"] as const;
export type ApartmentCount = (typeof APARTMENT_COUNTS)[number];

export function isApartmentCount(x: unknown): x is ApartmentCount {
  return typeof x === "string" && (APARTMENT_COUNTS as readonly string[]).includes(x);
}
