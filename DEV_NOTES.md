Developer Notes — Maximus Engagimus

Issue: Intermittent Supabase `getSession` AbortError causing app to remain on a Loading state.

Observation:
- In some environments (browser extensions, network flakiness), `supabase.auth.getSession()` can reject with an `AbortError` or hang.
- This prevents `AuthProvider` from clearing the `loading` state and blocks the UI until manual refresh.

Fix applied:
- Added a one-time retry for `getSession` when an `AbortError` is thrown.
- Added an 8s timeout fallback for auth initialization; on timeout we clear `loading` and show the login page.

Recommendation:
- If you see repeated AbortErrors, check browser extensions (privacy/network blockers) and test without them.
- Consider adding monitoring/logging to capture frequency of auth-init timeouts and user complaints.

Files changed:
- `src/contexts/AuthContext.jsx` — added retry + timeout fallback and safe error handling.

Reminder: When changing auth init behavior, always verify locally by simulating AbortError (DevTools network conditions or by mocking `supabase.auth.getSession`).