# Tipbox App

Mobile application project based on React Native + Expo.

## 🛠 Technologies

- React Native
- Expo
- TypeScript
- Gluestack UI
- Zustand (State Management)
- Axios
- React Navigation

## 📁 Project Structure

```
src/
├── api/                # API configuration and endpoints
├── components/         # Shared UI components
├── config/            # Application configurations
├── features/          # Feature-based structure
├── hooks/             # Custom React hooks
├── navigation/        # Navigation configuration
├── services/          # External service integrations
├── store/            # Zustand store definitions
└── types/            # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the project:
```bash
git clone [repo-url]
cd tipbox-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- `.env.development` (for development environment)
- `.env.test` (for test environment)
- `.env.production` (for production environment)

### Development

Commands for different environments:

```bash
# Development environment
npm run start:dev

# Test environment
npm run start:test

# Production environment
npm run start:prod
```

## 📱 Build and Distribution

### EAS Build

The project supports three build profiles:

1. **Development Build**
```bash
eas build --platform android --profile development
```
- For development environment
- Includes debug features
- Uses `.env.development`

2. **Preview Build**
```bash
eas build --platform android --profile preview
```
- For test environment
- Internal distribution
- Uses `.env.test`

3. **Production Build**
```bash
eas build --platform android --profile production
```
- For production environment
- Store distribution
- Uses `.env.production`

### 🔄 OTA (Over-the-Air) Updates

The project supports OTA updates via Expo Updates.

#### Publishing OTA Updates

Update commands for different channels:

```bash
# For production channel
eas update --branch production

# For preview channel
eas update --branch preview

# For development channel
eas update --branch development
```

#### Important OTA Notes

- OTA updates can only include JS/TS code and asset changes
- Native code changes require a new build
- New build recommended for major version changes (1.0.0 -> 2.0.0)
- App checks for updates automatically on launch (`checkAutomatically: "ON_LOAD"`)

## 🔐 Security

- JWT-based authentication
- Access Token and Refresh Token implementation
- Secure token storage with Expo SecureStore
- Automatic token refresh mechanism

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
