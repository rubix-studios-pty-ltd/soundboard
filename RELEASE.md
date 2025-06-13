# Release Process

This project uses [standard-version](https://github.com/conventional-changelog/standard-version) for versioning and changelog generation.

## Making Changes

When making changes, use conventional commit messages:

- `feat: add new feature`
- `fix: resolve bug`
- `perf: performance improvements`
- `refactor: code restructuring`
- `style: formatting changes`
- `docs: documentation updates`
- `test: test updates`
- `build: build system changes`
- `ci: CI configuration changes`

## Creating a Release

1. Ensure all changes are committed and pushed to master
2. Run one of these commands:
   - `pnpm run release` - patch version (bug fixes)
   - `pnpm run release:minor` - minor version (new features)
   - `pnpm run release:major` - major version (breaking changes)
3. Push the changes and tag:

   ```bash
   git push --follow-tags origin master
   ```

The GitHub Action will automatically:

1. Build the application for Windows and macOS
2. Create a GitHub release with the changelog
3. Upload the build artifacts

## Publishing

Releases are automatically published to GitHub Releases when a version tag is pushed.
The tag should be in the format `v*.*.*` (e.g., `v1.2.3`).
