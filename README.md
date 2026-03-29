# KUE Campus Map �️

A mobile application for navigating the Kirirom University of Excellence (KUE) campus. Built with React Native, Expo, and Supabase for real-time data access.

## Features

- 🗺️ **Interactive Campus Map** - View buildings with GPS-accurate positioning
- 📍 **Location Services** - Real-time user location on campus
- 🔍 **Smart Search** - Search buildings and offices with offline support
- 📢 **Campus Notices** - Stay updated with campus announcements
- � **Building Details** - View amenities, hours, offices, and accessibility info
- 🌙 **Dark Mode Support** - Automatic theme switching
- � **Offline Mode** - Cached data for offline navigation
- 🚀 **Supabase Backend** - Direct cloud data fetching, no local server needed

## Technical Stack

- **Framework:** React Native with Expo SDK 54
- **Navigation:** Expo Router (file-based routing)
- **Backend:** Supabase (PostgreSQL + PostgREST)
- **Maps:** React Native Maps
- **Storage:** AsyncStorage for offline caching
- **Build:** EAS Build for production APK/IPA

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # .env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Start development**
   ```bash
   npx expo start
   ```

4. **Build for production**
   ```bash
   eas build --profile preview --platform android
   ```

## Project Structure

```
app/                    # Main application screens
components/             # React components
lib/                    # API, cache, Supabase client
hooks/                  # Custom React hooks
constants/              # Static data
assets/                 # Images and fonts
```

## Data Architecture

### Direct Supabase Integration
The app fetches data directly from Supabase, eliminating the need for a local web-admin server.

### Offline Support
- Data caching via AsyncStorage
- Image preloading and caching
- Offline search functionality
- Network status monitoring

## Recent Changes

### Migration to Supabase
- Replaced REST API calls with Supabase client
- Direct database queries for buildings, offices, notices
- Removed dependency on local web-admin server

### Build & Deployment
- EAS Build configuration
- Android preview/production profiles
- App icon and splash screen setup

## License

MIT License
