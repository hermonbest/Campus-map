// The API URL should be configured via EXPO_PUBLIC_API_URL environment variable
import { getFromCache, saveToCache } from './cache';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface Office {
  id: string;
  name: string;
  floor: string;
  description: string | null;
  buildingId: string;
  createdAt: string;
  updatedAt: string;
}

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
  offices?: Office[];
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
  offices?: Office[];
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'building' | 'office';
  category: string;
  icon: string;
  description: string;
  buildingId: string;
  floor?: string;
}

export const BUILDINGS_CACHE_KEY = 'buildings-data';
export const NOTICES_CACHE_KEY = 'notices-data';

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
    offices: building.offices,
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
    const formattedBuildings = buildings.map(transformBuilding);
    
    // Save to cache in the background
    saveToCache(BUILDINGS_CACHE_KEY, formattedBuildings).catch(err => 
      console.warn('Failed to cache buildings:', err)
    );
    
    return formattedBuildings;
  } catch (error) {
    throw error;
  }
}

/**
 * Get buildings from cache
 */
export async function getCachedBuildings(): Promise<LocationData[] | null> {
  return await getFromCache<LocationData[]>(BUILDINGS_CACHE_KEY);
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
    throw error;
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
    
    const notices: Notice[] = await response.json();
    
    // Save to cache in the background
    saveToCache(NOTICES_CACHE_KEY, notices).catch(err => 
      console.warn('Failed to cache notices:', err)
    );
    
    return notices;
  } catch (error) {
    throw error;
  }
}

/**
 * Get notices from cache
 */
export async function getCachedNotices(): Promise<Notice[] | null> {
  return await getFromCache<Notice[]>(NOTICES_CACHE_KEY);
}

/**
 * Perform a global search on the web-admin API
 */
export async function searchCampus(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to perform search: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}
