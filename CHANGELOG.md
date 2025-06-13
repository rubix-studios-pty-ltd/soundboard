# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.7.11](///compare/v3.7.10...v3.7.11) (2025-06-13)

### [3.7.10](///compare/v3.7.9...v3.7.10) (2025-06-13)


### Bug Fixes

* update pnpm version to 10 in build workflow f2c0f31

### [3.7.9](///compare/v3.7.8...v3.7.9) (2025-06-13)

### [3.7.8](///compare/v3.7.7...v3.7.8) (2025-06-13)


### Bug Fixes

* update dependency installation and caching strategy in build workflow 9239ec6

### [3.7.7](///compare/v3.7.6...v3.7.7) (2025-06-13)


### Bug Fixes

* update release commands to use pnpm instead of npm 40eb0e7

### [3.7.6](///compare/v3.7.5...v3.7.6) (2025-06-13)

### [3.7.5](///compare/v3.7.4...v3.7.5) (2025-06-13)

### [3.7.4](///compare/v3.7.3...v3.7.4) (2025-06-13)

### [3.7.3](///compare/v3.7.2...v3.7.3) (2025-05-20)

### [3.7.2](///compare/v3.7.1...v3.7.2) (2025-04-20)


### Bug Fixes

* correct version comparison links in CHANGELOG.md 6d5b8a0
* revert version to 3.7.1 in package.json and package-lock.json 84e42ef
* update Rubix Studios URL to remove 'www' prefix 649d3b4

### [3.7.1](///compare/v3.7.0...v3.7.1) (2025-04-18)


### Bug Fixes

* revert version to 3.7.0 in package-lock.json and update version badge in README.md 29470b9

## [3.7.0](///compare/v3.4.5...v3.7.0) (2025-04-18)


### Features

* enhance FFmpeg binary resolution and update packaging for ffmpeg-static a862aaa
* integrate fluent-ffmpeg and manage FFmpeg binary extraction; remove ffmpeg-installer dependency 8e6ecec


### Bug Fixes

* update file type validation to accept video files and adjust input accept attribute fc3c0fc


### Code Refactoring

* remove ffmpeg and ffmpeg-installer from build external dependencies; update type declarations 8ad8d03

### [3.4.5](///compare/v3.4.4...v3.4.5) (2025-04-16)


### Code Refactoring

* consolidate theme and settings management by removing unused data and introducing constants d3c71dc

### [3.4.4](///compare/v3.4.3...v3.4.4) (2025-04-15)


### Code Refactoring

* disable React DevTools global hook in browser build options f85d5f2

### [3.4.3](///compare/v3.4.2...v3.4.3) (2025-04-15)


### Code Refactoring

* remove unused create-release job from build workflow 92b06dd

### [3.4.2](///compare/v3.4.1...v3.4.2) (2025-04-15)


### Bug Fixes

* correct version comparison links in changelog and remove redundant section 064584f
* reorder Code Refactoring section in changelog for clarity e949804
* update maxItems for favorites to 18 across settings and preload 5041979
* update version comparison link in changelog and remove redundant section 0ace399


### Code Refactoring

* simplify sound management by removing locking mechanism and updating favorites component 74317c4
* streamline code formatting and improve readability in build workflow and audio pool disposal cafb61c

### [3.4.1](///compare/v3.2.0...v3.4.1) (2025-04-15)


### Features

* enhance sound management by adding validation, user-added sound support, and improved file handling 418328f
* enhance sound management with user-added sounds, implement loading and deletion features 42ce969
* add changelog reading and GitHub release creation steps to build workflow 2f0225d
* integrate hotkey management in favorites grid with sound playback support e5fa71c


### Documentation

* update README to include favorites management and custom sound import features fa0ce4b


### Code Refactoring

* clean up import order and format sound play function 35d1de7


### Bug Fixes

* ensure file input accepts only audio files f7893f7


## [3.2.0](///compare/v3.1.0...v3.2.0) (2025-04-15)


### Features

* favourites and custom user sound ffmepg bundle 7e7d31f
* implement sound management and conversion features, enhance UI components, and update theme colors 4fa03dd


### Bug Fixes

* hide add sound button when not needed ce84406


### Documentation

* enhance README with additional project info and badges ed3cd5c
* reorganize badge sections in README for improved clarity 1ac0a4b
* update README and add Security Policy; enhance changelog and Code of Conduct 1acf7fd
* update README to improve build and quality badge organization 2fd3e40


### Code Refactoring

* clean up setupIPC function by removing unnecessary comments and improving code clarity afb0e33

## [3.1.0](///compare/v3.0.4...v3.1.0) (2025-04-14)

### Features

* add standard-version for versioning and changelog generation 4c77733
* integrate auto-updater for automatic updates; add GitHub publish configuration 7066394
* replace color and hide settings with buttonSettings; update related components and remove unused icons fbd5ecf

### Bug Fixes

* enhance error logging by adding braces for clarity in multiple locations 1a2a3a8
* improve logging format in auto-updater events for better readability 338b80a
* remove redundant publish options from build scripts for Windows and macOS 09c6ecb
* revert version number to 3.0.5 in package.json f3c712b
* update @types/node and @types/react to latest versions dd699c6
* update branches for push and pull_request triggers in build workflow 7383d79
* update build scripts for Windows and macOS to include publish option 2642643
* update buttonActive and buttonColor values for theme presets 55cca0d
* update package.json and cog.tsx for artifact naming and SVG attributes a7bbedd
* update titles for sound tracks to improve clarity a247bac

## [3.0.5](https://github.com/rubixvi/soundboard/compare/v3.0.4...v3.0.5) (Current)

Initial changelog creation. Previous changes can be found in commit history.
