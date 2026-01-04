# Release Checklist (npm)

Use `pnpm` (Node 22+) from the repo root. Keep the working tree clean before tagging/publishing.

1) **Version & metadata**
- [ ] Bump `package.json` version (e.g., `1.1.0`).
- [ ] Update CLI/version strings if needed.
- [ ] Confirm package metadata (name, description, repository, keywords, license) and `bin` map points to `dist/index.js` for `klaus`/`kl`.
- [ ] If dependencies changed, run `pnpm install` so `pnpm-lock.yaml` is current.

2) **Build & artifacts**
- [ ] `pnpm run build` (regenerates `dist/`).
- [ ] Optional: `npm pack --pack-destination /tmp` after the build; inspect the tarball contents.

3) **Changelog & docs**
- [ ] Update `CHANGELOG.md` with user-facing highlights; keep entries strictly descending by version.
- [ ] Ensure README examples/flags match current CLI behavior.

4) **Validation**
- [ ] `pnpm lint`
- [ ] `pnpm test` (or `pnpm test:coverage` if you need coverage output)
- [ ] `pnpm run build` (last sanity check after tests)
- [ ] (Optional) Spot-check a Web flow if your changes affect send/receive paths.

5) **Publish**
- [ ] Confirm git status is clean; commit and push as needed.
- [ ] `npm login` (verify 2FA) if needed.
- [ ] `npm publish --access public` (use `--tag beta` for pre-releases).
- [ ] Verify the registry: `npm view klaus version` and `npx -y klaus@X.Y.Z --version`.

6) **Post-publish**
- [ ] Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z` (or `git push --tags`).
- [ ] Create/refresh the GitHub release for `vX.Y.Z`.
- [ ] From a clean temp directory, run `npx -y klaus@X.Y.Z send --help` to confirm install/CLI entrypoints work.
