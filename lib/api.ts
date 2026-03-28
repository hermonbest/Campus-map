// API service for fetching buildings from web-admin
// The API URL should be configured via EXPO_PUBLIC_API_URL environment variable

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface Building {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  positionX: number; // percentage-based x (0-100)
  positionY: number; // percentage-based y (0-100)
  rectX?: number;
  rectY?: number;
  rectWidth?: number;
  rectHeight?: number;
  hours?: string;
  amenities?: string;
  imageUrl?: string;
  phone?: string;
  website?: string;
  floorCount?: number;
  wheelchairAccessible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  type: string;
  content: string;
  author: string;
  imageUrl?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  icon: string;
  description: string;
  hours?: string;
  amenities?: string;
  imageUrl?: string;
  phone?: string;
  website?: string;
  floorCount?: number;
  wheelchairAccessible: boolean;
  polygon?: { latitude: number; longitude: number }[];
}

// Map bounds for converting percentage-based positions to GPS coordinates
// These should match the overlay bounds in CampusMap.tsx
const MAP_BOUNDS = {
  southWest: { latitude: 9.03689, longitude: 38.83527 },
  northEast: { latitude: 9.04128, longitude: 38.84315 },
};

/**
 * Convert percentage-based position (0-100) to GPS coordinates
 */
function positionToCoordinates(positionX: number, positionY: number): { latitude: number; longitude: number } {
  // positionX: 0-100 (left to right)
  // positionY: 0-100 (top to bottom)
  const longitude = MAP_BOUNDS.southWest.longitude + (positionX / 100) * (MAP_BOUNDS.northEast.longitude - MAP_BOUNDS.southWest.longitude);
  const latitude = MAP_BOUNDS.northEast.latitude - (positionY / 100) * (MAP_BOUNDS.northEast.latitude - MAP_BOUNDS.southWest.latitude);
  
  return { latitude, longitude };
}

/**
 * Transform web-admin Building to mobile app LocationData
 */
function transformBuilding(building: Building): LocationData {
  const { latitude, longitude } = positionToCoordinates(building.positionX, building.positionY);
  
  let polygon: { latitude: number; longitude: number }[] | undefined = undefined;
  if (building.rectX !== undefined && building.rectY !== undefined && building.rectWidth !== undefined && building.rectHeight !== undefined && building.rectWidth > 0 && building.rectHeight > 0) {
    polygon = [
      positionToCoordinates(building.rectX, building.rectY),
      positionToCoordinates(building.rectX + building.rectWidth, building.rectY),
      positionToCoordinates(building.rectX + building.rectWidth, building.rectY + building.rectHeight),
      positionToCoordinates(building.rectX, building.rectY + building.rectHeight)
    ];
  }
  
  return {
    id: building.id,
    name: building.name,
    latitude,
    longitude,
    category: building.category,
    icon: building.icon,
    description: building.description,
    hours: building.hours,
    amenities: building.amenities,
    imageUrl: building.imageUrl,
    phone: building.phone,
    website: building.website,
    floorCount: building.floorCount,
    wheelchairAccessible: building.wheelchairAccessible,
    polygon,
  };
}

/**
 * Fetch all buildings from the web-admin API
 */
export async function fetchBuildings(): Promise<LocationData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/buildings`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch buildings: ${response.status} ${response.statusText}`);
    }
    
    const buildings: Building[] = await response.json();
    return buildings.map(transformBuilding);
  } catch (error) {
    console.error(`Error fetching buildings from ${API_BASE_URL}:`, error);
    throw new Error(`Network error fetching buildings from ${API_BASE_URL}. Verify your EXPO_PUBLIC_API_URL in .env.`);
  }
}

/**
 * Fetch a single building by ID
 */
export async function fetchBuildingById(id: string): Promise<LocationData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/buildings/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch building: ${response.status} ${response.statusText}`);
    }
    
    const building: Building = await response.json();
    return transformBuilding(building);
  } catch (error) {
    console.error(`Error fetching building ${id} from ${API_BASE_URL}:`, error);
    throw new Error(`Network error fetching building from ${API_BASE_URL}. Verify your EXPO_PUBLIC_API_URL in .env.`);
  }
}

/**
 * Fetch all notices from the web-admin API
 */
export async function fetchNotices(): Promise<Notice[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notices`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch notices: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching notices from ${API_BASE_URL}:`, error);
    throw new Error(`Network error fetching notices from ${API_BASE_URL}. Verify your EXPO_PUBLIC_API_URL in .env.`);
  }
}
