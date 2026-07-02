export type DeviceCategory = string;

export interface Device {
  deviceId: string;
  label: string;
  deviceTypeName: string;
  components?: Array<{
    categories?: Array<{ name: string }>;
    capabilities?: Array<{ timestamp: string }>;
  }>;
  id?: string;
  name?: string;
  roomId?: string;
  roomName?: string;
  status?: {
    switch?: {
      switch?: {
        value?: string;
        timestamp?: string;
      };
    };
    switchLevel?: {
      level?: {
        value?: number;
      };
    };
  };
}

export interface LocationMode {
  id: string;
  name: string;
  label?: string;
}

export interface Room {
  roomId: string;
  name: string;
}

export interface Scene {
  sceneId: string;
  sceneName: string;
  lastExecutedDate?: string;
}
