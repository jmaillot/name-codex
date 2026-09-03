# Agent Instructions — Name Codex

## Critical: Never commit `.planning/`

- `.planning/` is **local-only** and **gitignored** (see `.gitignore:1`).
- **NEVER** `git add` anything under `.planning/` — not even with `git add -f`.
- **NEVER** commit `.planning/MILESTONES.md`, `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/milestones/*`, `.planning/phases/*`.
- GSD config `.planning/config.json:planning.commit_docs` must stay `false`. Do not set it to `true`.
- If you need to archive milestone docs, keep them local only. The remote must never contain `.planning/`.
- Verification before every commit/push:
  ```bash
  git ls-files | grep "^\.planning" && echo "BLOCKED: .planning is tracked"
  git diff --cached --name-only | grep "^\.planning" && echo "BLOCKED: .planning staged"
  ```

## Other gitignored paths — also never commit
- `docs/*` (except `docs/screenshot.png`, `docs/DATA-FORMAT.md`, `docs/DATA-FORMAT_FR.md`)
- `.backups/`, `graphify-out/`, `dist/`, `coverage/`, `node_modules/`

## Commit hygiene
- Always run `git status` and `git diff --cached --stat` before committing.
- If `.planning` appears as untracked, leave it untracked. If it appears as tracked (`git ls-files | grep planning`), run `git rm --cached -r .planning` before committing.
