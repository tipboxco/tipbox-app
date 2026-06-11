# Tipbox App — Claude Code Rules

## Hard Rules (MUST follow)

### Language
- MUST write all code, variables, functions, API endpoints in ENGLISH
- MUST write all UI-facing text in TURKISH (app targets Turkish market)
- MUST write commit messages in English, conventional format (`feat:`, `fix:`, `chore:`, `refactor:`)

### Styling
- MUST use NativeWind `className` prop for all styling — NEVER use inline `style` objects
- MUST use Tailwind utility classes — NEVER write custom CSS
- MUST include `dark:` variants on every themed component
- Brand colors: primary indigo (`#818CF8`/`#6366F1`), accent green (`#BBFF4E`)

### Architecture
- MUST follow feature-based architecture: each feature in `src/features/{name}/` with its own screens, navigation, components
- MUST put shared/reusable components in `src/components/`
- MUST use existing services, stores, and hooks — NEVER duplicate functionality
- MUST use singleton pattern for services (`ServiceName.getInstance()`)
- MUST use Zustand stores for state management (authStore, themeStore, appStore)

### TypeScript
- MUST use strict mode — NEVER use `any` unless absolutely unavoidable
- MUST use interfaces for extensible object shapes, types for unions/primitives
- MUST type all function parameters and return values

### Components
- MUST use functional components only — NEVER class components
- MUST use custom hooks (`src/hooks/`) for reusable logic
- MUST use Lucide React Native for icons

### File Naming
- Components: PascalCase (`ReviewCard.tsx`)
- Hooks: camelCase with `use` prefix (`useColorMode.ts`)
- Stores: camelCase with `Store` suffix (`authStore.ts`)
- Services: PascalCase with `Service` suffix (`ApiService/`)
- Config files: camelCase with `.config.ts` suffix

---

## Project Context

- **Stack**: React Native 0.79.5 + Expo SDK 53, TypeScript 5.8, React 19
- **UI**: NativeWind 4 (Tailwind 3.4) + Gluestack UI
- **State**: Zustand 5 with AsyncStorage persistence
- **Navigation**: React Navigation 7 (native stack, bottom tabs, drawer)
- **HTTP**: Axios with singleton ApiService (`src/services/ApiService/`)
- **Animations**: React Native Reanimated 3.17
- **Bottom Sheets**: @gorhom/bottom-sheet 5
- **Package Manager**: npm (NOT pnpm, NOT a monorepo)

## Dev Commands

```bash
npm run start:dev         # Expo dev server (development env)
npm run android           # Run on Android
npm run ios               # Run on iOS
npm run lint              # ESLint check
npm run lint:fix          # ESLint auto-fix
npm run format            # Prettier format
npm run type-check        # TypeScript check (tsc --noEmit)
```

## Key Paths

- API config: `src/config/api.config.ts`
- API functions: `src/services/ApiService/shared/{resource}/`
- Navigation types: `src/navigation/navigation.types.ts`
- Shared types: `src/types/`
- Stores: `src/store/`
- Hooks: `src/hooks/`

## God Nodes (high-impact, touch carefully)

1. `useColorMode()` — 528 edges, bridges 50+ communities
2. `useTranslation()` — 378 edges
3. `toImageSource()` — 165 edges
4. `useAppStore` — 128 edges
5. `useGlobalBottomSheet()` — 81 edges

Before modifying any god node, use `/graphify explain "nodeName"` to understand blast radius.

## Environment

- `.env.development.txt` / `.env.test.txt` / `.env.production.txt` → copied to `.env`
- Backend: separate repo at `d:\tipbox-app\tipbox-backend` (NestJS)
- Deep linking: `tipboxapp://`
- Bundle ID: `com.devkocmehmet.tipboxapp`
- OS: Windows 11 — use `copy` not `cp`, `cross-env` for env vars
