# SmartThings Connector Changelog

## [Version 2.0] - 2026-07-02
- Migrated authentication from a static Personal Access Token to SmartThings' OAuth2 flow, fixing the extension after Samsung's PAT expiration policy change (PATs now expire after 24h). Access tokens now refresh silently in the background.
- Preferences now require a SmartThings `clientId`/`clientSecret` (from your own OAuth app in the SmartThings Developer Workspace) instead of an API token.
- Consolidated all SmartThings API calls into a single client module, removing duplicated/inconsistent request code across commands.
- Modernized all commands to the current `@raycast/api` conventions (`Toast.Style`, `Action`, `Action.CopyToClipboard`, `accessories`), replacing deprecated APIs that were still working but flagged as legacy.
- Removed an unused, orphaned `src/tools/smartthings.ts` file.

## [Version 1.1] - 2024-03-19
- Added menu bar monitoring of SmartThings home mode
- Added background refresh capability to menu bar command
- Added support for dimming controls
- Updated ESLint configuration to be compatible with Raycast's publishing checks
- Improved error handling in API calls
- Added better type safety throughout the application
- Fixed formatting issues across all source files

## [Version 1.0] - 2024-09-19
- Support for viewing and controlling lights
- Support for executing scenes
- Support for changing home modes





