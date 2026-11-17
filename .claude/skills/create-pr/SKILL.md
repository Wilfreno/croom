---
name: create-pr
description: Gate and open a pull request for the current branch. Checks whether the change needs new or updated tests, runs a senior-engineer review that halts on blocking issues, runs the affected workspaces' tests, type-checks and build, then pushes and opens the PR with gh using the repo's PR template.
argument-hint: "[base-branch] (default: main)"
disable-model-invocation: true
---

# create-pr

Open a PR for the current branch only after it passes four gates, in order. Any gate that fails **halts the process**: print the report, say `PR NOT CREATED`, name what must change, and stop. Never skip or soften a gate to get a PR out.

Base branch: `$ARGUMENTS` if given, otherwise `main`. Run everything from the repo root (`git rev-parse --show-toplevel`).

## Gate 0: Preflight

1. `git fetch origin <base>`.
2. Halt if the current branch is `<base>` or detached HEAD.
3. Halt if `gh auth status` fails, and tell the user to run `! gh auth login`.
4. If `git status --porcelain` shows uncommitted or untracked changes inside `apps/` or `packages/`, list them and ask whether they belong in this PR. The user reviews diffs before committing, so never commit them yourself without an explicit yes. If they say no, continue with only the committed work.
5. Halt if `git log origin/<base>..HEAD` is empty (nothing to open a PR for).
6. If `gh pr view --json url,state` finds an open PR for this branch, note its URL; the final step updates it instead of creating a new one.

Collect what every later gate uses:

- `git diff --stat origin/<base>...HEAD`
- `git diff origin/<base>...HEAD`
- `git log --format='%h %s%n%b' origin/<base>..HEAD`
- The workspaces touched (`apps/client`, `apps/server`, `packages/<name>`).

## Gate 1: Test coverage check

For every changed source file (not tests, config, styles, or docs), find its tests:

| Workspace | Where the tests live |
|---|---|
| `apps/client` | `apps/client/src/__tests__/` mirroring the `src/` path (`hooks/`, `lib/`, `providers/`, `components/`, `app/`); shared mocks in `__tests__/mocks/` |
| `apps/server` | colocated `*.spec.ts` beside the source file |
| `packages/guards`, `packages/models`, `packages/utils` | `*.spec.ts` beside the source file in that package's `src/` |
| `packages/constants`, `enums`, `schemas`, `types` | no test runner; skip unless a schema change alters validation that a test elsewhere covers |

Then classify each changed unit:

- **Covered**: an existing test exercises the changed behavior and was updated where the behavior changed.
- **Stale**: a test exists but asserts the old behavior, or the change breaks a mock it relies on (request shapes, socket events, query keys, mock providers).
- **Missing**: new or changed logic with no test.

Severity:

- **Blocking**: missing or stale tests for logic in hooks, `lib/`, providers, server controllers/services/gateways/guards, or the tested packages, and any bug fix that ships without a regression test.
- **Warning**: missing tests for purely presentational components or layout changes.

When something is blocking here, offer to write the missing tests, following the existing test file's style for that area. Writing them leaves uncommitted changes for the user to review, so stop afterwards and let them commit and rerun `/create-pr`.

## Gate 2: Senior engineer review

Run the review in a fresh `general-purpose` subagent so it reads the change without the context of having written it. Give it the base branch, the commit log, the full diff, and this brief:

> You are a senior software engineer reviewing this PR for the croom monorepo (Next.js client, NestJS server, shared packages, MongoDB, socket.io, mediasoup). Read the changed files in full where the diff alone is not enough context. Report only real problems with a concrete failure scenario; do not pad the list. For each finding give: severity, `file:line`, a one-line problem statement, the failure scenario, and a suggested fix.
>
> Severity:
> - **BLOCKING**: a correctness bug, crash, or broken user flow; a security issue (authz/authn bypass, a member acting on a conversation they should not, injection, leaked secrets or tokens); data loss or a corrupting write; a race condition (socket handshakes, concurrent updates, optimistic cache updates); a breaking API, socket-event, or Mongo schema change without a matching client/server update. `apps/fastify-server` is excluded from the workspace but shares the Mongo database, so schema or document-shape changes that would break it count as blocking even though type-checks will not catch them; also a leftover `console.log` or debug code.
> - **MAJOR**: a likely bug in an edge case, a missing error or loading state the user will hit, a performance problem on a hot path (re-renders, N+1 queries, unbounded lists), a hard-to-maintain design that will need rework soon.
> - **MINOR**: readability, naming, duplication, small simplifications.
> - **CONVENTION**: violations of project rules: identifiers must be camelCase (except deliberate snake_case cases already in the codebase); types go in `src/types`, helpers in `src/lib/utils.ts`, shared constants in `@repo/constants`, never inlined; use `Boolean(x)`, never `!!x`; new code carries no comments.
>
> Do not report missing, removed, or deleted comments or docs at any severity: deleting an existing comment is never a finding.
>
> BLOCKING and MAJOR both stop the PR, so do not downgrade a real, user-reachable bug to MINOR to soften the verdict. Return your findings as a markdown table followed by a one-line verdict: `BLOCKING ISSUES FOUND` (any BLOCKING or MAJOR finding) or `NO BLOCKING ISSUES`.

