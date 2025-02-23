import { MenuBarExtra, Icon, showToast, Toast, Color, getPreferenceValues } from "@raycast/api";
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchCurrentLocationMode, fetchLocationModes, switchLocationMode } from "./fetchDevices";
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
  const [availableModes, setAvailableModes] = useState<LocationMode[]>([]);

  const preferences = getPreferenceValues<Preferences>();
  const preferencesRef = useRef(preferences);
  const intervalRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(true);

  // Fetch all available modes
  const loadModes = useCallback(async () => {
    try {
      const modes = await fetchLocationModes();
      if (Array.isArray(modes)) {
        setAvailableModes(modes);
      }
    } catch (error) {
      console.error("Failed to load modes:", error);
    }
  }, []);

  const updateCurrentMode = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      const timestamp = new Date().toLocaleString();
      console.log("\n=== Background Refresh Details ===");
      console.log("Timestamp:", timestamp);
      console.log("Current Settings:");
      console.log("- Background Refresh:", preferencesRef.current.enableBackgroundRefresh ? "Enabled" : "Disabled");
      
      const modeData = await fetchCurrentLocationMode();
      console.log("API Response:", JSON.stringify(modeData, null, 2));
      
      if (modeData?.id) {
        const newMode = {
          id: modeData.id,
          name: modeData.label || modeData.name,
        };
        
        setCurrentMode(prev => {
          if (prev.id !== newMode.id || prev.name !== newMode.name) {
            console.log("\nMode Change Detected:", { prev, new: newMode });
            return newMode;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("\nError During Refresh:", error);
    }
  }, []);

  const handleModeSwitch = useCallback(async (mode: LocationMode) => {
    try {
      await switchLocationMode(mode.id);
      await updateCurrentMode();
      showToast({
        style: Toast.Style.Success,
        title: "Mode Changed",
        message: `Successfully switched to ${mode.name}`,
      });
    } catch (error) {
      console.error("Error switching mode:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to change mode",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [updateCurrentMode]);

  const handleManualRefresh = useCallback(async () => {
    console.log("\n=== Manual Refresh Triggered ===");
    await Promise.all([updateCurrentMode(), loadModes()]);
  }, [updateCurrentMode, loadModes]);

  const setupBackgroundRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    if (preferencesRef.current.enableBackgroundRefresh) {
      console.log("\n=== Setting up Background Refresh ===");
      
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
    
    // Initial load of both current mode and available modes
    updateCurrentMode();
    loadModes();
    setupBackgroundRefresh();

    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [preferences.enableBackgroundRefresh, setupBackgroundRefresh, updateCurrentMode, loadModes]);

  return (
    <MenuBarExtra
      icon="smartthings_white.png"
      title={currentMode.name}
      tooltip={`Current Home Mode${preferences.enableBackgroundRefresh ? ' (Auto-refresh: 10s)' : ''}`}
    >
      <MenuBarExtra.Section title="Switch Mode">
        {availableModes.map((mode) => (
          <MenuBarExtra.Item
            key={mode.id}
            title={mode.name}
            icon={{
              source: mode.id === currentMode.id ? Icon.CheckCircle : Icon.Circle,
              tintColor: mode.id === currentMode.id ? Color.Green : Color.SecondaryText,
            }}
            onAction={() => mode.id !== currentMode.id && handleModeSwitch(mode)}
          />
        ))}
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
} 