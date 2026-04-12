# Dev Server Issues Log

Live log of errors, warnings, and compile failures observed while monitoring `npm run dev` on localhost:3000. Written by the monitoring Claude while another Claude edits the repo.

Format per entry:
- **Timestamp** — approximate time observed
- **Severity** — error / warning / info
- **Source** — file or area
- **Message** — raw log line(s)
- **Notes** — any context or suggested fix

---

## 2026-04-11 — Session start

- **Severity:** warning
- **Source:** middleware file convention (Next.js 16)
- **Message:** `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`
- **Notes:** Pre-existing on server start. Not blocking. Next.js 16 renamed `middleware.ts` → `proxy.ts`. Safe to defer unless the other Claude is already touching middleware.

---

## 2026-04-12

- **Severity:** info
- **Source:** next.config.ts
- **Message:** `⚠ Found a change in next.config.ts. Restarting the server to apply the changes...`
- **Notes:** Other Claude modified `next.config.ts`. Server auto-restarted and came back up cleanly in 1971ms (happened twice). Same pre-existing middleware deprecation warning on restart. No errors.

---

- **Severity:** ERROR
- **Source:** Supabase Auth (`AuthApiError`)
- **Message:** `AuthApiError: Request rate limit reached` / `__isAuthError: true` — repeated 15+ times in rapid succession
- **Notes:** Supabase free-tier rate limit hit. Likely caused by rapid hot-reloads triggering auth session checks on every recompile. The other Claude's frequent file saves are causing many HMR cycles, each one re-running auth middleware/session logic. This will self-resolve once edits slow down, but if it persists it could block auth-dependent pages. Consider adding a debounce or guard on session refresh, or temporarily disabling auth calls during dev.

---
