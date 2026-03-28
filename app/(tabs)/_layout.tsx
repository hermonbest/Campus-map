import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '../../styles/tokens';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: isDark ? colors.primary : colors.white, paddingBottom: Math.max(insets.bottom, 16) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName = route.name === 'index' ? 'map' : route.name === 'notices' ? 'notifications' : 'search';
        const label = route.name === 'index' ? 'Map' : route.name === 'notices' ? 'Notices' : 'Search';

        if (isFocused) {
          return (
             <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.8} style={[styles.fabTab, { backgroundColor: isDark ? colors.secondaryContainer : colors.primary }]}>
                <Ionicons name={iconName} size={24} color={isDark ? colors.primary : colors.white} />
             </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.6} style={styles.tabItem}>
            <Ionicons name={iconName} size={24} color={isDark ? colors.white : colors.text} opacity={0.6} />
            <Text style={[styles.tabLabel, { color: isDark ? colors.white : colors.text, opacity: 0.6 }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="notices" />
      <Tabs.Screen name="search" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    zIndex: 50,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: 64,
  },
  fabTab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  }
});
