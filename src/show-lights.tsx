import { List, showToast, Toast, ActionPanel, Action, Icon, Color } from "@raycast/api";
import { useEffect, useState, useCallback } from "react";
import { fetchDevices, fetchRooms, toggleLight, setLightLevel } from "./lib/smartthings";
import { Device } from "./types";

const BRIGHTNESS_LEVELS = [100, 75, 50, 25, 10];

export default function Command() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [roomsData, devicesData] = await Promise.all([fetchRooms(), fetchDevices()]);

      const roomsMap = roomsData.reduce((acc: { [key: string]: string }, room) => {
        acc[room.roomId] = room.name;
        return acc;
      }, {});
      setRooms(roomsMap);

      const lightDevices = devicesData.filter(
        (device) =>
          !!device.roomId &&
          device.components?.some((component) =>
            component.categories?.some((category) => category.name === "Light")
          )
      );

      setDevices(lightDevices);
      setFilteredDevices(lightDevices);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch data",
        message: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchText === "") {
      setFilteredDevices(devices);
    } else {
      const filtered = devices.filter(
        (device) =>
          device.label.toLowerCase().includes(searchText.toLowerCase()) ||
          (device.roomId && rooms[device.roomId]?.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredDevices(filtered);
    }
  }, [searchText, devices, rooms]);

  const getStatusIcon = useCallback((device: Device) => {
    if (device.status?.switch?.switch?.value === "on") {
      return { source: Icon.LightBulb, tintColor: Color.Green };
    }
    return { source: Icon.LightBulb };
  }, []);

  const handleToggleLight = useCallback(async (device: Device) => {
    const currentStatus = device.status?.switch?.switch?.value;
    if (!currentStatus) return;

    try {
      const newStatus = await toggleLight(device.deviceId, currentStatus);
      setDevices((prevDevices) =>
        prevDevices.map((d) =>
          d.deviceId === device.deviceId
            ? {
                ...d,
                status: {
                  ...d.status,
                  switch: {
                    ...d.status?.switch,
                    switch: { ...d.status?.switch?.switch, value: newStatus },
                  },
                },
              }
            : d
        )
      );
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Fehler beim Umschalten des Lichts",
        message: (error as Error).message,
      });
    }
  }, []);

  const handleBrightnessChange = useCallback(async (device: Device, level: number) => {
    try {
      await setLightLevel(device.deviceId, level);
      setDevices((prevDevices) =>
        prevDevices.map((d) =>
          d.deviceId === device.deviceId
            ? {
                ...d,
                status: {
                  switch: { switch: { value: "on" } },
                  switchLevel: { level: { value: level } },
                },
              }
            : d
        )
      );
      await showToast({ style: Toast.Style.Success, title: `Brightness set to ${level}%` });
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to set brightness",
        message: (error as Error).message,
      });
    }
  }, []);

  const getDetailMarkdown = useCallback((device: Device) => {
    const switchStatus = device.status?.switch?.switch?.value || "unknown";
    const timestamp = device.status?.switch?.switch?.timestamp || "N/A";
    const level = device.status?.switchLevel?.level?.value;
    const levelPercentage = level !== undefined ? `${level}%` : "N/A";

    return `## Device Status\n
---
**Switch State:** ${switchStatus}\n
**Light Level:** ${levelPercentage}\n
**Last Updated:** ${timestamp}`;
  }, []);

  const isDimmable = (device: Device): boolean => {
    return device.status?.switchLevel !== undefined;
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search by device name or room"
      onSearchTextChange={setSearchText}
      isShowingDetail
    >
      {filteredDevices.map((device) => (
        <List.Item
          key={device.deviceId}
          title={device.label}
          subtitle={(device.roomId && rooms[device.roomId]) || "Unknown Room"}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action
                  title="Toggle Light"
                  icon={Icon.Power}
                  onAction={() => handleToggleLight(device)}
                />
                {isDimmable(device) && (
                  <ActionPanel.Submenu
                    title="Set Brightness"
                    icon={Icon.LightBulb}
                    shortcut={{ modifiers: ["cmd"], key: "b" }}
                  >
                    {BRIGHTNESS_LEVELS.map((level) => (
                      <Action
                        key={level}
                        title={`${level}% Brightness`}
                        onAction={() => handleBrightnessChange(device, level)}
                      />
                    ))}
                  </ActionPanel.Submenu>
                )}
              </ActionPanel.Section>
              <ActionPanel.Section>
                <Action.CopyToClipboard
                  title="Copy Device Info"
                  content={JSON.stringify(device, null, 2)}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
          detail={<List.Item.Detail markdown={getDetailMarkdown(device)} />}
          accessories={[{ icon: getStatusIcon(device) }]}
        />
      ))}
    </List>
  );
}
