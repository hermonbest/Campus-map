# Web Admin to Mobile App Integration

This document explains how the Campus Map mobile app integrates with the web-admin backend.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Web Admin     │         │   Mobile App    │
│   (Next.js)     │◄────────│  (React Native) │
│                 │   API   │                 │
│  PostgreSQL DB  │  Calls  │  Fetches data   │
└─────────────────┘         └─────────────────┘
```

## How It Works

1. **Web Admin** stores buildings in a PostgreSQL database with percentage-based coordinates (`positionX`, `positionY`)
2. **Mobile App** fetches buildings from the web-admin's `/api/buildings` endpoint
3. **Data Transformation** converts percentage-based coordinates to GPS latitude/longitude
4. **Real-time Updates** - When you update buildings in the admin panel, the mobile app will fetch the latest data

## Setup Instructions

### 1. Configure the API URL

Create a `.env` file in the `Campus-map/` directory:

```bash
cp .env.example .env
```

Edit `.env` and set the API URL:

```env
# For local development (use your computer's IP address)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000

# For production (use your deployed web-admin URL)
EXPO_PUBLIC_API_URL=https://your-admin-domain.com
```

**Important**: 
- For Android emulator, use `http://10.0.2.2:3000` (special alias for host localhost)
- For iOS simulator, use `http://localhost:3000`
- For physical devices, use your computer's local IP address

### 2. Start the Web Admin

```bash
cd web-admin
npm install
npm run dev
```

The web-admin will run on `http://localhost:3000`

### 3. Start the Mobile App

```bash
cd Campus-map
npm install
npx expo start
```

## Data Flow

### Web Admin (Source of Truth)
- Buildings are stored in PostgreSQL with fields:
  - `positionX`, `positionY` (percentage-based 0-100)
  - `name`, `category`, `icon`, `description`
  - `hours`, `amenities`, `imageUrl`, `phone`, `website`
  - `floorCount`, `wheelchairAccessible`

### Mobile App (Consumer)
- Fetches buildings from `/api/buildings`
- Transforms `positionX/positionY` to `latitude/longitude` using map bounds
- Displays buildings on the map with markers
- Supports search and navigation

## API Endpoints

The mobile app uses these web-admin endpoints:

- `GET /api/buildings` - Fetch all buildings
- `GET /api/buildings/:id` - Fetch a single building

## Coordinate Transformation

The mobile app converts percentage-based coordinates to GPS coordinates using the map overlay bounds:

```typescript
// Map bounds (from CampusMap.tsx)
southWest: { latitude: 9.03689, longitude: 38.83527 }
northEast: { latitude: 9.04128, longitude: 38.84315 }

// Conversion formula
longitude = westBound + (positionX / 100) * (eastBound - westBound)
latitude = northBound - (positionY / 100) * (northBound - southBound)
```

## Troubleshooting

### Mobile app shows "Failed to load buildings"

1. Check that the web-admin is running
2. Verify the `EXPO_PUBLIC_API_URL` is correct
3. For physical devices, ensure both devices are on the same network
4. Check the web-admin's console for API errors

### Buildings appear in wrong locations

The coordinate transformation assumes the map overlay bounds match between web-admin and mobile app. Verify that:
- The map image (`kue_map.png`) is the same in both systems
- The overlay bounds in `CampusMap.tsx` match the web-admin's map editor

### CORS errors

The web-admin's Next.js API routes should allow cross-origin requests by default. If you encounter CORS issues, check the web-admin's `next.config.ts` for any custom headers configuration.

## Files Created

- `Campus-map/lib/api.ts` - API service for fetching buildings
- `Campus-map/hooks/useBuildings.ts` - React hook for managing buildings state
- `Campus-map/.env.example` - Environment configuration template
- `Campus-map/INTEGRATION.md` - This documentation file

## Files Modified

- `Campus-map/components/CampusMap.tsx` - Updated to use API instead of static JSON
