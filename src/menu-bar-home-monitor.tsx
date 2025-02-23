import { MenuBarExtra, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { fetchCurrentLocationMode, fetchLocationModes, switchLocationMode } from "./fetchDevices";
import { LocationMode } from "./types";

export default function Command() {
  const [currentMode, setCurrentMode] = useState<LocationMode | null>(null);
  const [availableModes, setAvailableModes] = useState<LocationMode[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  const updateCurrentMode = async () => {
    let newModeData;
    try {
      newModeData = await fetchCurrentLocationMode();
      if (newModeData) {
        setCurrentMode({
          id: newModeData.id,
          name: newModeData.label || newModeData.name,
        });
      }
    } catch (error) {
      console.error("Error fetching current mode:", error);
    }
    return newModeData;
  };

  const loadModes = async () => {
    try {
      const modes = await fetchLocationModes();
      setAvailableModes(modes);
    } catch (error) {
      console.error("Error fetching modes:", error);
      if (!hasInitialized) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch modes",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };

  const handleModeSwitch = async (modeId: string) => {
    const previousMode = currentMode;
    try {
      // Optimistically update UI
      const newMode = availableModes.find(mode => mode.id === modeId);
      if (newMode) {
        setCurrentMode(newMode);
      }

      await switchLocationMode(modeId);
      const updatedMode = await updateCurrentMode();
      
      if (updatedMode) {
        showToast({
          style: Toast.Style.Success,
          title: "Mode Changed",
        });
      }
    } catch (error) {
      // Revert on error
      setCurrentMode(previousMode);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to change mode",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const refreshData = async () => {
    const modePromise = updateCurrentMode();
    const modesPromise = loadModes();
    await Promise.all([modePromise, modesPromise]);
  };

  useEffect(() => {
    const initialize = async () => {
      await refreshData();
      setHasInitialized(true);
    };

    initialize();
    
    const refreshInterval = setInterval(refreshData, 10000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Don't render anything until first load is complete
  if (!hasInitialized) {
    return (
      <MenuBarExtra
        icon="smartthings_white.png"
        title="Initializing..."
        tooltip="Current Home Mode"
      />
    );
  }

  return (
    <MenuBarExtra
      icon="smartthings_white.png"
      title={currentMode?.name || "Unknown"}
      tooltip="Current Home Mode"
    >
      <MenuBarExtra.Section>
        {availableModes.map((mode) => (
          <MenuBarExtra.Item
            key={mode.id}
            title={mode.name}
            icon={mode.id === currentMode?.id ? Icon.CheckCircle : Icon.Circle}
            onAction={() => handleModeSwitch(mode.id)}
          />
        ))}
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
} 