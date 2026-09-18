# Releasing

Loreum versions follow the roadmap at <https://loreum.app/roadmap>. A minor
version (`0.3.0`) ships the feature set its roadmap phase names; anything else —
fixes, tooling, docs, small additions to shipped features — is a patch on the
current line (`0.2.1`, `0.2.2`, …). Do not spend a minor version on work the
roadmap has not reached.

`CHANGELOG.md` is the source of truth. GitHub Releases are published from it, so
release notes are written and reviewed in a pull request like any other change.

## Cutting a release

1. **Land the work.** Every PR merged to `main` with CI green.

2. **Move `[Unreleased]` into a version section.** Add
   `## [X.Y.Z] - YYYY-MM-DD` beneath `## [Unreleased]` and file the entries
   under short headings that say what changed for a reader ("Tests no longer
   destroy development data"), not which PR it came from. Leave `[Unreleased]`
   empty above it.

3. **Bump `version`** in `package.json`, `apps/api/package.json`, and
   `apps/web/package.json` to match. The `packages/*` workspaces are internal
   and stay at their own versions.

4. **Open a PR** with those two changes and merge it. `main` is protected, so
   this is how the release commit gets in.

5. **Tag and publish** from the merge commit:

   ```sh
   git checkout main && git pull
   git tag -a v0.2.1 -m "v0.2.1"
   git push origin v0.2.1
   gh release create v0.2.1 --title "v0.2.1 — <short theme>" --notes-file <(…)
   ```

   The notes are the changelog section for that version, verbatim.

6. **Check the roadmap.** If the release completed a roadmap item, update its
   status in `apps/web/app/roadmap/page.tsx` so the public page stays honest.

## Deployment

Production pulls `main` from a private deployment repository. Call out anything
an operator must do — new environment variables, migrations, changed start
commands — in the changelog entry and the release notes. Migrations are applied
with `prisma migrate deploy`.
