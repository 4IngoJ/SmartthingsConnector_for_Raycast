import { MenuBarExtra, getPreferenceValues } from "@raycast/api";
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchCurrentLocationMode } from "./fetchDevices";
import { LocationMode } from "./types";

// Fixed 10 second refresh interval
const REFRESH_INTERVAL_MS = 10000;

interface Preferences {
  enableBackgroundRefresh: boolean;
}

export default function Command() {
  const [currentMode, setCurrentMode] = useState<LocationMode>({
    id: "",
    name: "Loading...",
  });

  const preferences = getPreferenceValues<Preferences>();
  const preferencesRef = useRef(preferences);
  const intervalRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(true);

  const updateCurrentMode = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      const timestamp = new Date().toLocaleString();
      console.log("\n=== Background Refresh Details ===");
      console.log("Timestamp:", timestamp);
      console.log("Current Settings:");
      console.log("- Background Refresh:", preferencesRef.current.enableBackgroundRefresh ? "Enabled" : "Disabled");
      console.log("Current State:");
      console.log("- Display Mode:", currentMode);
      
      console.log("\nFetching new data from SmartThings API...");
      const modeData = await fetchCurrentLocationMode();
      console.log("API Response:", JSON.stringify(modeData, null, 2));
      
      if (modeData?.id) {
        const newMode = {
          id: modeData.id,
          name: modeData.label || modeData.name,
        };
        
        setCurrentMode(prev => {
          if (prev.id !== newMode.id || prev.name !== newMode.name) {
            console.log("\nMode Change Detected:");
            console.log("- Previous Mode:", prev);
            console.log("- New Mode:", newMode);
            return newMode;
          }
          console.log("\nNo Mode Change:");
          console.log("- Current Mode:", prev);
          console.log("- API Mode:", newMode);
          return prev;
        });
      }
    } catch (error) {
      console.error("\nError During Refresh:");
      console.error("- Type: API Fetch Error");
      console.error("- Details:", error);
      console.error("- Current Mode Retained:", currentMode);
    }
  }, [currentMode]);

  const handleManualRefresh = useCallback(async () => {
    console.log("\n=== Manual Refresh Triggered ===");
    await updateCurrentMode();
  }, [updateCurrentMode]);

  const setupBackgroundRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    if (preferencesRef.current.enableBackgroundRefresh) {
      console.log("\n=== Setting up Background Refresh ===");
      console.log("Configuration:");
      console.log("- Interval: 10 seconds");
      console.log("- Milliseconds:", REFRESH_INTERVAL_MS);
      
      intervalRef.current = setInterval(() => {
        if (isActiveRef.current) {
          updateCurrentMode();
        }
      }, REFRESH_INTERVAL_MS);
    }
  }, [updateCurrentMode]);

  useEffect(() => {
    isActiveRef.current = true;
    preferencesRef.current = preferences;
    
    console.log("\n=== Initializing Menu Bar Monitor ===");
    console.log("Initial Configuration:");
    console.log("- Background Refresh:", preferences.enableBackgroundRefresh ? "Enabled" : "Disabled");
    
    updateCurrentMode();
    setupBackgroundRefresh();

    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      console.log("\n=== Cleaning up Menu Bar Monitor ===");
    };
  }, [preferences.enableBackgroundRefresh, setupBackgroundRefresh, updateCurrentMode]);

  return (
    <MenuBarExtra
      icon="smartthings_white.png"
      title={currentMode.name}
      tooltip={`Current Home Mode${preferences.enableBackgroundRefresh ? ' (Auto-refresh: 10s)' : ''}`}
    >
      <MenuBarExtra.Item
        title="Refresh"
        onAction={handleManualRefresh}
      />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title={`Auto-refresh: ${preferences.enableBackgroundRefresh ? 'On' : 'Off'}`}
        tooltip={preferences.enableBackgroundRefresh ? 'Updates every 10 seconds' : 'Manual updates only'}
      />
    </MenuBarExtra>
  );
} 