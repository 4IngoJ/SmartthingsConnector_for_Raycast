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

export default function Command() {
  const [currentMode, setCurrentMode] = useState<LocationMode>({
    id: "",
    name: "Loading...",
  });

  // Get refresh interval from preferences
  const { refreshInterval } = getPreferenceValues<{ refreshInterval: string }>();
  const intervalMs = getRefreshIntervalMs(refreshInterval);

  // Function to fetch and update current mode
  const updateCurrentMode = useCallback(async () => {
    try {
      const timestamp = new Date().toLocaleString();
      console.log("\n--- Fetching Current Mode ---");
      console.log("Timestamp:", timestamp);
      
      const modeData = await fetchCurrentLocationMode();
      console.log("API Response:", JSON.stringify(modeData, null, 2));
      
      if (modeData?.id) {
        const newMode = {
          id: modeData.id,
          name: modeData.label || modeData.name,
        };
        
        // Only update if the mode actually changed
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

  useEffect(() => {
    let isActive = true;
    
    console.log("\n=== Initializing Menu Bar Monitor ===");
    console.log("Refresh interval set to:", refreshInterval, `(${intervalMs}ms)`);
    
    // Initial fetch
    updateCurrentMode();

    // Set up refresh interval
    const interval = setInterval(() => {
      if (isActive) {
        console.log("\n=== Auto Refresh Triggered ===");
        updateCurrentMode();
      }
    }, intervalMs);

    // Cleanup function
    return () => {
      isActive = false;
      clearInterval(interval);
      console.log("\n=== Cleaning up Menu Bar Monitor ===");
    };
  }, [intervalMs, refreshInterval, updateCurrentMode]);

  return (
    <MenuBarExtra
      icon="smartthings_white.png"
      title={currentMode.name}
      tooltip="Current Home Mode"
    >
      <MenuBarExtra.Item
        title="Refresh"
        onAction={handleClick}
      />
    </MenuBarExtra>
  );
} 