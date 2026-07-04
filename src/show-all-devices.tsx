import { Grid, showToast, Toast, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { fetchDevices } from "./lib/smartthings";
import { Device, DeviceCategory } from "./types";

const ICON_URLS = {
  switch: "https://api.iconify.design/material-symbols/switch.svg",
  light: "https://api.iconify.design/iconoir/light-bulb.svg",
  motionsensor: "https://api.iconify.design/cbi/motionsensor.svg",
  mobilepresence: "https://api.iconify.design/foundation/mobile-signal.svg",
  remotecontroller: "https://api.iconify.design/ri/remote-control-line.svg",
  fan: "https://api.iconify.design/mdi/fan.svg",
  speaker: "https://api.iconify.design/material-symbols/speaker.svg",
  door: "https://api.iconify.design/ph/door-bold.svg",
  contactsensor: "https://api.iconify.design/cbi/aqara-contact.svg",
  smartplug: "https://api.iconify.design/ic/outline-power.svg",
  hub: "https://api.iconify.design/solar/smart-home-bold.svg",
  temphumiditysensor: "https://api.iconify.design/tabler/temperature-sun.svg",
  other: "https://api.iconify.design/material-symbols-light/devices-other-rounded.svg",
};

const getIconUrl = (category: DeviceCategory, size = 1): string => {
  const lowerCategory = (category || "").toLowerCase() as keyof typeof ICON_URLS;
  const iconUrl = ICON_URLS[lowerCategory] || ICON_URLS.other;
  return `${iconUrl}?size=${size * 100}%`;
};

const getTimestamp = (device: Device): string => {
  return device.components?.[0]?.capabilities?.[0]?.timestamp || "";
};

const categorizeDevices = (devices: Device[]): Record<DeviceCategory, Device[]> => {
  const categorized: Record<DeviceCategory, Device[]> = {};

  devices.forEach((device) => {
    device.components?.forEach((component) => {
      component.categories?.forEach((category) => {
        if (!categorized[category.name]) {
          categorized[category.name] = [];
        }
        categorized[category.name].push(device);
      });
    });
  });

  return categorized;
};

export default function ShowAllDevices() {
  const [devices, setDevices] = useState<Record<DeviceCategory, Device[]>>({});
  const [filteredDevices, setFilteredDevices] = useState<Record<DeviceCategory, Device[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  useEffect(() => {
    async function loadDevices() {
      try {
        const devicesData = await fetchDevices();

        devicesData.sort((a, b) => getTimestamp(b).localeCompare(getTimestamp(a)));

        const categorizedDevices = categorizeDevices(devicesData);
        const sortedCategories = Object.keys(categorizedDevices).sort((categoryA, categoryB) => {
          const latestDeviceA = categorizedDevices[categoryA][0];
          const latestDeviceB = categorizedDevices[categoryB][0];
          if (!latestDeviceA || !latestDeviceB) return 0;
          return getTimestamp(latestDeviceB).localeCompare(getTimestamp(latestDeviceA));
        });

        const sortedDevices: Record<DeviceCategory, Device[]> = {};
        sortedCategories.forEach((category) => {
          sortedDevices[category] = categorizedDevices[category];
        });

        setDevices(sortedDevices);
        setFilteredDevices(sortedDevices);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch devices",
          message: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadDevices();
  }, []);

  const handleSearchTextChange = (text: string): void => {
    if (!text.trim()) {
      setFilteredDevices(devices);
      return;
    }

    const lowerText = text.trim().toLowerCase();
    const filtered: Record<DeviceCategory, Device[]> = {};

    Object.keys(devices).forEach((category) => {
      const filteredCategoryDevices = devices[category].filter(
        (device) =>
          device.label?.toLowerCase().includes(lowerText) ||
          device.components?.some((component) =>
            component.categories?.some((category) =>
              category.name.toLowerCase().includes(lowerText)
            )
          )
      );

      if (filteredCategoryDevices.length > 0) {
        filtered[category] = filteredCategoryDevices;
      }
    });

    setFilteredDevices(filtered);
  };

  const handleDeviceSelection = (deviceId: string): void => {
    const device = Object.values(devices)
      .flat()
      .find((device) => device.deviceId === deviceId);
    if (device) {
      push(<DeviceDetail device={device} />);
    }
  };

  return (
    <Grid
      isLoading={isLoading}
      searchBarPlaceholder="Search Devices and Groups"
      onSearchTextChange={handleSearchTextChange}
      aspectRatio="16/9"
      itemSize={Grid.ItemSize.Small}
    >
      {Object.entries(filteredDevices).map(([category, categoryDevices]) => (
        <Grid.Section key={category} title={category}>
          {categoryDevices.map((device) => (
            <Grid.Item
              key={device.deviceId}
              title={device.label || "Unnamed Device"}
              subtitle={device.deviceTypeName}
              content={{ source: getIconUrl(device.deviceTypeName || "default", 0.75) }}
              actions={
                <ActionPanel>
                  <Action
                    title="Show Details"
                    onAction={() => handleDeviceSelection(device.deviceId)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </Grid.Section>
      ))}
      {Object.keys(filteredDevices).length === 0 && !isLoading && (
        <Grid.Item
          title="No Devices Found"
          content={{ source: "https://api.iconify.design/material-symbols/lightbulb.svg" }}
          subtitle="No devices match your search."
        />
      )}
    </Grid>
  );
}

function DeviceDetail({ device }: { device: Device }) {
  return (
    <Grid>
      <Grid.Section>
        <Grid.Item
          title={device.label || "Unnamed Device"}
          subtitle={device.deviceTypeName}
          content={{ source: getIconUrl(device.deviceTypeName || "default", 0.75) }}
        />
      </Grid.Section>
    </Grid>
  );
}