Check each BLOCKING and MAJOR finding yourself against the code before accepting it. Downgrade anything you cannot confirm to MINOR, and say that you did.

## Report

Print one combined report before deciding:

```
## create-pr report: <branch> → <base>

### Tests needed
| Status | Unit | Test file | Note |

### Review
| Severity | Location | Issue | Fix |

### Verdict
```

- If Gate 1 has any **Blocking** item, or Gate 2 has any **BLOCKING** or **MAJOR** item: the verdict is `BLOCKED`. Print `PR NOT CREATED`, list the blocking items as a numbered to-do list, and **stop**. Do not run tests, push, or create the PR.
- Otherwise the verdict is `CLEAR` and the MINOR/CONVENTION items are listed as non-blocking. Continue to Gate 3.

## Gate 3: Tests, type-checks and build

Run only what the change affects, the same way CI's `.github/workflows/test.yml` does:

```bash
pnpm exec turbo run test --filter="...[origin/<base>...HEAD]" --continue
pnpm exec turbo run check-types --filter="...[origin/<base>...HEAD]" --continue
pnpm exec turbo run build --filter="...[origin/<base>...HEAD]" --continue
```

If the root `package.json`, `pnpm-lock.yaml`, or `.github/workflows/test.yml` changed, drop the filter and run everything, as CI does.

Run the three commands one after another, never combined into one `turbo run` call: `next build` regenerates `.next/types` while the client's `tsc` reads it, which fails with spurious `TS6053 ... not found` errors.

If a type error is in a file the branch did not touch, check it against `origin/<base>` before blaming the branch. If it already fails there, report it as pre-existing, but it still fails the gate: ask the user whether to fix it in this PR or stop.

Record per workspace, for the PR body: pass/fail and the test count for tests (from vitest's `Tests  N passed` line), pass/fail for type-check, and pass/fail plus duration for build. A workspace with no script for a task is recorded as `n/a`, not as a pass. `apps/server` has no `check-types` script; its type errors surface through `nest build`.

If any test, type-check, or build fails: show the failing test names or the relevant error output, print `PR NOT CREATED`, and **stop**. Do not retry flaky-looking failures silently; rerun once and report both outcomes. If a build fails only because a required environment variable is missing locally (e.g. `UPLOADTHING_TOKEN` for the client), say which one and ask the user whether to set it or proceed with the build marked `skipped (missing env)`. Never mark it as passed.

## Gate 4: Push and open the PR

1. `git push -u origin HEAD`. Never force-push; if the push is rejected, stop and report why.
2. Title: a conventional-commit title matching the repo's history, e.g. `feat(client): ...`, `fix(server): ...`, `refactor(models): ...`. Use the scope of the main workspace touched, or no scope if it spans several. Lower case, imperative mood, no trailing period, under 72 characters.
3. Body: fill in every section of `.github/pull_request_template.md`, keeping its headings and order, and drop the template's `<!-- -->` hint comments:
   - **Summary**: one or two short prose paragraphs like past PRs: what changed and why, naming the user-facing behavior and any endpoints, socket events, or schema changes.
   - **Screenshots / recording**: skip it. Keep the heading and the empty Before/After table exactly as in the template and do not ask the user for anything; the author adds screenshots or a recording on GitHub after the PR is open.
   - **Directories changed**: tick `[x]` each of `apps/client`, `apps/server`, `packages/` that the diff touches, and after `packages/` list which packages. Leave the others unticked.
   - **Test results**: one row per workspace from Gate 3 (e.g. `client | ✅ pass | 142 passed`), then list the test files added or updated in this PR.
   - **Build results**: one row per workspace from Gate 3 with build and type-check status (`✅ pass`, `❌ fail`, `n/a`, or `skipped (missing env)`), and the build duration.
   - **Review notes**: the MINOR/CONVENTION items left by Gate 2 as a list, or `None`.
   - End with the attribution line from the current session's instructions, if one is given.
4. Write the body to a temp file and run `gh pr create --base <base> --title "<title>" --body-file <file>`. If Gate 0 found an open PR, run `gh pr edit` with the new title and body instead and say that you updated it.
5. Finish by printing the PR URL, the verdict, the test and build summary, and any non-blocking notes the author may still want to address.
