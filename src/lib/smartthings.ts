import axios from "axios";
import { OAuth, getPreferenceValues } from "@raycast/api";
import type { Device, LocationMode, Room, Scene } from "../types";

type MainComponentStatus = NonNullable<Device["status"]>;

const SMARTTHINGS_API_URL = "https://api.smartthings.com/v1";
const AUTHORIZE_URL = "https://api.smartthings.com/oauth/authorize";
const TOKEN_URL = "https://api.smartthings.com/oauth/token";

// SmartThings requires these exact scopes to read/control devices, rooms,
// scenes, and to read/switch the location mode.
const SCOPES = "r:devices:* x:devices:* r:locations:* w:locations:* r:scenes:* x:scenes:*";

interface SmartThingsPreferences {
  clientId: string;
  clientSecret: string;
  locationId: string;
}

function getPreferences(): SmartThingsPreferences {
  return getPreferenceValues<SmartThingsPreferences>();
}

const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "SmartThings",
  providerIcon: "smartthings_white.png",
  providerId: "smartthings",
  description: "Connect your Samsung SmartThings account to control your devices.",
});

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function fetchTokens(authRequest: OAuth.AuthorizationRequest, authCode: string) {
  const { clientId, clientSecret } = getPreferences();

  const response = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: authRequest.redirectURI,
      code: authCode,
      code_verifier: authRequest.codeVerifier,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(clientId, clientSecret),
      },
    }
  );

  return response.data;
}

async function refreshTokens(refreshToken: string) {
  const { clientId, clientSecret } = getPreferences();

  const response = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: refreshToken,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(clientId, clientSecret),
      },
    }
  );

  return response.data;
}

/**
 * Ensures a valid SmartThings access token, running the interactive OAuth
 * consent flow only if there is no stored token yet or the refresh token
 * itself was rejected. SmartThings access tokens expire after 24h, so this
 * silently refreshes on every command run instead of relying on a static PAT.
 */
export async function authorize(): Promise<string> {
  const tokenSet = await client.getTokens();

  if (tokenSet?.accessToken) {
    if (!tokenSet.refreshToken || !tokenSet.isExpired()) {
      return tokenSet.accessToken;
    }
    try {
      const tokens = await refreshTokens(tokenSet.refreshToken);
      await client.setTokens(tokens);
      return tokens.access_token;
    } catch {
      // Refresh token is no longer valid, fall through to a fresh login.
    }
  }

  const authRequest = await client.authorizationRequest({
    endpoint: AUTHORIZE_URL,
    clientId: getPreferences().clientId,
    scope: SCOPES,
  });
  const { authorizationCode } = await client.authorize(authRequest);
  const tokens = await fetchTokens(authRequest, authorizationCode);
  await client.setTokens(tokens);
  return tokens.access_token;
}

const api = axios.create({ baseURL: SMARTTHINGS_API_URL });

api.interceptors.request.use(async (config) => {
  const token = await authorize();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, async (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    await client.removeTokens();
  }
  return Promise.reject(error);
});

async function fetchAllDeviceDetails(): Promise<Device[]> {
  const response = await api.get("/devices");
  return response.data.items;
}

async function fetchDeviceStatuses(deviceIds: string[]): Promise<{
  [key: string]: { components: { main: MainComponentStatus }; roomName: string };
}> {
  const responses = await Promise.all(deviceIds.map((id) => api.get(`/devices/${id}/status`)));
  return responses.reduce(
    (
      acc: { [key: string]: { components: { main: MainComponentStatus }; roomName: string } },
      res,
      index
    ) => {
      acc[deviceIds[index]] = res.data;
      return acc;
    },
    {}
  );
}

export async function fetchDevices(): Promise<Device[]> {
  const devices = await fetchAllDeviceDetails();
  const deviceIds = devices.map((device) => device.deviceId);
  const statuses = await fetchDeviceStatuses(deviceIds);

  return devices.map((device) => ({
    ...device,
    status: statuses[device.deviceId]?.components.main,
    roomName: statuses[device.deviceId]?.roomName,
    deviceType: device.deviceTypeName,
  }));
}

export async function fetchDevicesInRoom(roomId: string): Promise<Device[]> {
  const response = await api.get("/devices", { params: { roomId } });
  return response.data.items;
}

export async function fetchLocationModes(): Promise<LocationMode[]> {
  const { locationId } = getPreferences();
  const response = await api.get(`/locations/${locationId}/modes`);
  return response.data.items;
}

export async function fetchCurrentLocationMode(): Promise<LocationMode> {
  const { locationId } = getPreferences();
  const response = await api.get(`/locations/${locationId}/modes/current`);
  return response.data;
}

export async function switchLocationMode(modeId: string) {
  const { locationId } = getPreferences();
  const response = await api.put(`/locations/${locationId}/modes/current`, { modeId });
  return response.data;
}

export async function fetchRooms(): Promise<Room[]> {
  const { locationId } = getPreferences();
  const response = await api.get(`/locations/${locationId}/rooms`);
  return response.data.items;
}

export async function fetchScenes(): Promise<Scene[]> {
  const { locationId } = getPreferences();
  const response = await api.get("/scenes", { params: { locationId } });
  return response.data.items;
}

export async function executeScene(sceneId: string) {
  const response = await api.post(`/scenes/${sceneId}/execute`);
  return response.data;
}

export async function toggleLight(deviceId: string, currentStatus: string): Promise<string> {
  const newStatus = currentStatus === "on" ? "off" : "on";
  await api.post(`/devices/${deviceId}/commands`, {
    commands: [{ component: "main", capability: "switch", command: newStatus }],
  });
  return newStatus;
}

export async function setLightLevel(deviceId: string, level: number) {
  await api.post(`/devices/${deviceId}/commands`, {
    commands: [
      { component: "main", capability: "switchLevel", command: "setLevel", arguments: [level] },
    ],
  });
}
