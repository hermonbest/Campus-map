# Campus Map

A modern, GPS-enabled campus navigation mobile application built with React Native and Expo. Features real-time location tracking, pathfinding, building search, and offline caching.

## Features

- **Real-time GPS Tracking** - Track your location on campus with accuracy filtering and smoothing
- **Pathfinding** - Dijkstra-based route calculation between buildings and offices
- **Offline Support** - Cached maps, buildings, nodes, and edges for offline navigation
- **Building Search** - Search buildings by name or offices by staff name/room number
- **Building Details** - View office information, staff details, and building descriptions
- **Interactive Map** - Pan and zoom campus map with building markers
- **Route Visualization** - Animated path rendering with marching ants effect
- **Arrival Detection** - Automatic detection when you reach your destination
- **Notice Board** - Display campus notices with images

## Tech Stack

### Mobile App
- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build tooling
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **Supabase** - Backend database and authentication
- **Expo Location** - GPS tracking
- **React Native Reanimated** - Smooth animations
- **React Native SVG** - Map rendering and path visualization

### Web Admin
- **Next.js** - React framework
- **TypeScript** - Type safety
- **Supabase** - Database management
- **Tailwind CSS** - Styling

## Project Structure

```
Campus-map/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   ├── route/             # Route screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── MapViewer.tsx      # Map display with paths and markers
│   ├── DestinationPickerModal.tsx  # Route selection
│   ├── BuildingCard.tsx   # Building details bottom sheet
│   └── ArrivalToast.tsx   # Arrival notification
├── hooks/                 # Custom React hooks
│   └── useUserLocation.ts # GPS location tracking with smoothing
├── lib/                   # Utilities and configurations
│   ├── cache.ts           # Caching logic
│   ├── dijkstra.ts        # Pathfinding algorithm
│   ├── locationUtils.ts   # GPS to map conversion
│   ├── supabase.ts        # Supabase client
│   └── types.ts           # TypeScript type definitions
└── assets/                # Images and fonts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd campus-map/Campus-map
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development server:
```bash
npm start
```

5. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Configuration

### GPS Bounds

Configure campus GPS boundaries in `lib/locationUtils.ts`:

```typescript
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
```

### Location Tracking

Adjust GPS tracking parameters in `hooks/useUserLocation.ts`:

```typescript
const smoothingFactor = 0.1; // Position smoothing (0.1-0.5)
const maxJumpDistance = 0.05; // Max allowed jump in map coordinates
const minUpdateInterval = 500; // Minimum update interval (ms)
const maxAccuracyThreshold = 50; // Ignore GPS worse than 50m accuracy
```

## Database Schema

### Tables

- **buildings** - Campus buildings with entrance nodes
- **offices** - Office information within buildings
- **nodes** - Navigation nodes (intersections, waypoints)
- **edges** - Connections between nodes for pathfinding
- **notices** - Campus announcements with images

### Key Relationships

- Buildings have many offices
- Buildings have an entrance_node_id for routing
- Nodes connect via edges (undirected graph)
- Pathfinding uses Dijkstra's algorithm on the node-edge graph

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Web Admin

The web admin panel is located in the `web-admin/` directory. It provides:

- Building management (CRUD operations)
- Office management
- Node and edge editing for the navigation graph
- Notice board management

See `web-admin/README.md` for details.

## Caching Strategy

The app uses a multi-layer caching system:

1. **AsyncStorage** - Cached JSON data (buildings, nodes, edges, offices)
2. **File System** - Cached map images for offline use
3. **Version Control** - Server version checking to trigger updates
4. **Image Caching** - Building and notice images cached locally

Cache is invalidated when:
- Server version changes
- User manually refreshes
- Cache is corrupted

## Troubleshooting

### Location Not Updating

- Check location permissions in device settings
- Ensure GPS is enabled
- Check console logs for accuracy warnings
- Verify campus bounds are correct for your location

### Path Not Found

- Ensure nodes and edges are properly connected in the database
- Check that buildings have valid entrance_node_id values
- Verify the graph is connected (no isolated nodes)

### Map Not Loading

- Check internet connection for initial map fetch
- Verify Supabase credentials in `.env`
- Check console for caching errors
- Try clearing cache: Clear app data or use refresh button

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Backend powered by [Supabase](https://supabase.com/)
- Pathfinding using Dijkstra's algorithm
- Map rendering with React Native SVG
