# TipBox Mobile App

This repository contains the mobile (React Native/Expo) version of the TipBox application. The app is built with React Native, Expo, and TypeScript, following modular architecture and component-driven development principles.

## Getting Started

### Requirements

- Node.js (18+ recommended)
- Expo CLI
- React Native development environment
- iOS Simulator or Android Emulator

### Installation

```bash
npm install
# Configure environment files
cp .env.example .env.development.txt
npx expo prebuild
npx expo run:ios # or expo run:android
```

### Scripts

- `npm start` — Development server (with Expo)
- `npm run ios` — Run on iOS simulator
- `npm run android` — Run on Android emulator
- `npm run web` — Run on web browser
- `npm run build` — Create production build

## Directory Structure

```
src/
  api/              # API configuration and interceptors
  components/       # Reusable UI components
    ui/             # GlueStackUI-based components
  config/           # Application configurations
  features/         # Feature-based modules
    auth/           # Authentication module
    home/           # Home page module
    profile/        # Profile module
    settings/       # Settings module
    explore/        # Explore module
  navigation/       # Navigation configuration
  store/            # Zustand state management
```

## Contributing

Pull requests and contributions are welcome!

