import axios from 'axios';
import { getPreferenceValues } from '@raycast/api';

const SMARTTHINGS_API_URL = 'https://api.smartthings.com/v1';
const preferences = getPreferenceValues();
const SMARTTHINGS_API_TOKEN = preferences.apiToken; // Retrieve the API token from preferences
const SMARTTHINGS_LOCATION_ID = preferences.locationId; // Retrieve the location ID from preferences

export async function fetchRooms() {
  try {
    const response = await axios.get(`${SMARTTHINGS_API_URL}/locations/${SMARTTHINGS_LOCATION_ID}/rooms`, {
      headers: {
        'Authorization': `Bearer ${SMARTTHINGS_API_TOKEN}`
      }
    });
    console.log('Rooms payload:', response.data);
    return response.data.items;
  } catch (error) {
    console.error('Failed to fetch rooms:', error.message);
    throw error;
  }
}

export async function fetchDevicesInRoom(roomId) {
  try {
    const response = await axios.get(`${SMARTTHINGS_API_URL}/devices`, {
      headers: {
        'Authorization': `Bearer ${SMARTTHINGS_API_TOKEN}`
      }
    });
    const devices = response.data.items.filter(device => device.roomId === roomId);
    return devices;
  } catch (error) {
    console.error('Failed to fetch devices:', error.message);
    throw error;
  }
}