// Direct Supabase data fetching for Campus Map Mobile App
import { getFromCache, saveToCache } from './cache';
import { supabase } from './supabase';

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
export const OFFICES_CACHE_KEY = 'offices-data';

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
 * Transform database Building to mobile app LocationData
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
 * Fetch all buildings from Supabase
 */
export async function fetchBuildings(): Promise<LocationData[]> {
  try {
    const { data: buildings, error } = await supabase
      .from('Building')
      .select(`
        *,
        offices:Office(*)
      `)
      .order('createdAt', { ascending: false })
      .order('name', { foreignTable: 'Office', ascending: true });
    
    if (error) {
      throw new Error(`Failed to fetch buildings: ${error.message}`);
    }
    
    const formattedBuildings = (buildings || []).map(transformBuilding);
    
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
 * Fetch a single building by ID from Supabase
 */
export async function fetchBuildingById(id: string): Promise<LocationData | null> {
  try {
    const { data: building, error } = await supabase
      .from('Building')
      .select(`
        *,
        offices:Office(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch building: ${error.message}`);
    }
    
    return transformBuilding(building);
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch all notices from Supabase
 */
export async function fetchNotices(): Promise<Notice[]> {
  try {
    const { data: notices, error } = await supabase
      .from('Notice')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch notices: ${error.message}`);
    }
    
    const formattedNotices = (notices || []).map(notice => ({
      ...notice,
      date: notice.date || notice.createdAt,
    }));
    
    // Save to cache in the background
    saveToCache(NOTICES_CACHE_KEY, formattedNotices).catch(err => 
      console.warn('Failed to cache notices:', err)
    );
    
    return formattedNotices;
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
 * Get offices from cache
 */
export async function getCachedOffices(): Promise<Office[] | null> {
  return await getFromCache<Office[]>(OFFICES_CACHE_KEY);
}

/**
 * Extract all offices from buildings data
 */
export function extractOfficesFromBuildings(buildings: LocationData[]): Office[] {
  const offices: Office[] = [];
  buildings.forEach(building => {
    if (building.offices) {
      offices.push(...building.offices);
    }
  });
  return offices;
}

/**
 * Perform offline search on cached data
 */
export async function offlineSearch(query: string): Promise<SearchResult[]> {
  try {
    // Require minimum 2 characters for search
    if (query.trim().length < 2) {
      return [];
    }
    
    console.log('Starting offline search for:', query);
    const buildings = await getCachedBuildings();
    const offices = await getCachedOffices();
    const results: SearchResult[] = [];
    
    const searchLower = query.toLowerCase();
    
    console.log('Found cached data:', {
      buildingsCount: buildings?.length || 0,
      officesCount: offices?.length || 0
    });
    
    if (buildings) {
      const matchingBuildings = buildings.filter(building => {
        const nameLower = building.name.toLowerCase();
        const descLower = building.description?.toLowerCase() || '';
        const catLower = building.category.toLowerCase();
        
        // Check if query matches start of word or is contained in name/description
        const nameMatch = nameLower.includes(searchLower);
        const descMatch = descLower.includes(searchLower);
        const catMatch = catLower.includes(searchLower);
        
        return nameMatch || descMatch || catMatch;
      });
      
      console.log(`Found ${matchingBuildings.length} matching buildings`);
      
      matchingBuildings.forEach(building => {
        results.push({
          id: building.id,
          name: building.name,
          type: 'building',
          category: building.category,
          icon: building.icon,
          description: building.description,
          buildingId: building.id
        });
      });
    }
    
    if (offices) {
      const matchingOffices = offices.filter(office => {
        const nameLower = office.name.toLowerCase();
        const descLower = office.description?.toLowerCase() || '';
        
        return nameLower.includes(searchLower) || descLower.includes(searchLower);
      });
      
      console.log(`Found ${matchingOffices.length} matching offices`);
      
      matchingOffices.forEach(office => {
        results.push({
          id: office.id,
          name: office.name,
          type: 'office',
          category: 'office',
          icon: '🏢',
          description: office.description || '',
          buildingId: office.buildingId,
          floor: office.floor
        });
      });
    }
    
    console.log(`Returning ${results.length} total search results`);
    return results;
  } catch (error) {
    console.error('Offline search failed:', error);
    return [];
  }
}

/**
 * Perform a global search using Supabase
 */
export async function searchCampus(query: string): Promise<SearchResult[]> {
  try {
    // Search buildings
    const { data: buildings, error: buildingsError } = await supabase
      .from('Building')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
    
    if (buildingsError) {
      throw new Error(`Failed to search buildings: ${buildingsError.message}`);
    }
    
    // Search offices
    const { data: offices, error: officesError } = await supabase
      .from('Office')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    
    if (officesError) {
      throw new Error(`Failed to search offices: ${officesError.message}`);
    }
    
    const results: SearchResult[] = [];
    
    // Add building results
    (buildings || []).forEach(building => {
      results.push({
        id: building.id,
        name: building.name,
        type: 'building',
        category: building.category,
        icon: building.icon,
        description: building.description,
        buildingId: building.id
      });
    });
    
    // Add office results
    (offices || []).forEach(office => {
      results.push({
        id: office.id,
        name: office.name,
        type: 'office',
        category: 'office',
        icon: '🏢',
        description: office.description || '',
        buildingId: office.buildingId,
        floor: office.floor
      });
    });
    
    return results;
  } catch (error) {
    throw error;
  }
}
