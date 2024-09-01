import { List, showToast, ToastStyle, ActionPanel, Icon, useNavigation, Action } from '@raycast/api';
import { useEffect, useState } from 'react';
import { fetchCurrentLocationMode, fetchLocationId, fetchLocationModes, switchLocationMode } from './fetchDevices';

export default function ShowLocationMode() {
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [modes, setModes] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const locId = await fetchLocationId();
        setLocationId(locId);

        if (!locId) {
          showToast(ToastStyle.Failure, "No location found");
          setIsLoading(false);
          return;
        }

        const currentModeData = await fetchCurrentLocationMode(locId);
        if (currentModeData && currentModeData.mode && currentModeData.mode.name) {
          setCurrentMode(currentModeData.mode.name); // Set current mode name
        } else {
          showToast(ToastStyle.Failure, "Current mode name not available");
        }

        const availableModes = await fetchLocationModes(locId);
        setModes(availableModes.map(mode => mode.name));
        setIsLoading(false);
      } catch (error) {
        showToast(ToastStyle.Failure, "Failed to fetch data", error.message);
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const { push } = useNavigation();

  const handleSwitchMode = async (newModeName: string) => {
    try {
      if (!locationId) return;

      const modes = await fetchLocationModes(locationId);
      const newMode = modes.find(mode => mode.name.toLowerCase() === newModeName.toLowerCase());
      if (newMode) {
        await switchLocationMode(locationId, newMode.id);
        const updatedMode = await fetchCurrentLocationMode(locationId);
        if (updatedMode && updatedMode.mode && updatedMode.mode.name) {
          setCurrentMode(updatedMode.mode.name); // Update currentMode state
        } else {
          showToast(ToastStyle.Failure, "Updated mode name not available");
        }
        showToast(ToastStyle.Success, "Location mode changed successfully");
      } else {
        showToast(ToastStyle.Failure, "Invalid mode name");
      }
    } catch (error) {
      showToast(ToastStyle.Failure, "Failed to change location mode", error.message);
    }
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Current Location Mode">
      {modes.length > 0 && (
        <>
          {modes.map((mode, index) => (
            <List.Item
              key={index}
              title={mode}
              accessoryIcon={mode === currentMode ? Icon.Checkmark : undefined}
              actions={
                mode === currentMode ? (
                  <ActionPanel>
                    <Action
                      title="Current Mode"
                      icon={Icon.Checkmark}
                      disabled
                    />
                  </ActionPanel>
                ) : (
                  <ActionPanel>
                    <Action
                      title="Switch Location Mode"
                      onAction={() => handleSwitchMode(mode)}
                    />
                  </ActionPanel>
                )
              }
            />
          ))}
        </>
      )}
      {!isLoading && modes.length === 0 && (
        <List.EmptyView
          title="No Location Modes"
          description="No location modes found for this location."
        />
      )}
    </List>
  );
}
