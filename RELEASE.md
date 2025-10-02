# Release Process

This project uses [semantic-release](https://semantic-release.gitbook.io/semantic-release/) for **automated versioning, changelog management, and GitHub Releases**.

## Making Changes

When committing, follow [Conventional Commits](https://www.conventionalcommits.org/) so semantic-release can correctly determine version bumps:

- `feat: add new feature` → **minor** version  
- `fix: resolve bug` → **patch** version  
- `feat!: breaking change` or `BREAKING CHANGE:` in body → **major** version  
- `perf: performance improvements`  
- `refactor: code restructuring`  
- `style: formatting changes`  
- `docs: documentation updates`  
- `test: test updates`  
- `build: build system changes`  
- `ci: CI configuration changes`  

Only **feat**, **fix**, and **BREAKING CHANGE** trigger version updates. Other types appear in the changelog but don’t affect versioning.

## Creating a Release

Releases are fully automated via GitHub Actions:

1. Push commits to `master` with proper conventional commit messages.  
2. CI runs tests and builds the application.  
3. Semantic-release:
   - Analyzes commits
   - Bumps the version
   - Updates `CHANGELOG.md`
   - Creates a Git tag
   - Publishes a GitHub Release with release notes
4. Build artifacts (`.exe`, `.dmg`) are uploaded automatically to the GitHub Release.

No manual version bumping, tagging, or pushing is required.

## Publishing

- **Tags**: Automatically created in the format `v*.*.*` (e.g., `v3.19.0`).  
- **Changelog**: `CHANGELOG.md` is updated for every release.  
- **Artifacts**: Windows (`.exe`) and macOS (`.dmg`) builds are attached to each GitHub Release.  

---

> ℹ️ **Note:** This project previously used `standard-version`. As of October 2025, we have migrated to `semantic-release`. All new releases follow the automated workflow described above.
