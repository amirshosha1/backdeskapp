# Stabilization step 3 — financial examples

The furnished and empty 3BR rental examples now use the booked ADR and costs in `FINANCIAL_BASELINE.md` §§2, 4, 7, 11 and 13. They are labelled examples rather than market estimates. The furnished example has EGP 35,000 rent and no setup cost; the empty example has EGP 18,000 rent and EGP 334,000 setup over 60 months. Both use 14 booked nights, EGP 2,450 booked ADR, and EGP 250 laundry per stay in addition to cleaning and consumables.

`src/lib/calculator/form.test.ts` checks the engine's exact monthly results and rounded break-even nights against the baseline's worked comparison. The engine formulas were not changed. Existing saved forms without laundry are read with laundry at zero, preserving their previous result; only newly selected examples include the new cost. The server validates new writes using the updated field list.

The landing example uses the furnished preset, so its two share images and manifest were regenerated from the page with a local installed Chromium browser. This PR must pass the image hash, unit, type, lint, build and database checks in CI before review. The baseline's proposed broker fee, prepaid-month cash timing and extra monthly-cost inputs remain outside this preset update and must not be implied by the examples.
