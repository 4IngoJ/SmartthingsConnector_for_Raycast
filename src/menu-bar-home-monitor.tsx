import { MenuBarExtra, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState, useCallback } from "react";
import { fetchCurrentLocationMode, fetchLocationModes, switchLocationMode } from "./fetchDevices";
import { LocationMode } from "./types";

export default function Command() {
  const [menuState, setMenuState] = useState({
    currentMode: { id: "", name: "Loading..." },
    availableModes: [] as LocationMode[],
  });

  const safeUpdateCurrentMode = useCallback(async () => {
    try {
      const modeData = await fetchCurrentLocationMode();
      if (modeData?.id && modeData?.name) {
        setMenuState(prev => ({
          ...prev,
          currentMode: {
            id: modeData.id,
            name: modeData.label || modeData.name,
          },
        }));
      }
    } catch (error) {
      console.error("Failed to update current mode:", error);
    }
  }, []);

  const safeLoadModes = useCallback(async () => {
    try {
      const modes = await fetchLocationModes();
      if (Array.isArray(modes)) {
        setMenuState(prev => ({
          ...prev,
          availableModes: modes,
        }));
      }
    } catch (error) {
      console.error("Failed to load modes:", error);
    }
  }, []);

  const safeHandleModeSwitch = useCallback(async (modeId: string) => {
    const previousState = menuState;
    const targetMode = menuState.availableModes.find(mode => mode.id === modeId);
    
    if (!targetMode) return;

    try {
      // Optimistic update
      setMenuState(prev => ({
        ...prev,
        currentMode: targetMode,
      }));

      await switchLocationMode(modeId);
      await safeUpdateCurrentMode();
      
      showToast({
        style: Toast.Style.Success,
        title: "Mode Changed",
      });
    } catch (error) {
      // Rollback on error
      setMenuState(previousState);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to change mode",
      });
    }
  }, [menuState]);

  // Initial load and refresh setup
  useEffect(() => {
    // Initial load
    safeUpdateCurrentMode();
    safeLoadModes();

    // Set up refresh interval
    const refreshInterval = setInterval(() => {
      safeUpdateCurrentMode();
      safeLoadModes();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [safeUpdateCurrentMode, safeLoadModes]);

  return (
    <MenuBarExtra
      icon="smartthings_white.png"
      title={menuState.currentMode.name}
      tooltip="Current Home Mode"
    >
      <MenuBarExtra.Section>
        {menuState.availableModes.map((mode) => (
          <MenuBarExtra.Item
            key={mode.id}
            title={mode.name}
            icon={mode.id === menuState.currentMode.id ? Icon.CheckCircle : Icon.Circle}
            onAction={() => safeHandleModeSwitch(mode.id)}
          />
        ))}
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
} 