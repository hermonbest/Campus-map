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
  const smoothingFactor = 0.1; // Lower = more smoothing (0.1-0.5 recommended)
  const maxJumpDistance = 0.05; // Maximum allowed jump in map coordinates (0-1)
  const minUpdateInterval = 500; // Minimum time between location updates in milliseconds (reduced from 1500ms)
  const initialUpdatesToSkipSmoothing = 5; // Skip smoothing for first N updates to allow quick convergence
  const maxAccuracyThreshold = 50; // Maximum GPS accuracy in meters to accept (ignore worse readings)

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
        console.log(`[LOCATION] Update skipped - too soon (${timeSinceLastUpdate}ms < ${minUpdateInterval}ms)`);
        return;
      }

      const { latitude, longitude, accuracy } = locationData.coords;
      
      // Skip updates with poor GPS accuracy (unless it's the first update)
      if (accuracy && accuracy > maxAccuracyThreshold && updateCountRef.current > 0) {
        console.log(`[LOCATION] Update skipped - poor accuracy (${accuracy}m > ${maxAccuracyThreshold}m)`);
        return;
      }
      
      const mapPosition = gpsToMapPosition(latitude, longitude);
      
      console.log(`[LOCATION] Update #${updateCountRef.current + 1} - GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} | Accuracy: ${accuracy}m | Map: ${mapPosition.x.toFixed(4)}, ${mapPosition.y.toFixed(4)}`);
      
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
          console.log(`[LOCATION] Path projection: ${mapPosition.x.toFixed(4)}, ${mapPosition.y.toFixed(4)} -> ${displayX.toFixed(4)}, ${displayY.toFixed(4)}`);
        }
      } else if (!isOnRoute) {
        // When not on route, snap to closest node for stable location display
        displayX = closestNode ? Number(closestNode.x_pos) : mapPosition.x;
        displayY = closestNode ? Number(closestNode.y_pos) : mapPosition.y;
        console.log(`[LOCATION] Snap to node: ${closestNode?.id || 'none'} at ${displayX.toFixed(4)}, ${displayY.toFixed(4)}`);
      }

      // Apply smoothing to prevent jumps (skip for first few updates to allow quick convergence)
      const previousPos = previousPositionRef.current;
      const shouldSkipSmoothing = updateCountRef.current < initialUpdatesToSkipSmoothing;
      
      console.log(`[LOCATION] Smoothing: ${shouldSkipSmoothing ? 'SKIPPED' : 'APPLIED'} (update #${updateCountRef.current + 1}/${initialUpdatesToSkipSmoothing})`);
      
      if (previousPos && isOnRoute && !shouldSkipSmoothing) {
        // Calculate distance from previous position
        const dx = displayX - previousPos.x;
        const dy = displayY - previousPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        console.log(`[LOCATION] Distance from previous: ${distance.toFixed(4)}`);
        
        // If jump is too large, clamp it
        if (distance > maxJumpDistance) {
          const ratio = maxJumpDistance / distance;
          displayX = previousPos.x + dx * ratio;
          displayY = previousPos.y + dy * ratio;
          console.log(`[LOCATION] Jump clamped from ${distance.toFixed(4)} to ${maxJumpDistance}`);
        }
        
        // Apply smoothing (interpolate between previous and new position)
        const beforeX = displayX;
        const beforeY = displayY;
        displayX = previousPos.x + (displayX - previousPos.x) * smoothingFactor;
        displayY = previousPos.y + (displayY - previousPos.y) * smoothingFactor;
        console.log(`[LOCATION] Smoothed: ${beforeX.toFixed(4)}, ${beforeY.toFixed(4)} -> ${displayX.toFixed(4)}, ${displayY.toFixed(4)}`);
      }
      
      // Update previous position
      previousPositionRef.current = { x: displayX, y: displayY };
      
      // Update last update time
      lastUpdateTimeRef.current = now;
      
      // Increment update count
      updateCountRef.current++;

      console.log(`[LOCATION] Final position: ${displayX.toFixed(4)}, ${displayY.toFixed(4)} | Closest node: ${closestNode?.id || 'none'}`);

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

        // Get last known position immediately (cached, fast)
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && mounted) {
          updateLocationState(lastKnown);
        }

        // Start watching position changes immediately
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5, // Update every 5 meters
            timeInterval: 3000, // Or every 3 seconds
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
