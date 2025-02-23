import {
  List,
  showToast,
  Toast,
  ActionPanel,
  Icon,
  Action,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
  fetchCurrentLocationMode,
  fetchLocationModes,
  switchLocationMode,
} from "./fetchDevices";
import { LocationMode } from "./types";

export default function ShowLocationMode() {
  const [currentMode, setCurrentMode] = useState<LocationMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modes, setModes] = useState<LocationMode[]>([]);

  // Function to fetch and update current mode
  const updateCurrentMode = async () => {
    try {
      const currentModeData = await fetchCurrentLocationMode();
      if (currentModeData?.mode) {
        setCurrentMode({
          id: currentModeData.mode.id,
          name: currentModeData.mode.name,
        });
      }
    } catch (error) {
      console.error("Error fetching current mode:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch current mode",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Initial data fetch
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch available modes
        const availableModes = await fetchLocationModes();
        if (Array.isArray(availableModes)) {
          setModes(availableModes);
        }

        // Fetch current mode
        await updateCurrentMode();
      } catch (error) {
        console.error("Error in fetchData:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch data",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSwitchMode = async (mode: LocationMode) => {
    try {
      setIsLoading(true);
      await switchLocationMode(mode.id);
      await updateCurrentMode(); // Fetch the updated mode after switching
      
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search location modes...">
      {modes.map((mode) => (
        <List.Item
          key={mode.id}
          title={mode.name}
          icon={
            currentMode?.id === mode.id
              ? { source: Icon.CheckCircle }
              : { source: Icon.Circle }
          }
          actions={
            <ActionPanel>
              {currentMode?.id !== mode.id && (
                <Action
                  title={`Switch to ${mode.name}`}
                  onAction={() => handleSwitchMode(mode)}
                  icon={Icon.Switch}
                />
              )}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
