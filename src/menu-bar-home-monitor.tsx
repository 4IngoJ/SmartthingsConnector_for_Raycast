import { MenuBarExtra, getPreferenceValues, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { fetchCurrentLocationMode } from "./fetchDevices";
import { LocationMode } from "./types";

export default function Command() {
  const [currentMode, setCurrentMode] = useState<LocationMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateCurrentMode = async () => {
    try {
      const currentModeData = await fetchCurrentLocationMode();
      if (currentModeData) {
        setCurrentMode({
          id: currentModeData.id,
          name: currentModeData.label || currentModeData.name,
        });
      }
    } catch (error) {
      console.error("Error fetching current mode:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateCurrentMode();
  }, []);

  return (
    <MenuBarExtra
      icon={Icon.HomeDoor}
      title={currentMode?.name || "Loading..."}
      tooltip="Current Home Mode"
      isLoading={isLoading}
    >
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title={`Current Mode: ${currentMode?.name || "Unknown"}`}
          icon={Icon.House}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
} 