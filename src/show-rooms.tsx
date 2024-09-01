import { List, showToast, ToastStyle, ActionPanel, CopyToClipboardAction } from '@raycast/api';
import { useEffect, useState } from 'react';
import { fetchRooms, fetchDevicesInRoom } from './fetchRooms';

export default function ShowRooms() {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const roomsData = await fetchRooms();
        setRooms(roomsData);

        // Fetch devices for all rooms
        const devicePromises = roomsData.map(room => fetchDevicesInRoom(room.roomId));
        const devicesData = await Promise.all(devicePromises);
        setDevices(devicesData.flat()); // Flatten the array of arrays
        setIsLoading(false);
      } catch (error) {
        showToast(ToastStyle.Failure, "Failed to fetch data", error.message);
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
      {rooms.filter(room => room.name.toLowerCase().includes(searchText.toLowerCase())).map(room => (
        <List.Item
          key={room.roomId}
          id={room.roomId}
          title={room.name}
          actions={
            <ActionPanel>
              <CopyToClipboardAction title="Copy Room Info" content={JSON.stringify(room, null, 2)} />
            </ActionPanel>
          }
          detail={
            <List.Item.Detail
              markdown={
                devices.length > 0
                  ? `### Devices in ${room.name}\n${devices.filter(device => device.roomId === room.roomId).map(device => `- ${device.label}`).join('\n')}`
                  : 'No devices found'
              }
            />
          }
          accessoryTitle={`${devices.filter(device => device.roomId === room.roomId).length} Devices`}
        />
      ))}
    </List>
  );
}
