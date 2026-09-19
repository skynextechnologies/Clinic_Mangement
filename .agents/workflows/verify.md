# /verify: prove the task is really done

1. `pnpm lint && pnpm typecheck` must pass with zero warnings that you introduced.
2. `pnpm test` must pass. New logic must include new tests (unit + integration for API; component tests for non-trivial UI).
3. If a DB schema changed: create a migration (never edit an applied one), run `pnpm db:migrate` on a clean database, and run `pnpm db:seed`.
4. If an API endpoint changed: confirm it appears correctly in Swagger (`/api/docs`), and exercise it with a real request (curl or test) including one unauthorized and one forbidden case.
5. If UI changed: start `pnpm dev`, open the page in the browser, and test the happy path, an empty state, a loading state, an error state, and keyboard navigation. Check widths 375, 768 and 1280. Capture screenshots as evidence.
6. `pnpm build` must pass for any task that touches build config, routing, or shared packages.
7. Grep your diff for: `console.log`, `TODO`, `FIXME`, hard-coded secrets, real-looking patient data. Remove them.
8. Report results as a checklist with pass/fail per item. Do not report "done" with any failing item.
