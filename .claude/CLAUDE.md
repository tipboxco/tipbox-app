# Tipbox App — Claude Code Configuration

## Project Overview

Tipbox is a social product review and recommendation mobile app built with React Native + Expo. Users share product reviews, manage personal inventories, discover new products, and build trust-based social connections.

- **Platform**: React Native 0.79.5 + Expo SDK 53 (dev client)
- **Language**: TypeScript 5.8 (strict mode), React 19
- **State Management**: Zustand 5 with AsyncStorage persistence
- **Navigation**: React Navigation 7 (native stack, bottom tabs, drawer)
- **UI/Styling**: NativeWind 4 (Tailwind CSS 3.4) + Gluestack UI
- **Icons**: Lucide React Native
- **HTTP Client**: Axios with singleton ApiService pattern
- **Animations**: React Native Reanimated 3.17
- **Bottom Sheets**: @gorhom/bottom-sheet 5
- **Package Manager**: npm (not pnpm — this is NOT a monorepo)

## Folder Structure

```
src/
├── components/          # Shared UI components (Header, ReviewCard, SideMenu, ui/)
├── config/              # App config (api, auth0, imagePicker, notification)
├── features/            # Feature-based modules
│   ├── auth/            # Login/Register screens
│   ├── feed/            # Social feed with review cards
│   ├── explore/         # Browse/discover products
│   ├── catalog/         # Product catalog & categories
│   ├── inventory/       # User's product inventory
│   ├── profile/         # User profiles, badges, stats
│   └── settings/        # App settings (theme, notifications)
├── hooks/               # Custom hooks (useColorMode, useApi, useNotification)
├── navigation/          # Navigation config (MainNavigator, TabNavigator, types)
├── services/            # External service integrations
│   ├── ApiService/      # Axios singleton wrapper with interceptors
│   ├── Auth0Service/    # OAuth 2.0 authentication
│   ├── ExpoNotificationService/
│   ├── ExpoImagePickerService/
│   └── OTAService/      # Over-the-air updates
├── store/               # Zustand stores (authStore, themeStore, appStore)
├── types/               # Shared TypeScript type definitions
└── utils/               # Utility functions
```

## Dev Commands

```bash
# Development
npm run start:dev         # Expo dev server (development env)
npm run start:test        # Expo dev server (test env)
npm run start:prod        # Expo dev server (production env)
npm run android           # Run on Android device/emulator
npm run ios               # Run on iOS simulator
npm run web               # Run on web browser

# Code Quality
npm run lint              # ESLint check
npm run lint:fix          # ESLint auto-fix
npm run format            # Prettier format
npm run format:check      # Prettier check
npm run type-check        # TypeScript type check (tsc --noEmit)
```

## Navigation Structure

```
MainNavigator (Native Stack)
├── Main → TabNavigator (Bottom Tabs)
│   ├── Feed → FeedNavigator (Stack)
│   │   ├── FeedScreen
│   │   └── ReviewDetail
│   ├── Explore → ExploreNavigator (Stack)
│   │   └── ExploreMain
│   ├── Catalog → CatalogNavigator (Stack)
│   │   ├── CatalogScreen
│   │   ├── ProductDetail (param: productId)
│   │   └── CategoryProducts (param: categoryId)
│   ├── Inventory → InventoryNavigator (Stack)
│   │   ├── InventoryScreen
│   │   ├── ItemDetail (param: itemId)
│   │   └── AddItem
│   └── Profile → ProfileNavigator (Stack)
│       └── ProfileMain
└── Settings → SettingsNavigator (Stack)
    └── SettingsScreen (tabs: Settings, Media, Notification)
```

## Key Technical Patterns

### Feature-Based Architecture
Each feature (`src/features/{name}/`) contains its own screens, sub-navigation, and feature-specific components. Shared components live in `src/components/`.

### Service Layer (Singleton Pattern)
Services use singleton instances accessed via `ServiceName.getInstance()`:
- `ApiService`: Axios wrapper with request/response interceptors, automatic error logging
- `Auth0Service`: OAuth login/logout/refresh
- `ExpoNotificationService`: Push notification setup and handling

### State Management (Zustand)
- **authStore**: Authentication state, user data (persisted to AsyncStorage)
- **themeStore**: Color mode light/dark (persisted to AsyncStorage)
- **appStore**: App-level state — theme, language, online status (not persisted)

### Styling
- Use NativeWind `className` prop for Tailwind CSS styling on React Native components
- Gluestack UI components for complex UI elements (modals, toasts, overlays)
- Dark mode via `dark:` prefix in Tailwind classes (mode: 'media')
- Brand colors: primary indigo (`#818CF8`/`#6366F1`), accent green (`#BBFF4E`)

