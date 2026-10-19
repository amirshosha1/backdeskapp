# Stabilization step 1 — account persistence acceptance

Run only on the PR preview with two test Google accounts, A and B. Do not use customer data. The hosted Supabase project is production; automated database tests use the disposable CI database.

| Check | Steps | Pass condition |
|---|---|---|
| Guest persistence | In a clean browser, complete the first-run flow, change one calculator field, reload Units, then close and reopen the browser. | The same apartment and value remain on that device. |
| Guest to Google A | Sign in as A from that device. Return from Google to the same app page. Reload and open Units. | The guest apartment appears once in A's account. The browser copy is cleared only after a confirmed save or duplicate. |
| A on another device | Sign in as A in a different browser profile. | A's apartment and edited value load there. |
| Account isolation | Sign out of A, sign in as B in the same browser, then open Units and direct links to A's unit. Repeat in a separate browser profile. | B sees none of A's apartment, name, values, or profile answer. B cannot edit or delete A's unit. |
| Return to A | Sign out of B and sign in as A again. | A's apartment is intact and B's data is absent. |
| Same-user refocus | Open A's calculator and a partly typed Units sheet, switch to another app/tab and back, including while an autosave is in flight. | No blank screen, lost form text, false sign-out toast, or dropped save. |
| Missing/delayed event | Sign in as B in another window while A's tab is open, then return to A's tab; also use Back/Forward after sign-out and sign-in. | A's data is hidden when B's session is detected; no A write lands in B. |
| Pending read | Start loading A's account on a slow network and sign out or switch to B before loading completes. | A's data disappears and no late A data appears for B. |
| Pending save | Start saving A's unit on a slow network and sign out or switch to B before the response completes. | B never sees A's unit or result; returning to A shows whether the request completed. |
| Sign-out failure | If the network can be interrupted during sign-out, interrupt it and then reconnect. | The app does not report success while the session remains; data stays hidden and a retry is offered. |

Record the preview URL, browser/device, test date, and a pass/fail result for each row in the PR discussion. Do not post account credentials or personal data. If any isolation check fails, keep the PR draft and block private beta.

Automated evidence: `e2e/first-run.spec.ts`, `e2e/accounts-env.spec.ts`, `src/lib/account/{adoption,store}.test.ts`, and `tests/db/rls.test.ts`. CI must pass both general checks and the disposable database RLS job. These checks do not replace the two-account Google test above.
