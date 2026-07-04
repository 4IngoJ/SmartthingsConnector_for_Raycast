# Smartthings Connector Raycast Extension

Welcome to the SmartThings Raycast Extension! This extension allows you to interact with your SmartThings devices directly from Raycast, enabling seamless control and management of your smart home.

## Features

- View and control devices
- Execute scenes
- Toggle device status (e.g., lights, switches)
- View detailed device information
- Menu bar monitor for the current location mode

## Authentication: why OAuth2 instead of an API token

Samsung changed how the SmartThings API can be accessed: Personal Access Tokens (PAT) created after **30 Dec 2024** now expire after **24 hours**, and PATs are officially considered a short-lived, testing-only mechanism. For a tool you want to keep working, Samsung recommends OAuth2 instead ([announcement](https://community.smartthings.com/t/changes-to-personal-access-tokens-pat/292019)).

This extension therefore uses SmartThings' OAuth2 flow (via Raycast's built-in OAuth support). You log in once through the browser; the extension then silently refreshes your access token in the background, so you never have to manually regenerate a token again.

The trade-off: SmartThings' OAuth app registration requires a `clientId` **and** `clientSecret` (it does not support secret-less PKCE-only clients), so — unlike a typical "sign in with Google" flow — each user of this extension needs to register their own small OAuth app in the SmartThings Developer Workspace and paste the resulting credentials into the extension preferences. It only takes a few minutes and only has to be done once.

## Requirements

- Raycast installed on macOS.
- A Samsung account with at least one SmartThings location.
- Your own OAuth app registered in the SmartThings Developer Workspace (see below).

## Getting Started

### 1. Register an OAuth app in the SmartThings Developer Workspace

1. Go to the [SmartThings Developer Workspace](https://developer.smartthings.com) and sign in with your Samsung account.
2. Create a new project and choose the **Automation for the SmartThings App** / **API-Only** app type (the option for personal/API integrations, not a published SmartApp).
3. In the app's **OAuth** settings, set the redirect URI to:
   ```
   https://raycast.com/redirect?packageName=Extension
   ```
   This is a static URL used by all Raycast extensions — do not substitute anything in it.
4. Add the following OAuth scopes (needed for the commands in this extension):
   ```
   r:devices:* x:devices:* r:locations:* w:locations:* r:scenes:* x:scenes:*
   ```
5. Save the app. SmartThings will show you a **Client ID** and **Client Secret** — copy both immediately, the secret is only shown once. If you lose it, you can generate a new one from the app's settings.

### 2. Find your SmartThings Location ID

1. Go to [my.smartthings.com/advanced/locations](https://my.smartthings.com/advanced/locations) and sign in.
2. Select the location you want this extension to control.
3. Copy the location ID from the URL or the location details.

### 3. Configure the extension preferences

1. Open Raycast, type `Extensions`, and search for **SmartThings Connector**.
2. Enter the **SmartThings Client ID** and **SmartThings Client Secret** from step 1.
3. Enter the **SmartThings Location ID** from step 2.
4. Run any command (e.g. **Show Lights**). Raycast will open a browser window asking you to log in to SmartThings and approve the requested scopes. After approving, you're redirected back to Raycast and the extension is ready to use.

You can revoke access at any time from the extension's preferences (a **Logout** option appears automatically once you're signed in) or from your [SmartThings account settings](https://account.smartthings.com).

### Known limitation

SmartThings has historically had bugs where OAuth app tokens (as opposed to PATs) couldn't change the current location mode (`PUT /locations/{id}/modes/current`). If **Show Location Mode** or the menu bar's mode switcher fails specifically when *switching* (but reading works fine), this is a platform-side limitation, not a bug in the extension — check the [SmartThings Community](https://community.smartthings.com) for the current status.

## Feedback

Your feedback is highly appreciated! If you encounter any issues or have suggestions for improvements, please [open an issue](https://github.com/4IngoJ/SmartthingsConnector_for_Raycast) on GitHub.
