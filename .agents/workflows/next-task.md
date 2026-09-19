# /next-task: execute the next unchecked task

1. Read `docs/Memory.md` (Current Pointer + Gotchas) and `docs/Rules.md`.
2. Open `docs/Tasks.md`, find the first unchecked task. Confirm all its "Depends on" tasks are checked. If not, stop and report.
3. Write a short implementation plan (artifact): files to create/change, data model changes, endpoints, UI screens, tests. Keep it under 40 lines.
4. Check current official docs for every library/API you will use (versions, breaking changes). Record any surprises in Memory.md > Gotchas.
5. Implement in small steps. Commit at logical checkpoints using Conventional Commits.
6. Run `/verify`.
7. Tick the task box in `docs/Tasks.md` and add a one-line result note under it.
8. Update `docs/Memory.md`: Current Pointer, Progress Log entry, any new Decisions/Gotchas/Commands.
9. Final commit: `feat(<scope>): <task id> <summary>`.
10. If this was the last task of a phase, stop and produce the phase walkthrough artifact. Otherwise report the result in 5 lines and continue with the next task only if the human has not asked you to pause.
