/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** SmartThings API Token - Your SmartThings API Token */
  "apiToken": string,
  /** SmartThings Location ID - Your SmartThings Location ID */
  "locationId": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `show-lights` command */
  export type ShowLights = ExtensionPreferences & {}
  /** Preferences accessible in the `show-location-mode` command */
  export type ShowLocationMode = ExtensionPreferences & {}
  /** Preferences accessible in the `show-rooms` command */
  export type ShowRooms = ExtensionPreferences & {}
  /** Preferences accessible in the `show-scenes` command */
  export type ShowScenes = ExtensionPreferences & {}
  /** Preferences accessible in the `show-all-devices` command */
  export type ShowAllDevices = ExtensionPreferences & {}
  /** Preferences accessible in the `menu-bar-home-monitor` command */
  export type MenuBarHomeMonitor = ExtensionPreferences & {
  /** Enable Background Refresh - Automatically refresh the location mode every 10 seconds */
  "enableBackgroundRefresh": boolean
}
}

declare namespace Arguments {
  /** Arguments passed to the `show-lights` command */
  export type ShowLights = {}
  /** Arguments passed to the `show-location-mode` command */
  export type ShowLocationMode = {}
  /** Arguments passed to the `show-rooms` command */
  export type ShowRooms = {}
  /** Arguments passed to the `show-scenes` command */
  export type ShowScenes = {}
  /** Arguments passed to the `show-all-devices` command */
  export type ShowAllDevices = {}
  /** Arguments passed to the `menu-bar-home-monitor` command */
  export type MenuBarHomeMonitor = {}
}