### API Layer
- Base URL: `http://localhost:3000/api` (dev) / configured per environment
- Endpoints defined in `src/config/api.config.ts`
- API functions in `src/services/ApiService/shared/{resource}/`
- Type definitions in corresponding `types.ts` files

## Code Conventions

### Language Rule
- **Code, variables, functions, API endpoints**: ENGLISH only
- **UI text**: Turkish (hardcoded or future i18n — app targets Turkish market)
- **Comments**: Turkish allowed
- **Commit messages**: English, conventional format (`feat:`, `fix:`, `chore:`, `refactor:`)

### TypeScript
- Strict mode enabled
- Use interfaces for extensibility, types for unions/primitives
- Navigation types defined in `src/navigation/navigation.types.ts`
- Shared types in `src/types/`

### Component Patterns
- Functional components only (no class components)
- Custom hooks for reusable logic (`src/hooks/`)
- Feature screens live inside their feature directory
- Shared/reusable components go in `src/components/`

### Styling Rules
- Prefer NativeWind `className` over inline `style` objects
- Use Tailwind utility classes — avoid custom CSS
- Responsive: use Tailwind breakpoints when needed
- Dark mode: always include `dark:` variants for themed components

### File Naming
- Components: PascalCase (`ReviewCard.tsx`)
- Hooks: camelCase with `use` prefix (`useColorMode.ts`)
- Stores: camelCase with `Store` suffix (`authStore.ts`)
- Services: PascalCase with `Service` suffix (`ApiService/`)
- Types: PascalCase (`auth.ts` exports `User`, `AuthState`, etc.)
- Config files: camelCase with `.config.ts` suffix

## Environment Setup

### Environment Files
- `.env.development.txt` → copied to `.env` for dev
- `.env.test.txt` → copied to `.env` for test
- `.env.production.txt` → copied to `.env` for prod

### Key Environment Variables
```
API_URL=https://api-dev.tipbox.com
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_AUDIENCE=
```

### Build Profiles (EAS)
- `development`: Channel=development, APP_NAME=Tipbox_Dev
- `preview`: Channel=preview, APP_NAME=Tipbox_Test
- `production`: Channel=production, APP_NAME=Tipbox

## Graphify — Knowledge Graph

This project has a pre-built knowledge graph at `graphify-out/graph.json` (9,316 nodes, 15,498 edges, 620 communities).

### When to Use the Graph
- **Architecture questions**: "How does X connect to Y?", "What depends on this module?"
- **Before large refactors**: Understand blast radius via `/graphify query "component name"`
- **Dependency tracing**: `/graphify path "ModuleA" "ModuleB"` for shortest path
- **After major changes**: Run `/graphify . --update` to keep graph current

### God Nodes (highest connectivity — touch carefully)
1. `useColorMode()` — 528 edges, bridges 50+ communities (theme hook)
2. `useTranslation()` — 378 edges (i18n system)
3. `toImageSource()` — 165 edges (image helper)
4. `useAppStore` — 128 edges (global Zustand state)
5. `useGlobalBottomSheet()` — 81 edges (overlay management)
6. `Header` — 66 edges (shared header)
7. `NavigationService` — 66 edges (navigation routing)

### Quick Commands
```bash
/graphify query "how does auth flow work"    # BFS broad context
/graphify query "auth to wallet" --dfs       # DFS trace specific path
/graphify path "AuthService" "WalletService" # shortest path
/graphify explain "useColorMode"             # node deep-dive
/graphify . --update                         # incremental rebuild after changes
```

### Key Architectural Insights from Graph
- **Cross-cutting concerns**: `useColorMode` and `useTranslation` are the two biggest bridge nodes — changes to these affect nearly every feature module
- **Low cohesion areas**: "UI Components & Modals" (cohesion: 0.03) and "Post Creation & Inventory" (cohesion: 0.04) may benefit from splitting
- **Token efficiency**: Graph queries use ~59x fewer tokens than re-reading source files

## Work Quality Standards

Before writing code:
1. **Read** the existing code and understand current patterns
2. **Follow** the established feature-based architecture
3. **Use** existing services/stores/hooks — don't duplicate
4. **Style** with NativeWind className — not inline styles
5. **Type** everything — no `any` unless absolutely necessary
6. **Test** on both light and dark themes
7. **Check graph** before touching god nodes — use `/graphify explain "nodeName"` to understand impact

## Platform Notes

- **OS**: Windows 11 — use `copy` not `cp` in npm scripts, `cross-env` for env vars
- **Node**: >= 18.0.0
- **Backend**: Separate repo at `d:\tipbox-app\tipbox-backend` (NestJS)
- **Deep linking scheme**: `tipboxapp://`
- **Bundle ID**: `com.devkocmehmet.tipboxapp`
