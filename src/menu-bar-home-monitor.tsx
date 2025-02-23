import { MenuBarExtra, getPreferenceValues } from "@raycast/api";
import { useEffect, useState, useCallback } from "react";
import { fetchCurrentLocationMode } from "./fetchDevices";
import { LocationMode } from "./types";

// Helper to convert preference string to milliseconds
const getRefreshIntervalMs = (interval: string): number => {
  const value = parseInt(interval.slice(0, -1));
  const unit = interval.slice(-1);
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    default:
      return 10000;
  }
};

interface Preferences {
  refreshInterval: string;
  enableBackgroundRefresh: boolean;
}

export default function Command() {
  const [currentMode, setCurrentMode] = useState<LocationMode>({
    id: "",
    name: "Loading...",
  });

  // Get preferences
  const { refreshInterval, enableBackgroundRefresh } = getPreferenceValues<Preferences>();
  const intervalMs = getRefreshIntervalMs(refreshInterval);

  // Function to fetch and update current mode
  const updateCurrentMode = useCallback(async () => {
    try {
      const timestamp = new Date().toLocaleString();
      console.log("\n--- Fetching Current Mode ---");
      console.log("Timestamp:", timestamp);
      console.log("Refresh Type:", enableBackgroundRefresh ? "Background" : "Manual");
      
      const modeData = await fetchCurrentLocationMode();
      console.log("API Response:", JSON.stringify(modeData, null, 2));
      
      if (modeData?.id) {
        const newMode = {
          id: modeData.id,
          name: modeData.label || modeData.name,
        };
        
        setCurrentMode(prev => {
          if (prev.id !== newMode.id || prev.name !== newMode.name) {
            console.log("Mode changed from:", prev, "to:", newMode);
            return newMode;
          }
          console.log("Mode unchanged:", prev);
          return prev;
        });
      } else {
        console.log("Invalid mode data received");
      }
    } catch (error) {
      console.error("Failed to fetch current mode:", error);
    }
  }, []);

  // Handle manual refresh on click
  const handleClick = useCallback(async () => {
    console.log("\n=== Manual Refresh Triggered ===");
    await updateCurrentMode();
  }, [updateCurrentMode]);

  // Setup background refresh
  useEffect(() => {
    let isActive = true;
    
    console.log("\n=== Initializing Menu Bar Monitor ===");
    console.log("Background Refresh:", enableBackgroundRefresh ? "Enabled" : "Disabled");
    console.log("Refresh interval:", refreshInterval, `(${intervalMs}ms)`);
    
    // Initial fetch
    updateCurrentMode();

    // Set up background refresh interval if enabled
    let interval: NodeJS.Timeout | undefined;
    
    if (enableBackgroundRefresh) {
      interval = setInterval(() => {
        if (isActive) {
          console.log("\n=== Background Refresh Triggered ===");
          updateCurrentMode();
        }
      }, intervalMs);
      console.log("Background refresh interval started");
    }

    // Cleanup function
    return () => {
      isActive = false;
      if (interval) {
        clearInterval(interval);
        console.log("Background refresh interval cleared");
      }
      console.log("\n=== Cleaning up Menu Bar Monitor ===");
    };
  }, [intervalMs, refreshInterval, enableBackgroundRefresh, updateCurrentMode]);

  return (
    <MenuBarExtra
      icon="smartthings_white.png"
      title={currentMode.name}
      tooltip={`Current Home Mode${enableBackgroundRefresh ? ' (Auto-refresh)' : ''}`}
    >
      <MenuBarExtra.Item
        title="Refresh Now"
        onAction={handleClick}
      />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title={`Background Refresh: ${enableBackgroundRefresh ? 'On' : 'Off'}`}
        tooltip={enableBackgroundRefresh ? `Updates every ${refreshInterval}` : 'Manual updates only'}
      />
    </MenuBarExtra>
  );
} 