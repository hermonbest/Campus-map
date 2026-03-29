import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/tokens';
import offlineManager from '@/lib/offlineManager';

interface OfflineIndicatorProps {
  style?: any;
  showDetails?: boolean;
}

export default function OfflineIndicator({ style, showDetails = false }: OfflineIndicatorProps) {
  const [status, setStatus] = useState(offlineManager.isOffline());

  useEffect(() => {
    const unsubscribe = offlineManager.subscribeToNetworkChanges((newStatus) => {
      setStatus(newStatus.isConnected === false || newStatus.isInternetReachable === false);
    });

    return unsubscribe;
  }, []);

  if (!status) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.indicator}>
        <Ionicons name="alert-circle" size={16} color="#ff9800" />
        <Text style={styles.text}>Offline Mode</Text>
        {showDetails && (
          <Text style={styles.detailsText}>
            Some features may be limited
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },
  text: {
    color: '#ff9800',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  detailsText: {
    color: '#ff9800',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },
});
