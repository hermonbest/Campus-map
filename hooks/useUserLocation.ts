/**
 * Real-time location tracking hook
 * Uses expo-location to track user's GPS position and convert to map coordinates
 */

import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { gpsToMapPosition, isWithinCampusBounds, findClosestNode } from '../lib/locationUtils';

/**
 * Find the closest point on a line segment to a given point
 * @param px - Point x
 * @param py - Point y
 * @param x1 - Line segment start x
 * @param y1 - Line segment start y
 * @param x2 - Line segment end x
 * @param y2 - Line segment end y
 * @returns Closest point on the segment {x, y}
 */
function closestPointOnSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): { x: number; y: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) {
    return { x: x1, y: y1 };
  }
  
  // Project point onto line, clamped to segment
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  
  return {
    x: x1 + t * dx,
    y: y1 + t * dy,
  };
}

/**
 * Find the closest point on a polyline (path) to a given point
 * @param px - Point x
 * @param py - Point y
 * @param pathPoints - Array of path points {x, y}
 * @returns Closest point on the path {x, y}
 */
function closestPointOnPath(px: number, py: number, pathPoints: Array<{ x: number; y: number }>): { x: number; y: number } | null {
  if (!pathPoints || pathPoints.length < 2) {
    return null;
  }
  
  let closestPoint = pathPoints[0];
  let minDistance = Infinity;
  
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const segmentClosest = closestPointOnSegment(px, py, pathPoints[i].x, pathPoints[i].y, pathPoints[i + 1].x, pathPoints[i + 1].y);
    const dx = px - segmentClosest.x;
    const dy = py - segmentClosest.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = segmentClosest;
    }
  }
  
  return closestPoint;
}

export interface UserLocation {
  x: number; // Map x position (0-1)
  y: number; // Map y position (0-1)
  latitude: number; // GPS latitude
  longitude: number; // GPS longitude
  accuracy: number | null; // GPS accuracy in meters
  closestNodeId?: string; // ID of the closest navigation node
}

export interface LocationError {
  message: string;
  code?: string;
}

