# Stabilization step 4 — account deletion acceptance

Use a disposable Google test account on the PR Preview. Do not delete a real customer account or run deletion on the hosted Supabase project through automation.

1. Sign in, add a test apartment, and note its name. Confirm the deletion sheet clearly says what will be removed.
2. Cancel once. The account and apartment must remain.
3. Confirm deletion. The app must sign out and clear its browser copy only after the server succeeds.
4. Try returning with browser Back/Reload and the old unit URL. No account or unit data should appear.
5. Sign in with the second test account. Its data must be unchanged.

Record the Preview URL, date, and pass/fail for each step in the PR. CI's disposable database tests in `tests/db/rls.test.ts` prove the SQL behavior, including shared-org preservation and a stale token. They cannot prove Supabase Auth and Google behavior on the hosted project. Keep the PR draft and block private beta until both checks pass.

The shared-org test also guards `created_by`: deleting the original author must leave the apartment with a null author, as its foreign key specifies. Migration `20261012100000_preserve_fk_set_null.sql` permits that internal referential action; the later `20261017142500_guard_shared_org_deletion.sql` narrows it to an author who has actually been deleted. The later migration also serializes concurrent deletions and blocks the last owner or admin of a shared org from leaving until another owner or admin is arranged. The shared-org and concurrent-deletion cases run only in disposable Postgres; Preview uses the unmigrated production database.

Before an authorized merge, take a production backup with an isolated restore (`docs/BACKUP_DRILL.md`). The first production run passed on 2026-10-19 (Actions run 39202267998); take a fresh one if data has changed since. Both migrations are forward-only and must not be edited after push. After an authorized deployment, run the read-only `docs/verify_after_migration.sql` and `docs/verify_preserve_fk_set_null.sql` in the SQL editor and record every result. The second file checks the installed foreign key, update trigger, narrowed function guard, deletion lock/manager rule, and direct column grant; it does not delete a user or prove hosted Auth behavior.

## Support-assisted deletion

Do **not** delete a Backdesk user with Supabase Authentication → Users, `auth.admin.deleteUser()`, or a direct `DELETE FROM auth.users`. All three bypass `delete_my_account()`. For a sole member, the Auth foreign key deletes their membership but leaves the org, entitlement, and apartments with no member; for a last manager of a shared org, it leaves members without an owner or admin. A direct Auth deletion is unsafe even when the account has no shared org.

1. Verify the person's identity and deletion request. If they can sign in, ask them to use the in-app deletion flow, which removes sole-member orgs before deleting the Auth user.
2. If the app reports `shared_org_requires_owner_transfer`, identify every affected shared org and coordinate with its remaining members. With the necessary authorization, arrange an existing member as owner/admin, or agree on closing the shared org and removing its other memberships. Then have the person retry the in-app flow. Never promote an unconsenting member or remove another person's access solely to unblock a request.
3. If the person cannot use the app, escalate to the owner and a database operator. There is no approved generic support-only deletion command. Prepare a reviewed, account-specific transaction that locks all affected org rows in ID order, refuses to leave any shared org without an owner/admin, deletes every sole-member org before the Auth user, and verifies the result before commit. Record authorization, affected org IDs, the exact SQL, and before/after checks. Do not substitute a dashboard Auth deletion.

After an authorized deployment, the first hosted shared-org smoke test should use disposable accounts only: arrange a temporary shared membership through an explicitly approved operator action, delete the original author through the app, and verify that the remaining manager can access the surviving apartment with `created_by` cleared. Record cleanup and the result in the PR. If this setup is not approved, mark hosted shared-org behavior **NOT TESTED**; the read-only scripts and CI are not a substitute.
