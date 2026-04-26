/**
 * Real-time location tracking hook
 * Uses expo-location to track user's GPS position and convert to map coordinates
 */

import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { gpsToMapPosition, isWithinCampusBounds, findClosestNode } from '../lib/locationUtils';

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

export function useUserLocation(enabled: boolean = true, nodes?: Array<{ id: string; x_pos: number; y_pos: number }>) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Cleanup if disabled
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      return;
    }

    let mounted = true;

    // Helper to update location state (DRY)
    const updateLocationState = (locationData: Location.LocationObject) => {
      const { latitude, longitude, accuracy } = locationData.coords;
      const mapPosition = gpsToMapPosition(latitude, longitude);
      
      const closestNode = nodes ? findClosestNode(mapPosition.x, mapPosition.y, nodes) : null;
      const snappedX = closestNode ? Number(closestNode.x_pos) : mapPosition.x;
      const snappedY = closestNode ? Number(closestNode.y_pos) : mapPosition.y;

      setLocation({
        x: snappedX,
        y: snappedY,
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
  }, [enabled, nodes]);

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