export function useUserLocation(enabled: boolean = true, nodes?: Array<{ id: string; x_pos: number; y_pos: number }>, isOnRoute: boolean = false, pathNodeIds?: string[]) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const previousPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const smoothingFactor = 0.25; // Increased from 0.1 for better responsiveness
  const maxJumpDistance = 0.05; // Maximum allowed jump in map coordinates (0-1)
  const minUpdateInterval = 500; // Minimum time between location updates in milliseconds
  const initialUpdatesToSkipSmoothing = 3; // Reduced from 5 to get accurate position faster
  const maxAccuracyThreshold = 60; // Slightly increased to allow indoor readings which are often less accurate

  useEffect(() => {
    if (!enabled) {
      // Cleanup if disabled
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      return;
    }

    // Reset update count when effect re-runs
    updateCountRef.current = 0;

    let mounted = true;

    // Helper to update location state (DRY)
    const updateLocationState = (locationData: Location.LocationObject) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

      // Skip update if not enough time has passed (unless it's the first update)
      if (lastUpdateTimeRef.current > 0 && timeSinceLastUpdate < minUpdateInterval) {
        return;
      }

      const { latitude, longitude, accuracy } = locationData.coords;
      
      // Skip updates with extremely poor GPS accuracy (unless it's the first update)
      if (accuracy && accuracy > maxAccuracyThreshold && updateCountRef.current > 0) {
        console.log(`[LOCATION] Update skipped - poor accuracy (${accuracy}m > ${maxAccuracyThreshold}m)`);
        return;
      }
      
      const mapPosition = gpsToMapPosition(latitude, longitude);
      
      const closestNode = nodes ? findClosestNode(mapPosition.x, mapPosition.y, nodes) : null;
      
      let displayX = mapPosition.x;
      let displayY = mapPosition.y;
      
      if (isOnRoute && pathNodeIds && nodes) {
        // Build path points from node IDs
        const pathPoints = pathNodeIds
          .map(nodeId => nodes.find(n => n.id === nodeId))
          .filter(Boolean)
          .map(node => ({ x: Number(node!.x_pos), y: Number(node!.y_pos) }));
        
        // Project GPS position onto the path
        const projectedPoint = closestPointOnPath(mapPosition.x, mapPosition.y, pathPoints);
        if (projectedPoint) {
          displayX = projectedPoint.x;
          displayY = projectedPoint.y;
        }
      } else {
        // REMOVED: Snapping to node when not on route. 
        // This was likely causing the 10-15m error indoors.
        // We now use the raw GPS map position for better accuracy.
        displayX = mapPosition.x;
        displayY = mapPosition.y;
      }

      // Apply smoothing to prevent jitter (skip for first few updates for quick convergence)
      const previousPos = previousPositionRef.current;
      const shouldSkipSmoothing = updateCountRef.current < initialUpdatesToSkipSmoothing;
      
      if (previousPos && !shouldSkipSmoothing) {
        // Dynamic smoothing: trust high-accuracy readings more
        let dynamicSmoothing = smoothingFactor;
        
        if (accuracy) {
          if (accuracy < 10) {
            dynamicSmoothing = 0.5; // Very accurate, move marker quickly
          } else if (accuracy > 30) {
            dynamicSmoothing = 0.1; // Low accuracy (indoors), move marker slowly to filter jitter
          }
        }

        // Apply smoothing (interpolate between previous and new position)
        displayX = previousPos.x + (displayX - previousPos.x) * dynamicSmoothing;
        displayY = previousPos.y + (displayY - previousPos.y) * dynamicSmoothing;
        
        // Final sanity check: if the movement is tiny (less than 0.1% of map), don't move
        // This prevents the marker from "vibrating" when the user is standing still
        const dx = displayX - previousPos.x;
        const dy = displayY - previousPos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 0.001 && updateCountRef.current > 10) {
          displayX = previousPos.x;
          displayY = previousPos.y;
        }
      }
      
      // Update refs
      previousPositionRef.current = { x: displayX, y: displayY };
      lastUpdateTimeRef.current = now;
      updateCountRef.current++;

      console.log(`[LOCATION] Final: ${displayX.toFixed(4)}, ${displayY.toFixed(4)} | Accuracy: ${accuracy}m | Smoothing: ${shouldSkipSmoothing ? 'none' : 'applied'}`);

      setLocation({
        x: displayX,
        y: displayY,
        latitude,
        longitude,
        accuracy,
        closestNodeId: closestNode?.id,
      });
    };

    async function startLocationTracking() {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (!mounted) return;

        if (status !== 'granted') {
          setError({ message: 'Location permission denied' });
          setPermissionGranted(false);
          return;
        }

        setPermissionGranted(true);

        // Get last known position immediately
        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: 10000, // Accept cached location up to 10s old
        });
        if (lastKnown && mounted) {
          updateLocationState(lastKnown);
        }

        // Start watching position changes with higher precision
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation, // Increased from High
            distanceInterval: 1, // Reduced from 5 meters for more frequent updates
            timeInterval: 1000, // Reduced from 3000ms
          },
          (position) => {
            if (mounted) updateLocationState(position);
          }
        );

        subscriptionRef.current = subscription;

      } catch (err) {
        if (!mounted) return;
        setError({ 
          message: err instanceof Error ? err.message : 'Failed to get location',
          code: err instanceof Error ? (err as any).code : undefined
        });
      }
    }

    startLocationTracking();

    // Cleanup function
    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [enabled, nodes, isOnRoute, pathNodeIds]);

  // Helper to check if user is on campus
  const isOnCampus = location 
    ? isWithinCampusBounds(location.latitude, location.longitude)
    : false;

  return {
    location,
    error,
    permissionGranted,
    isOnCampus,
  };
}
