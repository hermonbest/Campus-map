# Mobile App Template 📱

A clean, modern React Native mobile app template built with Expo. This template provides a solid foundation for building mobile applications with best practices and essential features already set up.

## Features

- ⚡ **Expo Router** - File-based routing with type-safe navigation
- 🎨 **Design System** - Consistent colors, spacing, and typography tokens
- 🌙 **Dark Mode Support** - Automatic theme switching
- 📱 **Tab Navigation** - Bottom tab navigation with haptic feedback
- 🎯 **TypeScript** - Full type safety throughout the app
- 🚀 **Modern Stack** - Latest React Native and Expo features
- 📐 **Responsive Design** - Optimized for different screen sizes

## Quick Start

1. **Clone or copy this template**
   ```bash
   # If using as a template
   npx create-expo-app --template your-template-name
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Scan QR code with Expo Go app
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## Project Structure

```
app/
├── (tabs)/          # Tab navigation screens
│   ├── index.tsx    # Home screen
│   ├── profile.tsx  # Profile screen
│   ├── settings.tsx # Settings screen
│   └── _layout.tsx  # Tab layout configuration
├── _layout.tsx      # Root layout with providers
└── +not-found.tsx   # 404 screen

components/
├── ui/              # Reusable UI components
└── ...              # Other components

styles/
└── tokens.ts        # Design system tokens

types/
└── index.ts         # TypeScript type definitions
```

## Customization

### App Configuration
Update `app.json` with your app details:
- App name and slug
- Bundle identifiers
- Icons and splash screen
- Project owner

### Design System
Modify `styles/tokens.ts` to customize:
- Color palette
- Typography scales
- Spacing values
- Border radius and shadows

### Navigation
Add new screens by creating files in the `app/` directory. The file-based routing will automatically create routes.

## Adding Features

### New Screens
Create new files in the `app/` directory:
```tsx
// app/settings.tsx
export default function SettingsScreen() {
  return (
    <View>
      <Text>Settings</Text>
    </View>
  );
}
```

### New Components
Add reusable components in the `components/` directory and import them where needed.

### API Integration
Create API service files in the `lib/` directory for data fetching and API calls.

## Best Practices Included

- ✅ TypeScript for type safety
- ✅ Consistent naming conventions
- ✅ Component-based architecture
- ✅ Design system tokens
- ✅ Error boundaries
- ✅ Loading states
- ✅ Responsive layouts

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/)

## Contributing

This is a template project. Feel free to customize it for your needs!

## License

MIT License - feel free to use this template for your projects.
