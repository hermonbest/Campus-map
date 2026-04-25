import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#18181B',
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#A1A1AA',
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="route" 
        options={{ 
          title: 'Navigate',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="building-details" 
        options={{ 
          href: null, // Hide from tab bar
        }} 
      />
    </Tabs>
  );
}
