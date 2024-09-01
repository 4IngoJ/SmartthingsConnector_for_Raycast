import { Grid, showToast, ToastStyle, ActionPanel, useNavigation, getPreferenceValues } from '@raycast/api';
import { useEffect, useState } from 'react';
import axios from 'axios';

const ICON_URLS = {
  switch: 'https://api.iconify.design/material-symbols/switch.svg',
  light: 'https://api.iconify.design/iconoir/light-bulb.svg',
  motionsensor: 'https://api.iconify.design/cbi/motionsensor.svg',
  mobilepresence: 'https://api.iconify.design/foundation/mobile-signal.svg',
  remotecontroller: 'https://api.iconify.design/ri/remote-control-line.svg',
  fan: 'https://api.iconify.design/mdi/fan.svg',
  speaker: 'https://api.iconify.design/material-symbols/speaker.svg',
  door: 'https://api.iconify.design/ph/door-bold.svg',
  contactsensor: 'https://api.iconify.design/cbi/aqara-contact.svg',
  smartplug: 'https://api.iconify.design/ic/outline-power.svg',
  hub: 'https://api.iconify.design/solar/smart-home-bold.svg',
  temphumiditysensor: 'https://api.iconify.design/tabler/temperature-sun.svg',
  other: 'https://api.iconify.design/material-symbols-light/devices-other-rounded.svg',
};

export default function ShowAllDevices() {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const { push } = useNavigation();

  useEffect(() => {
    async function fetchDevices() {
      try {
        const preferences = getPreferenceValues();
        const SMARTTHINGS_API_TOKEN = preferences.apiToken; // Retrieve the API token from preferences
        const SMARTTHINGS_LOCATION_ID = preferences.locationId; // Retrieve the location ID from preferences

        const response = await axios.get(`https://api.smartthings.com/v1/devices`, {
          headers: {
            Authorization: `Bearer ${SMARTTHINGS_API_TOKEN}`,
          },
        });

        const devicesData = response.data.items;

        // Sort devices by the last updated timestamp in descending order
        devicesData.sort((a, b) => {
          const aTimestamp = new Date(a.components[0].capabilities[0].timestamp).getTime();
          const bTimestamp = new Date(b.components[0].capabilities[0].timestamp).getTime();
          return bTimestamp - aTimestamp;
        });

        // Categorize devices into groups based on categories
        const categorizedDevices = categorizeDevices(devicesData);

        // Sort categories based on the latest update date of devices within each category
        const sortedCategories = Object.keys(categorizedDevices).sort((categoryA, categoryB) => {
          const latestDeviceA = categorizedDevices[categoryA][0];
          const latestDeviceB = categorizedDevices[categoryB][0];
          if (!latestDeviceA || !latestDeviceB) return 0;
          const timestampA = new Date(latestDeviceA.components[0].capabilities[0].timestamp).getTime();
          const timestampB = new Date(latestDeviceB.components[0].capabilities[0].timestamp).getTime();
          return timestampB - timestampA;
        });

        // Prepare sorted categorized devices
        const sortedDevices = {};
        sortedCategories.forEach(category => {
          sortedDevices[category] = categorizedDevices[category];
        });

        setDevices(sortedDevices);
        setFilteredDevices(sortedDevices);
        setIsLoading(false);
      } catch (error) {
        showToast(ToastStyle.Failure, 'Failed to fetch devices', error.message);
        setIsLoading(false);
      }
    }

    fetchDevices();
  }, []); // Empty dependency array ensures this effect runs only once after initial render

  // Function to categorize devices based on their categories
  const categorizeDevices = (devices) => {
    const categorized = {};

    devices.forEach(device => {
      device.components.forEach(component => {
        component.categories.forEach(category => {
          if (!categorized[category.name]) {
            categorized[category.name] = [];
          }
          categorized[category.name].push(device);
        });
      });
    });

    return categorized;
  };

  // Function to filter devices based on search text
  const filterDevices = (text) => {
    if (!text.trim()) {
      setFilteredDevices(devices);
      return;
    }

    const lowerText = text.trim().toLowerCase();
    const filtered = {};

    Object.keys(devices).forEach(category => {
      const filteredCategoryDevices = devices[category].filter(device =>
        (device.label && device.label.toLowerCase().includes(lowerText)) ||
        device.components.some(component =>
          component.categories.some(category => category.name.toLowerCase().includes(lowerText))
        )
      );

      if (filteredCategoryDevices.length > 0) {
        filtered[category] = filteredCategoryDevices;
      }
    });

    setFilteredDevices(filtered);
  };

  // Handler for search bar text change
  const handleSearchTextChange = (text) => {
    setSearchText(text);
    filterDevices(text);
  };

  // Function to handle device selection and navigation
  const handleDeviceSelection = (deviceId) => {
    const device = Object.values(devices).flat().find(device => device.deviceId === deviceId);
    if (device) {
      push(<DeviceDetail device={device} />);
    }
  };

  // Function to get icon URL based on category and size
  // Function to get icon URL based on category and size
  const getIconUrl = (category, size = 1) => {
    if (!category) {
      console.warn('Category is undefined or null');
      return ICON_URLS['other'];
    }

    const lowerCategory = category.toLowerCase();
    const iconUrl = ICON_URLS[lowerCategory] || ICON_URLS['other'];

    // Append query parameter to scale the image
    const scaledUrl = `${iconUrl}?size=${size * 100}%`;

    console.log(`Icon URL for category '${category}': ${scaledUrl}`);

    return scaledUrl;
  };

  return (
    <Grid
      isLoading={isLoading}
      searchBarPlaceholder="Search Devices and Groups"
      onSearchTextChange={handleSearchTextChange}
      aspectRatio="16/9"
      itemSize={Grid.ItemSize.Small}
    >
      {Object.keys(filteredDevices).map((category, index) => (
        <Grid.Section key={category} title={category}>
          {filteredDevices[category].map((device, idx) => (
            <Grid.Item
              key={`${device.deviceId}-${idx}`} // Ensure unique keys
              title={device.label || 'Unnamed Device'}
              subtitle={device.deviceTypeName}
              content={{ source: getIconUrl(category, 0.75) }} // Scale the icon to 75% of original size
              actions={
                <ActionPanel>
                  <ActionPanel.Item
                    title="Show Details"
                    onAction={() => handleDeviceSelection(device.deviceId)}
                  />
                </ActionPanel>
              }
              detail={<DetailComponent device={device} />} // Pass device to DetailComponent
            />
          ))}
        </Grid.Section>
      ))}
      {Object.keys(filteredDevices).length === 0 && !isLoading && (
        <Grid.Item
          title="No Devices Found"
          content={{ source: 'https://api.iconify.design/material-symbols/lightbulb.svg' }} // Custom icon URL for "No Devices Found"
          subtitle="No devices match your search."
        />
      )}
    </Grid>
  );
}

// Component for displaying device details
function DetailComponent({ device }) {
  return (
    <Grid.Item.Detail markdown={`### Device Details\n\n**Label:** ${device.label}\n\n**Device Type:** ${device.deviceTypeName}`} />
  );
}

// Component for rendering device detail view
function DeviceDetail({ device }) {
  return (
    <Grid>
      <Grid.Section>
        <Grid.Item
          title={device.label || 'Unnamed Device'}
          subtitle={device.deviceTypeName}
          detail={<DetailComponent device={device} />}
        />
      </Grid.Section>
    </Grid>
  );
}
