import { List, showToast, Toast, ActionPanel, Action } from "@raycast/api";
import { useEffect, useState } from "react";
import { fetchRooms, fetchDevicesInRoom } from "./lib/smartthings";
import { Device, Room } from "./types";

export default function ShowRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const roomsData = await fetchRooms();
        setRooms(roomsData);

        const devicePromises = roomsData.map((room) => fetchDevicesInRoom(room.roomId));
        const devicesData = await Promise.all(devicePromises);
        setDevices(devicesData.flat());
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch data",
          message: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search by room name..."
      onSearchTextChange={setSearchText}
      isShowingDetail
    >
      {rooms
        .filter((room) => room.name.toLowerCase().includes(searchText.toLowerCase()))
        .map((room) => {
          const roomDevices = devices.filter((device) => device.roomId === room.roomId);
          return (
            <List.Item
              key={room.roomId}
              id={room.roomId}
              title={room.name}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Room Info"
                    content={JSON.stringify(room, null, 2)}
                  />
                </ActionPanel>
              }
              detail={
                <List.Item.Detail
                  markdown={
                    roomDevices.length > 0
                      ? `### Devices in ${room.name}\n${roomDevices
                          .map((device) => `- ${device.label}`)
                          .join("\n")}`
                      : "No devices found"
                  }
                />
              }
              accessories={[{ text: `${roomDevices.length} Devices` }]}
            />
          );
        })}
    </List>
  );
}
