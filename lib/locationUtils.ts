/**
 * GPS to Map Coordinate Conversion Utilities
 * Converts real-world GPS coordinates to relative map coordinates (0-1)
 */

export interface GPSBounds {
  southWest: {
    latitude: number;
    longitude: number;
  };
  northEast: {
    latitude: number;
    longitude: number;
  };
}

// Campus GPS bounds (provided by user)
export const CAMPUS_BOUNDS: GPSBounds = {
  southWest: {
    latitude: 9.03689,
    longitude: 38.83527,
  },
  northEast: {
    latitude: 9.04128,
    longitude: 38.84315,
  },
};

/**
 * Convert GPS coordinates to map position (percentage 0-1)
 * @param latitude - GPS latitude
 * @param longitude - GPS longitude
 * @param bounds - Campus GPS bounds
 * @returns Map position as {x, y} where both are in [0, 1]
 */
export function gpsToMapPosition(
  latitude: number,
  longitude: number,
  bounds: GPSBounds = CAMPUS_BOUNDS
): { x: number; y: number } {
  // Calculate longitude to x percentage (left to right)
  const x = (longitude - bounds.southWest.longitude) / (bounds.northEast.longitude - bounds.southWest.longitude);
  
  // Calculate latitude to y percentage (top to bottom - note: latitude decreases as you go south)
  const y = (bounds.northEast.latitude - latitude) / (bounds.northEast.latitude - bounds.southWest.latitude);
  
  // Clamp values to [0, 1] to handle edge cases
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/**
 * Check if GPS coordinates are within campus bounds
 * @param latitude - GPS latitude
 * @param longitude - GPS longitude
 * @param bounds - Campus GPS bounds
 * @returns true if coordinates are within bounds
 */
export function isWithinCampusBounds(
  latitude: number,
  longitude: number,
  bounds: GPSBounds = CAMPUS_BOUNDS
): boolean {
  return (
    latitude >= bounds.southWest.latitude &&
    latitude <= bounds.northEast.latitude &&
    longitude >= bounds.southWest.longitude &&
    longitude <= bounds.northEast.longitude
  );
}

/**
 * Find the closest navigation node to a given map position
 * @param x - Map x position (0-1)
 * @param y - Map y position (0-1)
 * @param nodes - Array of navigation nodes with x_pos and y_pos
 * @returns The closest node or null if no nodes available
 */
export function findClosestNode(
  x: number,
  y: number,
  nodes: Array<{ id: string; x_pos: number; y_pos: number }>
): { id: string; x_pos: number; y_pos: number } | null {
  if (!nodes || nodes.length === 0) {
    return null;
  }

  let closestNode = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    const dx = x - Number(node.x_pos);
    const dy = y - Number(node.y_pos);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestNode = node;
    }
  }

  return closestNode;
}
