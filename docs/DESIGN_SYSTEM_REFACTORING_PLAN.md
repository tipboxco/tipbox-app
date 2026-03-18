# Tipbox App - Design System Refactoring Plan

## Executive Summary

Tipbox uygulamasi su anda **Gluestack UI** (`@gluestack-ui/themed`) framework'une derinden bagimli bir UI mimarisine sahiptir. Bu dokuman, Gluestack bagimliligini kaldirarak, **NativeWind + Tailwind CSS** tabanli, tokenize edilmis, accessible, light/dark mode destekli bir **custom design system** olusturma surecinin tam planlamasini icerir.

---

## Mevcut Durum Analizi

### Gluestack Bagimliligi

| Metrik | Deger |
|--------|-------|
| Gluestack import sayisi | **287 occurrence** |
| Etkilenen dosya sayisi | **272 dosya** |
| Kullanilan Gluestack componentleri | Box, Text, VStack, HStack, Pressable, Button, ButtonText, Input, InputField, Image, Icon, Divider, ScrollView, Center, View, FormControl, FormControlLabel, FormControlLabelText, Toast, Switch |
| Gluestack paket sayisi | 7 paket (@gluestack-ui/themed, @gluestack-ui/config, @gluestack-style/react, @gluestack-ui/button, @gluestack-ui/icon, @gluestack-ui/overlay, @gluestack-ui/toast, @gluestack-ui/nativewind-utils) |

### Kullanilan Styling Patterns

1. **Gluestack Token Syntax**: `$textDark50`, `$backgroundDark100`, `$primary600`, `$sm`, `$bold`
2. **Gluestack Props**: `bg`, `px`, `py`, `borderRadius`, `space`, `alignItems`, `justifyContent`
3. **Hardcoded Hex Colors**: `#FFFFFF`, `#000000`, `#E9E9E9`, `#D0F205`, `#FF3040`, `#A3A3A3`, `#787878` vb.
4. **Manual Dark Mode**: Her component icinde `const isDark = colorMode === 'dark'` pattern'i
5. **StyleSheet.create**: Bazi yerlerde React Native StyleSheet kullanimi
6. **NativeWind className**: Hic kullanilmiyor (0 occurrence)

### Mevcut Tema Yonetimi

- **Zustand Store**: `appStore.ts` icinde `colorMode: 'light' | 'dark'`
- **useColorMode Hook**: Zustand'dan colorMode okur
- **GluestackUIProvider**: Config ve colorMode'u provider uzerinden dagitir
- **Manuel isDark Kontrolleri**: ~270 dosyada tekrarlanan pattern

### Tespit Edilen Sorunlar

1. **Vendor Lock-in**: Tum UI Gluestack'e bagimli, degisiklik maliyeti cok yuksek
2. **Tutarsiz Renk Kullanimi**: Ayni renk farkli dosyalarda farkli hex kodlariyla kullanilmis
3. **Semantic Token Eksikligi**: Renkler fonksiyonel anlamlarina gore degil, raw deger olarak kullaniliyor
4. **Dark Mode Boilerplate**: Her component'te isDark kontrolu tekrarlaniyor
5. **Accessibility Eksikligi**: accessibilityLabel, accessibilityRole, accessibilityState kullanimi yok
6. **NativeWind Potansiyeli**: NativeWind kurulu ama hic kullanilmiyor (className yok)
7. **Design System Yoklugu**: Ortak component API'si, spacing/typography/color standartlari yok
8. **Performance**: GluestackUIProvider re-render sorunlari (config.ts'deki yorumlardan goruluyor)

---

## Hedef Mimari

```
src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts              # Semantic color tokens (light/dark)
│   │   ├── typography.ts          # Font sizes, weights, line heights
│   │   ├── spacing.ts             # Spacing scale
│   │   ├── radii.ts               # Border radius tokens
│   │   ├── shadows.ts             # Shadow definitions
│   │   ├── animation.ts           # Animation duration/easing tokens
│   │   └── index.ts               # Token barrel export
│   │
│   ├── theme/
│   │   ├── ThemeProvider.tsx       # NativeWind + custom theme provider
│   │   ├── theme.config.ts        # Light/dark theme configuration
│   │   ├── useTheme.ts            # Theme hook (replaces useColorMode)
│   │   ├── useThemeColor.ts       # Semantic color resolution hook
│   │   └── index.ts
│   │
│   ├── primitives/
│   │   ├── Box.tsx                # View wrapper with theme support
│   │   ├── Text.tsx               # Text with typography tokens
│   │   ├── Pressable.tsx          # Pressable with accessibility
│   │   ├── Image.tsx              # Image with caching + fallback
│   │   ├── Icon.tsx               # Icon wrapper
│   │   ├── Divider.tsx            # Divider component
│   │   ├── ScrollView.tsx         # ScrollView wrapper
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx         # Button variants (primary, secondary, ghost, etc.)
│   │   │   ├── Button.types.ts
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── TextInput.tsx      # Text input with label, error, etc.
│   │   │   ├── TextInput.types.ts
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── Card.tsx           # Card container
│   │   │   ├── Card.types.ts
│   │   │   └── index.ts
│   │   ├── Badge/
│   │   │   ├── Badge.tsx
│   │   │   └── index.ts
│   │   ├── Avatar/
│   │   │   ├── Avatar.tsx
│   │   │   └── index.ts
│   │   ├── Toast/
│   │   │   ├── Toast.tsx
│   │   │   ├── ToastProvider.tsx
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   │   ├── Modal.tsx
│   │   │   └── index.ts
│   │   ├── Skeleton/
│   │   │   ├── Skeleton.tsx
│   │   │   └── index.ts
│   │   ├── FormField/
│   │   │   ├── FormField.tsx      # Label + Input + Error wrapper
│   │   │   └── index.ts
│   │   ├── Chip/
│   │   │   ├── Chip.tsx
│   │   │   └── index.ts
│   │   ├── Switch/
│   │   │   ├── Switch.tsx
│   │   │   └── index.ts
│   │   └── index.ts               # Component barrel export
│   │
│   ├── layout/
│   │   ├── Stack.tsx              # VStack/HStack replacement
│   │   ├── Center.tsx             # Center layout
│   │   ├── Container.tsx          # Max-width container
│   │   ├── SafeArea.tsx           # Safe area wrapper
│   │   └── index.ts
│   │
│   ├── accessibility/
│   │   ├── a11y.utils.ts          # Accessibility helpers
│   │   ├── useA11y.ts             # Accessibility hook
│   │   └── index.ts
│   │
│   └── index.ts                   # Design system barrel export
│
├── tailwind.config.js             # Updated with design tokens
├── global.css                     # Updated with CSS variables for themes
└── nativewind-env.d.ts            # NativeWind TypeScript support
```

---

## Fazlar ve Adimlar

---

## FAZ 0: Hazirlik ve Altyapi (Tahmini Sure: 1 Sprint)

### Adim 0.1: Token Sistemi Tasarimi

**Amac**: Tum uygulamada kullanilacak design token'larini tanimla.

**Semantic Color Token Yapisi:**

```typescript
// src/design-system/tokens/colors.ts

export const colorTokens = {
  light: {
    // Background
    bg: {
      primary: '#FFFFFF',         // Ana sayfa arka plan
      secondary: '#F9FAFB',       // Ikincil arka plan (kartlar vb.)
      tertiary: '#F3F4F6',        // Ucuncul arka plan (input'lar vb.)
      inverse: '#0F172A',         // Ters arka plan (dark surface on light)
      brand: '#D0F205',           // Tipbox brand rengi
      error: '#FEF2F2',           // Error arka plan
      success: '#F0FDF4',         // Success arka plan
      warning: '#FFFBEB',         // Warning arka plan
      info: '#EFF6FF',            // Info arka plan
    },

    // Text
    text: {
      primary: '#111827',         // Ana metin
      secondary: '#4B5563',       // Ikincil metin
      tertiary: '#9CA3AF',        // Ucuncul metin (placeholder vb.)
      inverse: '#F9FAFB',         // Ters metin (dark bg uzerinde)
      brand: '#D0F205',           // Brand metin
      error: '#DC2626',           // Error metin
      success: '#16A34A',         // Success metin
      warning: '#D97706',         // Warning metin
      info: '#2563EB',            // Info metin
      link: '#6366F1',            // Link metin
      disabled: '#D1D5DB',        // Disabled metin
    },

    // Border
    border: {
      primary: '#E5E7EB',         // Ana border
      secondary: '#D1D5DB',       // Ikincil border
      focus: '#6366F1',           // Focus border
      error: '#DC2626',           // Error border
      brand: '#D0F205',           // Brand border
    },

    // Interactive
    interactive: {
      primary: '#D0F205',         // Primary button bg
      primaryText: '#111827',     // Primary button text
      secondary: '#6366F1',       // Secondary button bg
      secondaryText: '#FFFFFF',   // Secondary button text
      ghost: 'transparent',       // Ghost button bg
      ghostText: '#6366F1',       // Ghost button text
      danger: '#DC2626',          // Danger button bg
      dangerText: '#FFFFFF',      // Danger button text
      disabled: '#E5E7EB',        // Disabled button bg
      disabledText: '#9CA3AF',    // Disabled button text
    },

    // Status/Indicator
    indicator: {
      online: '#16A34A',
      offline: '#9CA3AF',
      busy: '#DC2626',
      notification: '#DC2626',
    },

    // Overlay
    overlay: {
      backdrop: 'rgba(0, 0, 0, 0.5)',
      scrim: 'rgba(0, 0, 0, 0.25)',
    },
  },

  dark: {
    bg: {
      primary: '#0F172A',
      secondary: '#1E293B',
      tertiary: '#334155',
      inverse: '#FFFFFF',
      brand: '#D0F205',
      error: '#450A0A',
      success: '#052E16',
      warning: '#451A03',
      info: '#172554',
    },

    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
      tertiary: '#64748B',
      inverse: '#111827',
      brand: '#D0F205',
      error: '#FCA5A5',
      success: '#86EFAC',
      warning: '#FCD34D',
      info: '#93C5FD',
      link: '#818CF8',
      disabled: '#475569',
    },

    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: '#818CF8',
      error: '#FCA5A5',
      brand: '#D0F205',
    },

    interactive: {
      primary: '#D0F205',
      primaryText: '#111827',
      secondary: '#818CF8',
      secondaryText: '#FFFFFF',
      ghost: 'transparent',
      ghostText: '#818CF8',
      danger: '#DC2626',
      dangerText: '#FFFFFF',
      disabled: '#334155',
      disabledText: '#64748B',
    },

    indicator: {
      online: '#86EFAC',
      offline: '#64748B',
      busy: '#FCA5A5',
      notification: '#DC2626',
    },

    overlay: {
      backdrop: 'rgba(0, 0, 0, 0.7)',
      scrim: 'rgba(0, 0, 0, 0.5)',
    },
  },
} as const;
```

**Typography Tokens:**

```typescript
// src/design-system/tokens/typography.ts

export const typography = {
  fontSize: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;
```

**Spacing Tokens:**

```typescript
// src/design-system/tokens/spacing.ts

export const spacing = {
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;
```

**Radii Tokens:**

```typescript
// src/design-system/tokens/radii.ts

export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
  card: 5,    // PostCard radius (mevcut 'postcard' token'i)
} as const;
```

### Adim 0.2: Tailwind Config Guncelleme

**Amac**: Tailwind config'i token sistemiyle uyumlu hale getir, Gluestack plugin'ini kaldir.

```javascript
// tailwind.config.js - HEDEF

const { colorTokens } = require('./src/design-system/tokens/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 'media' yerine 'class' - programmatic kontrol icin
  content: [
    'App.{tsx,jsx,ts,js}',
    'index.{tsx,jsx,ts,js}',
    'src/**/*.{tsx,jsx,ts,js}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Semantic tokens - CSS variables uzerinden
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          inverse: 'var(--color-bg-inverse)',
          brand: 'var(--color-bg-brand)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          inverse: 'var(--color-text-inverse)',
        },
        // ... diger semantic token'lar
      },
      fontFamily: {
        sans: ['System'],
        mono: ['SpaceMono'],
      },
      borderRadius: {
        card: '5px',
      },
    },
  },
  plugins: [], // gluestackPlugin KALDIRILACAK
};
```

### Adim 0.3: global.css Guncelleme

**Amac**: CSS variables ile light/dark mode token'larini tanimla.

```css
/* global.css - HEDEF */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Background */
    --color-bg-primary: #FFFFFF;
    --color-bg-secondary: #F9FAFB;
    --color-bg-tertiary: #F3F4F6;
    --color-bg-inverse: #0F172A;
    --color-bg-brand: #D0F205;

    /* Text */
    --color-text-primary: #111827;
    --color-text-secondary: #4B5563;
    --color-text-tertiary: #9CA3AF;
    --color-text-inverse: #F9FAFB;

    /* Border */
    --color-border-primary: #E5E7EB;
    --color-border-secondary: #D1D5DB;
    --color-border-focus: #6366F1;

    /* Interactive */
    --color-interactive-primary: #D0F205;
    --color-interactive-primary-text: #111827;
  }

  .dark {
    --color-bg-primary: #0F172A;
    --color-bg-secondary: #1E293B;
    --color-bg-tertiary: #334155;
    --color-bg-inverse: #FFFFFF;
    --color-bg-brand: #D0F205;

    --color-text-primary: #F8FAFC;
    --color-text-secondary: #CBD5E1;
    --color-text-tertiary: #64748B;
    --color-text-inverse: #111827;

    --color-border-primary: #334155;
    --color-border-secondary: #475569;
    --color-border-focus: #818CF8;

    --color-interactive-primary: #D0F205;
    --color-interactive-primary-text: #111827;
  }
}
```

### Adim 0.4: ThemeProvider Olusturma

**Amac**: GluestackUIProvider yerine gecmek uzere yeni bir ThemeProvider olustur.

```typescript
// src/design-system/theme/ThemeProvider.tsx

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/src/store/appStore';
import { colorTokens } from '../tokens/colors';

type ColorMode = 'light' | 'dark';

interface ThemeContextType {
  colorMode: ColorMode;
  isDark: boolean;
  colors: typeof colorTokens.light;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorMode = useAppStore((state) => state.colorMode);
  const toggleColorMode = useAppStore((state) => state.toggleColorMode);

  const value = useMemo(() => ({
    colorMode,
    isDark: colorMode === 'dark',
    colors: colorTokens[colorMode],
    toggleColorMode,
  }), [colorMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### Adim 0.5: Accessibility Altyapisi

**Amac**: Tum componentlerde kullanilacak a11y utility'lerini olustur.

```typescript
// src/design-system/accessibility/a11y.utils.ts

import { AccessibilityProps } from 'react-native';

export const a11y = {
  button: (label: string, hint?: string): AccessibilityProps => ({
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
  }),

  text: (label?: string): AccessibilityProps => ({
    accessible: true,
    accessibilityRole: 'text',
    ...(label && { accessibilityLabel: label }),
  }),

  image: (label: string): AccessibilityProps => ({
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: label,
  }),

  header: (label: string): AccessibilityProps => ({
    accessible: true,
    accessibilityRole: 'header',
    accessibilityLabel: label,
  }),

  input: (label: string, hint?: string): AccessibilityProps => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
  }),

  toggle: (label: string, isOn: boolean): AccessibilityProps => ({
    accessible: true,
    accessibilityRole: 'switch',
    accessibilityLabel: label,
    accessibilityState: { checked: isOn },
  }),
};
```

---

## FAZ 1: Primitive Componentler (Tahmini Sure: 1 Sprint)

### Adim 1.1: Box (View Wrapper)

Gluestack `Box` yerine gecen, NativeWind className destekli wrapper.

```typescript
// src/design-system/primitives/Box.tsx

import React from 'react';
import { View, ViewProps } from 'react-native';

interface BoxProps extends ViewProps {
  className?: string;
}

export const Box = React.forwardRef<View, BoxProps>(({ className, style, ...props }, ref) => {
  return <View ref={ref} className={className} style={style} {...props} />;
});

Box.displayName = 'Box';
```

### Adim 1.2: Text

Gluestack `Text` yerine gecen, typography token'li Text.

```typescript
// src/design-system/primitives/Text.tsx

import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

interface TextProps extends RNTextProps {
  className?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'label';
}

const variantClasses: Record<NonNullable<TextProps['variant']>, string> = {
  h1: 'text-3xl font-bold text-text-primary',
  h2: 'text-2xl font-bold text-text-primary',
  h3: 'text-xl font-semibold text-text-primary',
  h4: 'text-lg font-semibold text-text-primary',
  body: 'text-base text-text-primary',
  bodySmall: 'text-sm text-text-secondary',
  caption: 'text-xs text-text-tertiary',
  label: 'text-sm font-medium text-text-primary',
};

export const Text = React.forwardRef<RNText, TextProps>(
  ({ className, variant = 'body', ...props }, ref) => {
    const baseClass = variantClasses[variant];
    return (
      <RNText
        ref={ref}
        className={`${baseClass} ${className ?? ''}`}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';
```

### Adim 1.3: Stack (VStack/HStack Replacement)

```typescript
// src/design-system/layout/Stack.tsx

import React from 'react';
import { View, ViewProps } from 'react-native';

interface StackProps extends ViewProps {
  className?: string;
  direction?: 'row' | 'column';
  gap?: number;
}

export const Stack: React.FC<StackProps> = ({
  className,
  direction = 'column',
  gap = 0,
  style,
  ...props
}) => {
  const dirClass = direction === 'row' ? 'flex-row' : 'flex-col';
  const gapClass = gap ? `gap-${gap}` : '';
  return (
    <View
      className={`${dirClass} ${gapClass} ${className ?? ''}`}
      style={style}
      {...props}
    />
  );
};

// Convenience aliases
export const VStack: React.FC<Omit<StackProps, 'direction'>> = (props) => (
  <Stack direction="column" {...props} />
);

export const HStack: React.FC<Omit<StackProps, 'direction'>> = (props) => (
  <Stack direction="row" {...props} />
);
```

### Adim 1.4: Pressable

```typescript
// src/design-system/primitives/Pressable.tsx

import React, { useCallback } from 'react';
import {
  Pressable as RNPressable,
  PressableProps as RNPressableProps,
} from 'react-native';
import { a11y } from '../accessibility/a11y.utils';

interface PressableProps extends RNPressableProps {
  className?: string;
  accessibilityLabel: string; // Zorunlu - accessibility first
  accessibilityHint?: string;
}

export const Pressable = React.forwardRef<any, PressableProps>(
  ({ className, accessibilityLabel, accessibilityHint, ...props }, ref) => {
    return (
      <RNPressable
        ref={ref}
        className={className}
        {...a11y.button(accessibilityLabel, accessibilityHint)}
        {...props}
      />
    );
  }
);

Pressable.displayName = 'Pressable';
```

### Adim 1.5: Divider, Icon, Image Primitives

Diger temel primitives de ayni pattern'de olusturulacak.

---

## FAZ 2: Composite Componentler (Tahmini Sure: 2 Sprint)

### Adim 2.1: Button Component

```typescript
// src/design-system/components/Button/Button.tsx

import React from 'react';
import { ActivityIndicator, Pressable, PressableProps } from 'react-native';
import { Text } from '../../primitives/Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  accessibilityLabel?: string;
}

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-interactive-primary rounded-lg',
    text: 'text-interactive-primary-text font-semibold',
  },
  secondary: {
    container: 'bg-interactive-secondary rounded-lg',
    text: 'text-white font-semibold',
  },
  ghost: {
    container: 'bg-transparent rounded-lg',
    text: 'text-interactive-ghost-text font-semibold',
  },
  danger: {
    container: 'bg-interactive-danger rounded-lg',
    text: 'text-white font-semibold',
  },
  outline: {
    container: 'bg-transparent border border-border-primary rounded-lg',
    text: 'text-text-primary font-semibold',
  },
};

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'px-3 py-1.5', text: 'text-sm' },
  md: { container: 'px-4 py-2.5', text: 'text-base' },
  lg: { container: 'px-6 py-3.5', text: 'text-lg' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  accessibilityLabel,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const v = variantClasses[variant];
  const s = sizeClasses[size];

  return (
    <Pressable
      className={`${v.container} ${s.container} flex-row items-center justify-center ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <>
          {leftIcon}
          <Text className={`${v.text} ${s.text} ${leftIcon ? 'ml-2' : ''} ${rightIcon ? 'mr-2' : ''}`}>
            {label}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
};
```

### Adim 2.2: TextInput Component

FormControl + Input + InputField + FormControlLabel + FormControlLabelText'in birlesmis hali.

### Adim 2.3: Card Component

PostCard, EventCard, ProductInfoCard gibi kartlarin base'i olacak generic Card.

### Adim 2.4: Avatar Component

Profil resimleri icin kullanilacak, fallback destekli Avatar.

### Adim 2.5: Toast Component

Gluestack Toast yerine gecen, queue destekli toast sistemi.

### Adim 2.6: Badge, Chip, Switch

Kalan ortak componentler.

### Adim 2.7: Skeleton Component

Mevcut 12 skeleton componentinin base'i olacak generic Skeleton.

### Adim 2.8: FormField Component

Label + Input + Error + Hint bilesik component.

---

## FAZ 3: Gecis (Migration) Sureci (Tahmini Sure: 4-6 Sprint)

### Strateji: Bottom-Up Migration

Gecis, en az bagimli (leaf) componentlerden baslayarak, en cok bagimli (root) componentlere dogru ilerleyecektir. Bu sayede her adimda calisir durumda bir uygulama korunur.

### Migration Sirasi

#### Batch 1: Skeleton Componentleri (En Basit - Gluestack Box/VStack/HStack)
**Etkilenen dosyalar: 12**

```
src/components/Skeletons/FeedSkeleton.tsx
src/components/Skeletons/EventSkeleton.tsx
src/components/Skeletons/EventsScreenSkeleton.tsx
src/components/Skeletons/BadgeSkeleton.tsx
src/components/Skeletons/InventorySkeleton.tsx
src/components/Skeletons/LimitedTimeEventSkeleton.tsx
src/components/Skeletons/CategorySkeleton.tsx
src/components/Skeletons/MessageSkeleton.tsx
src/components/Skeletons/NotificationSkeleton.tsx
src/components/Skeletons/ProductSkeleton.tsx
src/components/Skeletons/SupportRequestSkeleton.tsx
```

**Migration pattern:**
```
ONCE:  import { Box, VStack, HStack } from '@gluestack-ui/themed';
SONRA: import { Box, VStack, HStack } from '@/src/design-system';
```

#### Batch 2: Basit Utility Componentler
**Etkilenen dosyalar: ~10**

```
src/components/StarRating/
src/components/AnimatedCounter/
src/components/Breadcrumb/
src/components/NotificationBadge/
src/components/MessageBadge/
src/components/ui/PinInput.tsx
```

#### Batch 3: Card Componentleri
**Etkilenen dosyalar: ~15**

```
src/components/PostCards/PostCard/
src/components/PostCards/ExperiencePostCard/
src/components/PostCards/BenchmarkPostCard/
src/components/PostCards/QuestionPostCard/
src/components/PostCards/TipsAndTricksPostCard/
src/components/PostCards/UpdatePostCard/
src/components/CommentsCard/
src/components/EventCard/
src/components/ProductInfoCard/
```

#### Batch 4: Modal/Sheet Componentler
**Etkilenen dosyalar: ~10**

```
src/components/CreatePostBottomSheet/
src/components/ExpertBottomSheet/
src/components/GlobalBottomSheet/
src/components/SearchModal/
src/components/CongratsModal/
src/components/CustomToast/
```

#### Batch 5: Layout Componentler
**Etkilenen dosyalar: ~5**

```
src/components/Header/
src/components/CustomDrawer/
src/components/FloatingActionButton/
```

#### Batch 6: Feature Componentleri (en buyuk batch)
**Etkilenen dosyalar: ~120**

Feature'lar tek tek migrate edilecek, siralama:

1. **settings/** (~25 dosya) - En izole feature
2. **wallet/** (~20 dosya) - Nispeten izole
3. **marketplace/** (~15 dosya) - Nispeten izole
4. **events/** (~20 dosya)
5. **catalog/** (~25 dosya)
6. **inbox/** (~20 dosya)
7. **profile/** (~20 dosya)
8. **post/** (~25 dosya)
9. **feed/** (~5 dosya)
10. **auth/** (~15 dosya)
11. **explore/** (~5 dosya)
12. **notifications/** (~5 dosya)
13. **bookmarks/** (~3 dosya)
14. **moreSchoise/** (~5 dosya)

#### Batch 7: Provider ve Root Dosyalar
**Etkilenen dosyalar: ~5**

```
src/components/ui/gluestack-ui-provider/index.tsx  -> KALDIR
src/components/ui/index.ts                         -> KALDIR
src/providers/ComposedProviders.tsx                 -> ThemeProvider'a gec
App.tsx                                            -> GluestackProvider kaldir
```

### Migration Icin Her Dosyada Yapilacaklar

Her dosya icin asagidaki checklist uygulanacak:

```
[ ] 1. Gluestack import'larini design-system import'larina cevir
[ ] 2. $ token syntax'ini ($textDark50) NativeWind className'e cevir
[ ] 3. Hardcoded hex renkleri semantic token'lara cevir
[ ] 4. isDark ternary pattern'lerini dark: prefix'li className'e cevir
[ ] 5. Inline style prop'larini className'e tasi (mumkun oldukca)
[ ] 6. accessibilityLabel, accessibilityRole ekle
[ ] 7. Gorsel dogrulama yap (light + dark)
[ ] 8. Lint/type check gectiginden emin ol
```

**Ornek Migration:**

```tsx
// ONCE (Gluestack)
import { Box, Text, HStack, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

const MyComponent = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box bg={isDark ? '$backgroundDark50' : '$backgroundLight0'} p="$4" borderRadius="$lg">
      <HStack alignItems="center" space="sm">
        <Text color={isDark ? '$textDark50' : '$textLight900'} fontSize="$sm" fontWeight="$bold">
          Hello
        </Text>
        <Pressable onPress={() => {}}>
          <Text color={isDark ? '#FFFFFF' : '#000000'}>Click</Text>
        </Pressable>
      </HStack>
    </Box>
  );
};

// SONRA (Design System + NativeWind)
import { Box, Text, HStack, Pressable } from '@/src/design-system';

const MyComponent = () => {
  return (
    <Box className="bg-bg-primary p-4 rounded-lg">
      <HStack className="items-center gap-2">
        <Text variant="bodySmall" className="font-bold">
          Hello
        </Text>
        <Pressable
          onPress={() => {}}
          accessibilityLabel="Click button"
        >
          <Text className="text-text-primary">Click</Text>
        </Pressable>
      </HStack>
    </Box>
  );
};
```

---

## FAZ 4: Temizlik ve Optimizasyon (Tahmini Sure: 1 Sprint)

### Adim 4.1: Gluestack Paketlerini Kaldir

Tum migration tamamlandiktan sonra:

```bash
npm uninstall @gluestack-ui/themed @gluestack-ui/config @gluestack-style/react \
  @gluestack-ui/button @gluestack-ui/icon @gluestack-ui/overlay \
  @gluestack-ui/toast @gluestack-ui/nativewind-utils
```

### Adim 4.2: Eski Dosyalari Temizle

```
SILINECEKLER:
- src/components/ui/gluestack-ui-provider/  (tum klasor)
- src/components/ui/index.ts                (Gluestack re-exports)
- src/types/gluestack-ui.d.ts
- gluestack-ui.config.json
```

### Adim 4.3: Babel Config Guncelle

```javascript
// babel.config.js - gluestack-related config varsa kaldir
```

### Adim 4.4: tailwind.config.js Son Hali

- `gluestackPlugin` import ve plugin kullanimini kaldir
- Safelist'ten Gluestack pattern'lerini kaldir
- Sadece semantic token'lar kalsin

### Adim 4.5: Performans Testi

- Bundle size karsilastirmasi (onceki vs sonraki)
- Render performance profiling
- Light/dark mode gecis performansi

### Adim 4.6: useColorMode Hook Guncelleme

`useColorMode` hook'u deprecate et, `useTheme` hook'una yonlendir:

```typescript
// src/hooks/useColorMode.ts

/** @deprecated Use useTheme from design-system instead */
export const useColorMode = () => {
  console.warn('useColorMode is deprecated. Use useTheme from @/src/design-system instead.');
  // backward compatibility
};
```

---

## FAZ 5: Dokumantasyon ve Standartlar (Tahmini Sure: 0.5 Sprint)

### Adim 5.1: Design System Kullanim Rehberi

- Her component icin API dokumantasyonu
- Variant ve prop aciklamalari
- Do's and Don'ts ornekleri

### Adim 5.2: Storybook veya Example Sayfasi

- Design system componentlerinin showcase'i
- Light/dark mode preview
- Variant kombinasyonlari

### Adim 5.3: Linting Kurallari

- Gluestack import'larini yasaklayan ESLint kurali
- Hardcoded renk kullanimini uyaran kural
- accessibilityLabel zorunlulugu

```javascript
// .eslintrc.js
{
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: '@gluestack-ui/themed',
          message: 'Use @/src/design-system instead of @gluestack-ui/themed',
        },
        {
          name: '@gluestack-style/react',
          message: 'Use @/src/design-system instead of @gluestack-style/react',
        },
      ],
    }],
  },
}
```

---

## Gecis Prensipleri

### 1. Incremental Migration
- **Asla** big-bang migration yapilmayacak
- Her batch sonunda uygulama calisir durumda olmali
- Feature branch'ler kucuk ve merge-ready olmali

### 2. Backward Compatibility Layer
- Gecis surecinde hem eski hem yeni component'ler calisabilir
- GluestackUIProvider FAZ 3 sonuna kadar kalabilir
- `src/components/ui/index.ts` gecici olarak design-system'e re-export yapabilir

### 3. Test Stratejisi
- Her batch icin gorsel regression testi (screenshot karsilastirma)
- Light + dark mode test
- Farkli ekran boyutlarinda test (phone + tablet)

### 4. Review Sureci
- Her PR'da en az 1 gorsel review
- Dark mode screenshot zorunlu
- Accessibility check (VoiceOver/TalkBack)

---

## Risk Analizi

| Risk | Olasilik | Etki | Azaltma |
|------|----------|------|---------|
| NativeWind className React Native uyumsuzlugu | Dusuk | Yuksek | NativeWind v4 RN 0.81 destekliyor, onceden PoC yapilacak |
| Dark mode gecislerinde gorsel bozukluk | Orta | Orta | Her batch'te gorsel test, CSS variable fallback'ler |
| Performans regresyon (re-render artisi) | Dusuk | Orta | React.memo, useMemo stratejileri korunacak |
| Migration sirasinda feature development engellenmesi | Yuksek | Yuksek | Paralel calisma: feature'lar ayri branch, migration ayri branch |
| Tailwind class cakismasi | Dusuk | Dusuk | Semantic token naming convention |

---

## Basari Kriterleri

1. **Sifir Gluestack import** - Hicbir dosyada `@gluestack-ui` veya `@gluestack-style` import'u kalmamis olmali
2. **Sifir hardcoded renk** - Tum renkler semantic token uzerinden kullanilmali
3. **%100 dark mode** - Tum ekranlar hem light hem dark'da dogru gorunmeli
4. **Accessibility** - Tum interaktif elementlerde accessibilityLabel olmali
5. **Bundle size** - Gluestack paketlerinin kaldirilmasi ile en az %10 bundle kuculme
6. **Tek kaynak** - Tum tema degerleri `design-system/tokens/` altindan yonetilmeli

---

## Tahmini Toplam Sure

| Faz | Aciklama | Sure |
|-----|----------|------|
| FAZ 0 | Hazirlik ve Altyapi | 1 Sprint |
| FAZ 1 | Primitive Componentler | 1 Sprint |
| FAZ 2 | Composite Componentler | 2 Sprint |
| FAZ 3 | Migration Sureci | 4-6 Sprint |
| FAZ 4 | Temizlik ve Optimizasyon | 1 Sprint |
| FAZ 5 | Dokumantasyon | 0.5 Sprint |
| **TOPLAM** | | **9.5 - 11.5 Sprint** |

> Not: Sprint suresi 2 hafta olarak varsayilmistir. Tek developer ile calisma durumunda sure artabilir. Paralel feature development ile birlikte yurutulecekse, migration sprint'leri uzayabilir.

---

## Mapping Tablosu: Gluestack -> Design System

| Gluestack Component | Design System Karsiligi | Notlar |
|---------------------|------------------------|--------|
| `Box` | `Box` (primitive) | className ile styling |
| `Text` | `Text` (primitive) | variant prop eklendi |
| `VStack` | `VStack` (layout) | className gap-X ile spacing |
| `HStack` | `HStack` (layout) | className gap-X ile spacing |
| `Center` | `Center` (layout) | className items-center justify-center |
| `Pressable` | `Pressable` (primitive) | accessibilityLabel zorunlu |
| `Button` + `ButtonText` | `Button` (component) | label prop, variant sistemi |
| `Input` + `InputField` | `TextInput` (component) | birlesmis API |
| `FormControl` + Label | `FormField` (component) | birlesmis API |
| `Image` | `Image` (primitive) | expo-image tabanli |
| `Icon` | `Icon` (primitive) | lucide-react-native tabanli |
| `Divider` | `Divider` (primitive) | className ile styling |
| `ScrollView` | `ScrollView` (primitive) | RN ScrollView wrapper |
| `Switch` | `Switch` (component) | accessible toggle |
| `Toast` | `Toast` (component) | custom queue sistemi |
| `View` | `Box` (primitive) | Box ile birlesti |
| `$textDark50` vb. | `text-text-primary` | CSS variable tabanli |
| `$backgroundDark50` vb. | `bg-bg-secondary` | CSS variable tabanli |
| `isDark ? X : Y` | `dark:X` class prefix | NativeWind dark mode |
| `space="sm"` | `gap-2` | Tailwind gap utility |
| `p="$4"` | `p-4` | Tailwind padding utility |
| `borderRadius="$lg"` | `rounded-lg` | Tailwind border-radius |
| `fontSize="$sm"` | `text-sm` | Tailwind font-size |
| `fontWeight="$bold"` | `font-bold` | Tailwind font-weight |

---

---

## EK ANALIZ: Derinlemesine Tespit Edilen Eksiklikler

Asagidaki bolumler, ilk analizde kapsanmayan ancak refactoring basarisi icin kritik olan alanlari icerir.

---

### EK-A: Hardcoded Renk Denetimi (Color Audit)

Projedeki **858 hardcoded renk instance'i** asagidaki dagilimi gostermektedir:

| Renk | Hex Kodu | Kullanim Sayisi | Semantik Karsiligi |
|------|----------|----------------|--------------------|
| Light border | `#E9E9E9` | **352** | `border.primary` (light) |
| Dark background | `#1A1A1A` | **200+** | `bg.secondary` (dark) |
| Dark border | `#333333` | **88** | `border.primary` (dark) |
| Bookmark active | `#829905` | **68** | `interactive.bookmarkActive` |
| Upvote active | `#E8FF6B` | **60** | `interactive.upvoteActive` |
| Error/danger | `#FF3040` | **58** | `text.error` / `interactive.danger` |
| Muted text | `#A3A3A3` | **49** | `text.tertiary` (light) |
| Brand green | `#D0F205` | **27** | `bg.brand` / `interactive.primary` |
| Purple accent | `#8B5CF6` | **24** | `interactive.secondary` |
| Secondary text | `#787878` | **18** | `text.secondary` (light) |
| Light muted | `#C7C7C7` | **5** | `text.tertiary` (light alt) |

**En cok etkilenen dosyalar:**
- `src/components/PostCards/*` (tum varyantlar)
- `src/features/feed/components/FilterBar/*`
- `src/features/post/screens/*` (create ekranlari)
- `src/components/CommentsCard/`
- `src/components/Header/`

**Aksiyon**: Token sistemi olusturulurken bu tabloyu referans olarak kullanarak, her hardcoded rengin semantik karsiligini belirle. Migration sirasinda find-and-replace icin codemod yazilabilir.

---

### EK-B: Opacity / State Token Sistemi

**155 opacity kullanimi** tespit edildi. Standart bir state token sistemi yok:

```typescript
// src/design-system/tokens/states.ts - YENI DOSYA

export const stateTokens = {
  opacity: {
    disabled: 0.5,     // Disabled butonlar, input'lar
    pressed: 0.7,      // Press/hover state
    overlay: 0.8,      // Modal/toast overlay
    inactive: 0.4,     // Inactive tab, deselected item
    full: 1,           // Normal state
  },

  // Interaction feedback
  pressScale: {
    sm: 0.97,          // Kucuk elementler (icon butonlar)
    md: 0.95,          // Normal butonlar
    lg: 0.92,          // Buyuk kartlar
  },
} as const;
```

**Mevcut pattern'ler:**
```tsx
// ONCE - hardcoded
opacity={isDisabled ? 0.5 : 1}
style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}

// SONRA - token tabanli
opacity={isDisabled ? stateTokens.opacity.disabled : stateTokens.opacity.full}
```

---

### EK-C: Icon Sistemi Konsolidasyonu

**KRITIK**: Projede **3 farkli icon kutuphanesi** birlikte kullaniliyor, **225+ icon import'u** mevcut:

| Kutuphane | Dosya Sayisi | Kullanim Alani |
|-----------|-------------|----------------|
| `react-native-heroicons` (outline + solid) | **90+** dosya | Ana icon seti |
| `lucide-react-native` | **44** dosya | Ikincil icon seti |
| `@expo/vector-icons` (Ionicons) | ~**10** dosya | Fallback iconlar |

**Sorunlar:**
1. Ayni icon farkli kutuphane varyantlariyla kullaniliyor (orn. CheckIcon vs CheckCircle)
2. Memory overhead - 3 icon font'u yukleniyor
3. Icon boyutlari standardize degil (16, 18, 20, 22, 24, 28, 32 raw degerler)
4. `figma-icons-mapping.ts` ve `featherToHeroicons.ts` mevcut ama guncel degil

**Cozum: Unified Icon Component**

```typescript
// src/design-system/primitives/Icon.tsx

import React from 'react';
import { useTheme } from '../theme/useTheme';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const iconSizes: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
};

interface IconProps {
  as: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  size?: IconSize;
  color?: string;         // Semantic token key veya hex
  className?: string;
  accessibilityLabel?: string;
}

export const Icon: React.FC<IconProps> = ({
  as: IconComponent,
  size = 'md',
  color,
  accessibilityLabel,
  ...props
}) => {
  const { colors } = useTheme();
  const resolvedSize = iconSizes[size];
  const resolvedColor = color ?? colors.text.primary;

  return (
    <IconComponent
      width={resolvedSize}
      height={resolvedSize}
      color={resolvedColor}
      accessibilityLabel={accessibilityLabel}
      {...props}
    />
  );
};
```

**Migration Stratejisi:**
1. Unified Icon component olustur
2. Heroicons'u primary olarak sec (en cok kullanilan)
3. Lucide-only iconlari Heroicons karsiliklariyla degistir
4. Ionicons kullanimlarini Heroicons'a tasi
5. Codemod ile otomatik donusum yap

**Icon boyut standardi:**
```
xs: 16px  -> Inline text icindeki iconlar
sm: 20px  -> Kucuk butonlar, list item'lar
md: 24px  -> Standard buton/action iconlari (DEFAULT)
lg: 28px  -> Header iconlari, emphasis
xl: 32px  -> Hero/feature iconlari
```

---

### EK-D: Animation Token Sistemi

**38 dosyada** `react-native-reanimated` kullanimi mevcut, ancak hicbir yerde standardize edilmis animation preset'leri yok.

```typescript
// src/design-system/tokens/animation.ts - YENI DOSYA

import { Easing } from 'react-native-reanimated';

export const animationTokens = {
  // Duration presets (ms)
  duration: {
    instant: 100,       // Micro-interactions (toggle, checkbox)
    fast: 200,          // Button press, icon state change
    normal: 300,        // Screen transitions, modals
    slow: 500,          // Complex animations, page transitions
    deliberate: 800,    // Onboarding, celebration animations
  },

  // Easing presets
  easing: {
    standard: Easing.bezier(0.4, 0.0, 0.2, 1),     // Material standard
    decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),    // Enter
    accelerate: Easing.bezier(0.4, 0.0, 1, 1),      // Exit
    sharp: Easing.bezier(0.4, 0.0, 0.6, 1),         // Quick transitions
  },

  // Spring presets
  spring: {
    gentle: { damping: 20, stiffness: 90, mass: 1 },       // Tab transitions
    bouncy: { damping: 12, stiffness: 150, mass: 0.8 },    // Fun interactions
    snappy: { damping: 25, stiffness: 300, mass: 0.5 },    // Quick response
    smooth: { damping: 30, stiffness: 120, mass: 1 },      // Smooth slide
  },

  // Common animation patterns
  preset: {
    fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
    fadeOut: { from: { opacity: 1 }, to: { opacity: 0 } },
    slideUp: { from: { translateY: 50 }, to: { translateY: 0 } },
    slideDown: { from: { translateY: 0 }, to: { translateY: 50 } },
    scaleIn: { from: { scale: 0.9 }, to: { scale: 1 } },
    scaleOut: { from: { scale: 1 }, to: { scale: 0.9 } },
  },
} as const;
```

**Custom Animation Hook:**

```typescript
// src/design-system/hooks/useAnimatedEntry.ts

import { useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { animationTokens } from '../tokens/animation';

export const useAnimatedEntry = (
  type: 'fade' | 'slideUp' | 'scaleIn' = 'fade',
  springPreset: keyof typeof animationTokens.spring = 'smooth'
) => {
  // Hook implementation
};
```

**Etkilenen dosyalar:**
- `FilterBarReanimated.tsx` - Sofistike animasyon mimarisi
- `AnimatedCounter/index.tsx` - Digit-based animasyonlar
- `TabNavigator.tsx` - Tab gecis animasyonlari (damping: 20, stiffness: 90)
- `CustomDrawer/DrawerContent.tsx` - Drawer animasyonlari
- Feature-specific bottom sheet animasyonlari

---

### EK-E: Bottom Sheet Standardizasyonu

**KRITIK**: **94+ dosyada** bottom sheet kullanimi mevcut, **6 farkli bottom sheet implementasyonu** var:

| Bottom Sheet Tipi | Dosya Sayisi | Konum |
|-------------------|-------------|-------|
| GlobalBottomSheet (context-based) | ~30 | `components/GlobalBottomSheet/` |
| KeyboardAwareBottomSheet | ~10 | `components/KeyboardAwareBottomSheet/` |
| Feature-specific sheets | ~50 | `features/*/components/*BottomSheet/` |
| ExpertBottomSheet | ~2 | `components/ExpertBottomSheet/` |
| Direct @gorhom usage | ~20 | Cesitli dosyalarda |

**Cozum: Bottom Sheet Preset Sistemi**

```typescript
// src/design-system/components/BottomSheet/BottomSheet.presets.ts

export const bottomSheetPresets = {
  // Snap point presets
  snapPoints: {
    small: ['25%'],
    medium: ['50%'],
    large: ['75%'],
    fullScreen: ['90%'],
    dynamic: undefined,  // Content-based (fitToContents)
    filter: ['45%', '80%'],
    form: ['65%', '90%'],
    detail: ['60%', '85%'],
  },

  // Keyboard behavior presets
  keyboard: {
    none: {
      keyboardBehavior: 'interactive' as const,
      keyboardBlurBehavior: 'restore' as const,
    },
    form: {
      keyboardBehavior: 'interactive' as const,
      keyboardBlurBehavior: 'restore' as const,
      android_keyboardInputMode: 'adjustResize' as const,
    },
  },

  // Visual style presets
  style: {
    default: {
      backgroundStyle: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
      handleIndicatorStyle: { backgroundColor: '#D1D5DB', width: 36 },
    },
    flat: {
      backgroundStyle: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
      handleIndicatorStyle: { display: 'none' as const },
    },
  },
} as const;
```

**Unified BottomSheet Wrapper:**

```typescript
// src/design-system/components/BottomSheet/BottomSheet.tsx

import React, { forwardRef } from 'react';
import GorhomBottomSheet, { BottomSheetProps as GorhomProps } from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/useTheme';
import { bottomSheetPresets } from './BottomSheet.presets';

type PresetName = keyof typeof bottomSheetPresets.snapPoints;

interface BottomSheetProps extends Partial<GorhomProps> {
  preset?: PresetName;
  keyboardPreset?: keyof typeof bottomSheetPresets.keyboard;
  children: React.ReactNode;
}

export const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  ({ preset = 'medium', keyboardPreset = 'none', children, ...props }, ref) => {
    const { isDark, colors } = useTheme();

    return (
      <GorhomBottomSheet
        ref={ref}
        snapPoints={bottomSheetPresets.snapPoints[preset]}
        {...bottomSheetPresets.keyboard[keyboardPreset]}
        backgroundStyle={{
          backgroundColor: colors.bg.primary,
          ...bottomSheetPresets.style.default.backgroundStyle,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border.secondary,
          ...bottomSheetPresets.style.default.handleIndicatorStyle,
        }}
        backdropComponent={(backdropProps) => (
          <BottomSheetBackdrop
            {...backdropProps}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={isDark ? 0.7 : 0.5}
          />
        )}
        {...props}
      >
        {children}
      </GorhomBottomSheet>
    );
  }
);
```

---

### EK-F: Loading / Error / Empty State Componentleri

Projede **93 dosyada** loading state, ancak **standart error/empty state component'i yok**:

```typescript
// src/design-system/components/StateView/LoadingView.tsx

interface LoadingViewProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  message,
  size = 'md',
  fullScreen = false,
}) => {
  const sizeMap = { sm: 'small', md: 'large', lg: 'large' } as const;
  return (
    <Box className={`items-center justify-center ${fullScreen ? 'flex-1' : 'py-8'}`}>
      <ActivityIndicator size={sizeMap[size]} color={colors.interactive.primary} />
      {message && <Text variant="bodySmall" className="mt-3">{message}</Text>}
    </Box>
  );
};
```

```typescript
// src/design-system/components/StateView/ErrorView.tsx

interface ErrorViewProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  fullScreen?: boolean;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  title = 'Bir hata olustu',
  message,
  onRetry,
  retryLabel = 'Tekrar Dene',
  fullScreen = false,
}) => (
  <Box className={`items-center justify-center px-6 ${fullScreen ? 'flex-1' : 'py-12'}`}>
    <ExclamationTriangleIcon size="xl" color={colors.text.error} />
    <Text variant="h4" className="mt-4 text-center">{title}</Text>
    {message && <Text variant="bodySmall" className="mt-2 text-center">{message}</Text>}
    {onRetry && (
      <Button variant="outline" label={retryLabel} onPress={onRetry} className="mt-6" />
    )}
  </Box>
);
```

```typescript
// src/design-system/components/StateView/EmptyView.tsx

interface EmptyViewProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: { label: string; onPress: () => void };
  fullScreen?: boolean;
}

export const EmptyView: React.FC<EmptyViewProps> = ({
  title = 'Icerik bulunamadi',
  message,
  action,
  fullScreen = false,
}) => (
  <Box className={`items-center justify-center px-6 ${fullScreen ? 'flex-1' : 'py-12'}`}>
    <InboxIcon size="xl" color={colors.text.tertiary} />
    <Text variant="h4" className="mt-4 text-center text-text-tertiary">{title}</Text>
    {message && <Text variant="caption" className="mt-2 text-center">{message}</Text>}
    {action && (
      <Button variant="primary" label={action.label} onPress={action.onPress} className="mt-6" />
    )}
  </Box>
);
```

---

### EK-G: Form Field Abstraction Sistemi

**25 dosyada** react-hook-form, **6 Zod schema** mevcut ama **birlesmis form field component'i yok**:

```typescript
// src/design-system/components/FormField/FormField.tsx

import React from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';

interface FormFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  error?: FieldError;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  control,
  name,
  label,
  placeholder,
  error,
  required,
  secureTextEntry,
  keyboardType = 'default',
  helperText,
  disabled,
  leftIcon,
  rightIcon,
  className,
}) => (
  <Box className={`mb-4 ${className ?? ''}`}>
    {/* Label */}
    <Text variant="label" className="mb-1.5">
      {label}
      {required && <Text className="text-text-error"> *</Text>}
    </Text>

    {/* Input */}
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <Box className={`
          flex-row items-center rounded-lg border px-3 py-2.5
          ${error ? 'border-border-error' : 'border-border-primary'}
          ${disabled ? 'opacity-50' : ''}
          bg-bg-tertiary
        `}>
          {leftIcon && <Box className="mr-2">{leftIcon}</Box>}
          <TextInput
            className="flex-1 text-base text-text-primary"
            placeholder={placeholder}
            placeholderTextColor={colors.text.tertiary}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            editable={!disabled}
            accessibilityLabel={label}
            accessibilityHint={helperText}
          />
          {rightIcon && <Box className="ml-2">{rightIcon}</Box>}
        </Box>
      )}
    />

    {/* Error / Helper */}
    {error ? (
      <Text variant="caption" className="mt-1 text-text-error">{error.message}</Text>
    ) : helperText ? (
      <Text variant="caption" className="mt-1">{helperText}</Text>
    ) : null}
  </Box>
);
```

---

### EK-H: Responsive Design Sistemi

**67 dosyada** `Dimensions` / `useWindowDimensions` kullanimi mevcut, breakpoint sistemi yok:

```typescript
// src/design-system/hooks/useResponsive.ts

import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

const breakpoints: Record<Breakpoint, number> = {
  sm: 0,       // Kucuk telefonlar (< 375px)
  md: 375,     // Normal telefonlar (375-768px) - iPhone 6/7/8+
  lg: 768,     // Tabletler (768-1024px) - iPad Mini
  xl: 1024,    // Buyuk tabletler / web (> 1024px)
};

interface ResponsiveValues {
  breakpoint: Breakpoint;
  isPhone: boolean;
  isTablet: boolean;
  width: number;
  height: number;
  isLandscape: boolean;
}

export const useResponsive = (): ResponsiveValues => {
  const { width, height } = useWindowDimensions();

  const breakpoint: Breakpoint =
    width >= breakpoints.xl ? 'xl' :
    width >= breakpoints.lg ? 'lg' :
    width >= breakpoints.md ? 'md' : 'sm';

  return {
    breakpoint,
    isPhone: width < breakpoints.lg,
    isTablet: width >= breakpoints.lg,
    width,
    height,
    isLandscape: width > height,
  };
};

// Responsive value helper
export function responsive<T>(
  breakpoint: Breakpoint,
  values: Partial<Record<Breakpoint, T>> & { sm: T }
): T {
  const orderedKeys: Breakpoint[] = ['xl', 'lg', 'md', 'sm'];
  for (const key of orderedKeys) {
    if (breakpoints[key] <= breakpoints[breakpoint] && values[key] !== undefined) {
      return values[key]!;
    }
  }
  return values.sm;
}
```

**Grid sistemi icin column sayisi:**
```typescript
// Ornek kullanim
const { breakpoint } = useResponsive();
const columns = responsive(breakpoint, { sm: 2, md: 3, lg: 4, xl: 5 });
```

---

### EK-I: Safe Area Wrapper Component

**329 dosyada** raw `useSafeAreaInsets` kullanimi. Standart bir wrapper yok:

```typescript
// src/design-system/layout/SafeArea.tsx

import React from 'react';
import { View, ViewProps } from 'react-native';
import { useSafeAreaInsets, Edge } from 'react-native-safe-area-context';

interface SafeAreaProps extends ViewProps {
  edges?: Edge[];       // ['top', 'bottom', 'left', 'right']
  className?: string;
  mode?: 'padding' | 'margin';
}

export const SafeArea: React.FC<SafeAreaProps> = ({
  edges = ['top', 'bottom'],
  className,
  mode = 'padding',
  style,
  children,
  ...props
}) => {
  const insets = useSafeAreaInsets();

  const safeAreaStyle = {
    ...(edges.includes('top') && { [`${mode}Top`]: insets.top }),
    ...(edges.includes('bottom') && { [`${mode}Bottom`]: insets.bottom }),
    ...(edges.includes('left') && { [`${mode}Left`]: insets.left }),
    ...(edges.includes('right') && { [`${mode}Right`]: insets.right }),
  };

  return (
    <View className={`flex-1 ${className ?? ''}`} style={[safeAreaStyle, style]} {...props}>
      {children}
    </View>
  );
};

// Screen wrapper - en sik kullanilacak pattern
export const ScreenContainer: React.FC<SafeAreaProps> = ({
  edges = ['top'],
  children,
  className,
  ...props
}) => (
  <SafeArea edges={edges} className={`flex-1 bg-bg-primary ${className ?? ''}`} {...props}>
    {children}
  </SafeArea>
);
```

---

### EK-J: Toast Sistemi Konsolidasyonu

**3 farkli toast implementasyonu** mevcut. Tekil sisteme gecis gerekli:

| Mevcut Toast | Dosya Sayisi | Kaynak |
|-------------|-------------|--------|
| `useToast()` (Gluestack) | **44** dosya | `@gluestack-ui/themed` |
| `showCustomToast()` | **~30** dosya | `src/components/CustomToast/` |
| `NotificationToast` | **~5** dosya | `src/components/NotificationToast/` |

**Hedef: Tek toast sistemi**

```typescript
// src/design-system/components/Toast/toast.service.ts

type ToastAction = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  title: string;
  description?: string;
  action?: ToastAction;
  duration?: number;           // default: 3000ms
  position?: 'top' | 'bottom'; // default: 'top'
  dismissible?: boolean;       // default: true
  onDismiss?: () => void;
}

class ToastService {
  private listeners: Set<(config: ToastConfig) => void> = new Set();

  subscribe(listener: (config: ToastConfig) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  show(config: ToastConfig) {
    this.listeners.forEach(listener => listener(config));
  }

  success(title: string, description?: string) {
    this.show({ title, description, action: 'success' });
  }

  error(title: string, description?: string) {
    this.show({ title, description, action: 'error', duration: 5000 });
  }

  warning(title: string, description?: string) {
    this.show({ title, description, action: 'warning' });
  }

  info(title: string, description?: string) {
    this.show({ title, description, action: 'info' });
  }
}

export const toast = new ToastService();
```

---

### EK-K: Gradient ve Blur Effect Sistemi

Projede `expo-linear-gradient` (**4 dosyada**) ve `expo-blur` (**2 dosyada**) kurulu ama cok az kullaniliyor. `expo-glass-effect` **kurulu ama 0 kullanim** (sadece TabNavigator'da GlassView olarak).

```typescript
// src/design-system/tokens/gradients.ts

export const gradientTokens = {
  // Brand gradients
  brand: {
    colors: ['#D0F205', '#829905'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  // Premium/VIP gradient
  premium: {
    colors: ['#8B5CF6', '#6366F1'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Overlay gradients (resim uzerinde metin icin)
  overlayBottom: {
    colors: ['transparent', 'rgba(0,0,0,0.7)'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  overlayTop: {
    colors: ['rgba(0,0,0,0.7)', 'transparent'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  // Skeleton shimmer
  shimmer: {
    light: { colors: ['#F3F4F6', '#E5E7EB', '#F3F4F6'] },
    dark: { colors: ['#334155', '#475569', '#334155'] },
  },
} as const;
```

```typescript
// src/design-system/components/Gradient/Gradient.tsx

import { LinearGradient } from 'expo-linear-gradient';
import { gradientTokens } from '../../tokens/gradients';

interface GradientProps {
  preset: keyof typeof gradientTokens;
  className?: string;
  children?: React.ReactNode;
}

export const Gradient: React.FC<GradientProps> = ({ preset, className, children }) => {
  const config = gradientTokens[preset];
  return (
    <LinearGradient
      colors={config.colors}
      start={config.start}
      end={config.end}
      className={className}
    >
      {children}
    </LinearGradient>
  );
};
```

---

### EK-L: Shadow Token Sistemi (Cross-Platform)

**155+ shadow instance'i** mevcut, iOS ve Android farkli shadow API'leri kullaniyor:

```typescript
// src/design-system/tokens/shadows.ts

import { Platform, ViewStyle } from 'react-native';

type ShadowLevel = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const shadowDefinitions: Record<ShadowLevel, {
  ios: Partial<ViewStyle>;
  android: { elevation: number };
}> = {
  none: {
    ios: { shadowOpacity: 0 },
    android: { elevation: 0 },
  },
  xs: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 1 },
  },
  sm: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    android: { elevation: 2 },
  },
  md: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    android: { elevation: 4 },
  },
  lg: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16 },
    android: { elevation: 8 },
  },
  xl: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24 },
    android: { elevation: 12 },
  },
};

export const getShadow = (level: ShadowLevel): ViewStyle => {
  const shadow = shadowDefinitions[level];
  return Platform.OS === 'ios' ? shadow.ios : shadow.android;
};

// Hook kullanimi icin
export const useShadow = (level: ShadowLevel): ViewStyle => getShadow(level);
```

---

### EK-M: StatusBar / NavigationBar / SplashScreen Tema Entegrasyonu

Bu 3 sistem UI elementi tema gecislerinde senkronize olmali:

```typescript
// src/design-system/theme/useSystemUI.ts

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from './useTheme';

export const useSystemUI = () => {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    // Android navigation bar
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.bg.primary);
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark, colors.bg.primary]);

  // StatusBar props (component olarak render edilecek)
  const statusBarProps = {
    style: (isDark ? 'light' : 'dark') as 'light' | 'dark',
    backgroundColor: colors.bg.primary,
    translucent: true,
  };

  return { statusBarProps };
};
```

---

### EK-N: Platform Utility Helpers

**34 dosyada** `Platform.OS` / `Platform.select` raw kullanimi mevcut:

```typescript
// src/design-system/utils/platform.ts

import { Platform, Dimensions, PixelRatio } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// iOS version check (orn. iOS 15+ blur efektleri)
export const isIOSVersionOrAbove = (version: number): boolean =>
  isIOS && parseInt(Platform.Version as string, 10) >= version;

// Pixel density aware sizing
export const normalize = (size: number): number => {
  const scale = Dimensions.get('window').width / 375; // iPhone 6/7/8 base
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

// Platform-specific value
export function platformSelect<T>(config: { ios: T; android: T; web?: T }): T {
  if (isWeb && config.web !== undefined) return config.web;
  return isIOS ? config.ios : config.android;
}

// Has notch/dynamic island
export const hasNotch = (): boolean => {
  if (!isIOS) return false;
  const { height, width } = Dimensions.get('window');
  return (
    (height >= 812 || width >= 812) // iPhone X+
  );
};
```

---

### EK-O: Codemod Stratejisi (Otomatik Migration)

Projede `jscodeshift` (**v0.15.2**) devDependencies'de mevcut ama **hicbir codemod yazilmamis**. Bu, migration surecini dramatik olarak hizlandirabilir:

```
codemods/
├── gluestack-to-design-system.ts     # Gluestack import'larini design-system'e cevir
├── hardcoded-colors-to-tokens.ts     # Hardcoded renkleri token'lara cevir
├── isDark-to-dark-prefix.ts          # isDark ternary'leri dark: class'a cevir
├── icon-consolidation.ts             # Icon kutuphanelerini birlestir
├── accessibility-labels.ts           # Pressable'lara accessibilityLabel ekle
└── README.md
```

**Ornek Codemod: Gluestack Import Donusumu**

```typescript
// codemods/gluestack-to-design-system.ts

import { API, FileInfo, JSCodeshift } from 'jscodeshift';

const GLUESTACK_MAPPING: Record<string, string> = {
  Box: 'Box',
  Text: 'Text',
  VStack: 'VStack',
  HStack: 'HStack',
  Pressable: 'Pressable',
  Button: 'Button',
  ButtonText: null,  // Button component'ine merge edildi
  Center: 'Center',
  ScrollView: 'ScrollView',
  View: 'Box',
  Input: null,       // TextInput'a merge edildi
  InputField: null,  // TextInput'a merge edildi
  Image: 'Image',
  Icon: 'Icon',
  Divider: 'Divider',
};

export default function transformer(file: FileInfo, api: API) {
  const j: JSCodeshift = api.jscodeshift;
  const root = j(file.source);

  // Find @gluestack-ui/themed imports
  root.find(j.ImportDeclaration, {
    source: { value: '@gluestack-ui/themed' }
  }).forEach(path => {
    // Transform specifiers
    const newSpecifiers = path.node.specifiers
      ?.filter(s => s.type === 'ImportSpecifier' && GLUESTACK_MAPPING[s.imported.name])
      .map(s => j.importSpecifier(
        j.identifier(GLUESTACK_MAPPING[s.imported.name])
      ));

    if (newSpecifiers && newSpecifiers.length > 0) {
      // Replace with design-system import
      j(path).replaceWith(
        j.importDeclaration(newSpecifiers, j.literal('@/src/design-system'))
      );
    }
  });

  return root.toSource();
}
```

**Calistirma:**
```bash
npx jscodeshift --parser=tsx --transform=codemods/gluestack-to-design-system.ts src/
```

**Tahmini etki**: Manuel migration isini **%40-50 oraninda** azaltabilir.

---

### EK-P: Gesture Handler Abstraction

**155 gesture handler kullanimi** mevcut (ozellikle tab swiping, bottom sheet, carousel):

```typescript
// src/design-system/hooks/useSwipeGesture.ts

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;       // default: 50
  enabled?: boolean;        // default: true
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  enabled = true,
}: SwipeConfig) => {
  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onEnd((event) => {
      'worklet';
      const { translationX, translationY, velocityX, velocityY } = event;

      if (Math.abs(translationX) > Math.abs(translationY)) {
        // Horizontal swipe
        if (translationX > threshold && onSwipeRight) runOnJS(onSwipeRight)();
        if (translationX < -threshold && onSwipeLeft) runOnJS(onSwipeLeft)();
      } else {
        // Vertical swipe
        if (translationY > threshold && onSwipeDown) runOnJS(onSwipeDown)();
        if (translationY < -threshold && onSwipeUp) runOnJS(onSwipeUp)();
      }
    });

  return { gesture, GestureDetector };
};
```

---

### EK-Q: Context Menu Kutuphanesi Temizligi

Projede **3 context menu kutuphanesi** kurulu ama kullanim dagilimi tutarsiz:

| Kutuphane | Durum | Aksiyon |
|-----------|-------|---------|
| `zeego` v3.0.6 | Kurulu, **0 kullanim** | KALDIR |
| `@react-native-menu/menu` v1.2.2 | Kurulu, **0 kullanim** | KALDIR |
| `react-native-context-menu-view` v1.21.0 | Kurulu, aktif kullaniliyor | KORU |

**Aksiyon**: Kullanilmayan 2 kutuphaneni `npm uninstall` ile kaldir, bundle size'i dusurecektir.

---

### EK-R: Guncellenmis Hedef Mimari (Folder Structure v2)

Ek analizler sonrasinda genisletilmis folder structure:

```
src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts              # Semantic color tokens (light/dark)
│   │   ├── typography.ts          # Font sizes, weights, line heights
│   │   ├── spacing.ts             # Spacing scale
│   │   ├── radii.ts               # Border radius tokens
│   │   ├── shadows.ts             # Cross-platform shadow tokens    [YENI]
│   │   ├── animation.ts           # Animation duration/easing/spring [YENI]
│   │   ├── gradients.ts           # Gradient presets                 [YENI]
│   │   ├── states.ts              # Opacity/press/disabled tokens    [YENI]
│   │   └── index.ts
│   │
│   ├── theme/
│   │   ├── ThemeProvider.tsx
│   │   ├── theme.config.ts
│   │   ├── useTheme.ts
│   │   ├── useThemeColor.ts
│   │   ├── useSystemUI.ts         # StatusBar/NavBar/Splash sync    [YENI]
│   │   └── index.ts
│   │
│   ├── primitives/
│   │   ├── Box.tsx
│   │   ├── Text.tsx
│   │   ├── Pressable.tsx
│   │   ├── Image.tsx
│   │   ├── Icon.tsx               # Unified icon wrapper            [GENISLETILDI]
│   │   ├── Divider.tsx
│   │   ├── ScrollView.tsx
│   │   ├── Gradient.tsx           # LinearGradient wrapper          [YENI]
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Toast/                 # Unified toast system            [GENISLETILDI]
│   │   │   ├── Toast.tsx
│   │   │   ├── ToastProvider.tsx
│   │   │   ├── toast.service.ts   # Imperative toast API            [YENI]
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   ├── BottomSheet/           # @gorhom wrapper + presets       [YENI]
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── BottomSheet.presets.ts
│   │   │   └── index.ts
│   │   ├── Skeleton/
│   │   ├── FormField/             # react-hook-form integrated      [GENISLETILDI]
│   │   │   ├── FormField.tsx
│   │   │   ├── ControlledInput.tsx
│   │   │   └── index.ts
│   │   ├── StateView/             # Loading/Error/Empty states      [YENI]
│   │   │   ├── LoadingView.tsx
│   │   │   ├── ErrorView.tsx
│   │   │   ├── EmptyView.tsx
│   │   │   └── index.ts
│   │   ├── Chip/
│   │   ├── Switch/
│   │   └── index.ts
│   │
│   ├── layout/
│   │   ├── Stack.tsx
│   │   ├── Center.tsx
│   │   ├── Container.tsx
│   │   ├── SafeArea.tsx           # Safe area + ScreenContainer    [YENI]
│   │   └── index.ts
│   │
│   ├── hooks/                     # Design system hooks             [YENI KLASOR]
│   │   ├── useResponsive.ts       # Breakpoint detection
│   │   ├── useShadow.ts           # Cross-platform shadows
│   │   ├── useAnimatedEntry.ts    # Entry animation presets
│   │   ├── useSwipeGesture.ts     # Gesture handler abstraction
│   │   └── index.ts
│   │
│   ├── utils/                     # Design system utilities         [YENI KLASOR]
│   │   ├── platform.ts            # Platform detection helpers
│   │   ├── normalize.ts           # Pixel density normalization
│   │   └── index.ts
│   │
│   ├── accessibility/
│   │   ├── a11y.utils.ts
│   │   ├── useA11y.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── codemods/                       # Migration automation           [YENI KLASOR]
│   ├── gluestack-to-design-system.ts
│   ├── hardcoded-colors-to-tokens.ts
│   ├── isDark-to-dark-prefix.ts
│   ├── icon-consolidation.ts
│   ├── accessibility-labels.ts
│   └── README.md
```

---

### EK-S: Guncellenmis Tahmini Sure Tablosu

| Faz | Aciklama | Orijinal Sure | Guncellenmis Sure | Eklenen Is |
|-----|----------|---------------|-------------------|-----------|
| FAZ 0 | Hazirlik ve Altyapi | 1 Sprint | **1.5 Sprint** | Animation, gradient, shadow, state token'lari; codemod altyapisi |
| FAZ 1 | Primitive Componentler | 1 Sprint | **1.5 Sprint** | Icon wrapper, Gradient, SafeArea |
| FAZ 2 | Composite Componentler | 2 Sprint | **3 Sprint** | BottomSheet presets, StateView (Loading/Error/Empty), FormField, Toast service, responsive hooks |
| FAZ 3 | Migration Sureci | 4-6 Sprint | **3-5 Sprint** | Codemod ile %40 hizlanma |
| FAZ 4 | Temizlik | 1 Sprint | **1.5 Sprint** | Kullanilmayan paketler (zeego, @react-native-menu), icon kutuphaneleri |
| FAZ 5 | Dokumantasyon | 0.5 Sprint | **1 Sprint** | Codemod guide, animation catalog, responsive breakpoint guide |
| **TOPLAM** | | **9.5-11.5 Sprint** | **11.5-13.5 Sprint** | |

> **Not**: Codemod stratejisi FAZ 3'u 1-2 sprint kisaltirken, eklenen token sistemleri ve yeni componentler toplam sureyi ~2 sprint uzatmaktadir. Net etki: daha kapsamli ve suerdueruelebilir bir design system.

---

### EK-T: Guncellenmis Basari Kriterleri

Orijinal kriterlere ek olarak:

| # | Kriter | Olcum |
|---|--------|-------|
| 7 | **Tek icon kutuphanesi** | Sadece heroicons + design-system Icon wrapper |
| 8 | **Sifir raw Dimensions** | Tum responsive logic `useResponsive` uzerinden |
| 9 | **Sifir raw useSafeAreaInsets** | Tum safe area `SafeArea` / `ScreenContainer` uzerinden |
| 10 | **Sifir hardcoded opacity** | Tum state opacity'leri `stateTokens.opacity` uzerinden |
| 11 | **Tek toast sistemi** | `toast.success()` / `toast.error()` API |
| 12 | **BottomSheet preset kullanimi** | Tum bottom sheet'ler `BottomSheet` wrapper uzerinden |
| 13 | **Animation token kullanimi** | Tum animasyonlar `animationTokens` uzerinden |
| 14 | **Kullanilmayan paket sifir** | zeego, @react-native-menu kaldirilmis |

---

---

## EK-U: Global Error Handler Sistemi

### Mevcut Durum: Kritik Eksiklikler

| Alan | Durum | Ciddiyet |
|------|--------|----------|
| ErrorBoundary (React) | Mevcut ama sadece console.error | ORTA |
| Global JS Exception Handler | `react-native-exception-handler` KURULU ama **KULLANILMIYOR** | **KRITIK** |
| Unhandled Promise Rejection | Global handler YOK | **KRITIK** |
| Crash Reporting (Sentry/Crashlytics) | **HIC YOK** - `.sentryclirc.example` var ama entegrasyon yok | **KRITIK** |
| API Error Interceptor | Kapsamli (interceptors.ts 392 satir) | Iyi |
| React Query Error | Global retry + offline-aware | Iyi |
| Socket Error | Sadece loglama, auto-reconnect YOK | ORTA |
| Silent Fail Sayisi | **12+ konum** (catch bloklari bos veya sadece console) | ORTA |
| Network Offline Banner | YOK | ORTA |
| try/catch Coverage | 1,319 statement / 149 dosya ama tutarsiz | ORTA |

### Detayli Bulgular

**1. `react-native-exception-handler` v2.10.10 kurulu ama 0 kullanim:**
- `package.json`'da var, ama `setJSExceptionHandler` ve `setNativeExceptionHandler` hic cagrilmamis
- Ya implement et ya da kaldir (dead dependency)

**2. Silent Fail Ornekleri (12+ konum):**

```typescript
// SocketService - line 112-117: BAG LANTI HATASI YUTULMUS
try {
  const accessToken = await TokenService.getAccessToken();
  if (!accessToken) return; // Kullanici haberdar edilmiyor
} catch (error) {
  return; // Loglama bile yok
}

// AppStore logout - line 321: QueryClient clear hatasi yutulmus
try {
  const { queryClient } = require('../providers/QueryProvider');
  queryClient.clear();
} catch (queryError) {
  // "Silent fail (kritik degil)" - ama loglama bile yok
}

// NotificationProvider - 404 hatalari sessizce yutulmus
// Wallet olusturma - hata olursa sessizce devam
```

**3. Sentry yorumu var ama entegrasyon yok (interceptors.ts line 372):**
```typescript
// "Sentry Error Tracking - Sadece kritik hatalar icin"
// Ama aslinda sadece console.error yapiliyor, Sentry paketi yok
```

### Hedef: Katmanli Error Handler Mimarisi

```
src/
├── error-handling/
│   ├── GlobalErrorBoundary.tsx      # App-level React error boundary
│   ├── FeatureErrorBoundary.tsx     # Feature-level error boundary
│   ├── globalExceptionHandler.ts    # JS + Native exception handlers
│   ├── errorReporting.ts            # Sentry/Crashlytics integration
│   ├── ErrorRecovery.tsx            # Error recovery UI (retry, reload)
│   ├── NetworkStatusProvider.tsx    # Offline/online banner
│   ├── hooks/
│   │   ├── useErrorHandler.ts       # Per-component error handling
│   │   └── useNetworkStatus.ts      # Network state hook
│   └── index.ts
```

### Adim U.1: Global Exception Handler

```typescript
// src/error-handling/globalExceptionHandler.ts

import {
  setJSExceptionHandler,
  setNativeExceptionHandler,
} from 'react-native-exception-handler';
import { errorReporter } from './errorReporting';

export const initializeGlobalErrorHandlers = () => {
  // 1. JS Exception Handler (UI thread errors)
  setJSExceptionHandler((error, isFatal) => {
    errorReporter.captureException(error, {
      level: isFatal ? 'fatal' : 'error',
      tags: { handler: 'global-js', fatal: String(isFatal) },
    });

    if (isFatal) {
      // Fatal: kullaniciya "uygulama beklenmeyen hata" goster
      // ve yeniden baslatma secenegi sun
      Alert.alert(
        'Beklenmeyen Hata',
        'Uygulama beklenmeyen bir hata ile karsilasti. Yeniden baslatmak ister misiniz?',
        [{ text: 'Yeniden Baslat', onPress: () => RNRestart.restart() }]
      );
    }
  }, true); // true = exceptionhandler replaces default RN handler

  // 2. Native Exception Handler (native crash'ler)
  setNativeExceptionHandler(
    (errorString) => {
      errorReporter.captureMessage(errorString, {
        level: 'fatal',
        tags: { handler: 'global-native' },
      });
    },
    false, // forceAppQuit on Android
    true   // executeDefaultHandler
  );

  // 3. Unhandled Promise Rejection
  const originalHandler = global.ErrorUtils?.getGlobalHandler();

  if (global.ErrorUtils) {
    global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      errorReporter.captureException(error, {
        level: isFatal ? 'fatal' : 'error',
        tags: { handler: 'error-utils' },
      });
      originalHandler?.(error, isFatal);
    });
  }
};
```

### Adim U.2: Error Reporting Service (Sentry Entegrasyonu)

```typescript
// src/error-handling/errorReporting.ts

import * as Sentry from '@sentry/react-native';
// veya: import crashlytics from '@react-native-firebase/crashlytics';

interface ErrorContext {
  level?: 'fatal' | 'error' | 'warning' | 'info';
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: { id: string; email?: string };
}

class ErrorReporter {
  private initialized = false;

  initialize(dsn: string) {
    Sentry.init({
      dsn,
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      enableAutoSessionTracking: true,
      attachStacktrace: true,
      beforeSend(event) {
        // PII filtreleme
        if (event.user) {
          delete event.user.ip_address;
        }
        return event;
      },
    });
    this.initialized = true;
  }

  setUser(user: { id: string; email?: string }) {
    if (!this.initialized) return;
    Sentry.setUser(user);
  }

  captureException(error: Error | unknown, context?: ErrorContext) {
    if (!this.initialized) {
      console.error('[ErrorReporter] Not initialized, error:', error);
      return;
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        Sentry.setTag(key, value);
      });
    }

    Sentry.captureException(error, {
      level: context?.level || 'error',
      extra: context?.extra,
    });
  }

  captureMessage(message: string, context?: ErrorContext) {
    if (!this.initialized) return;
    Sentry.captureMessage(message, context?.level || 'info');
  }

  // Performance monitoring
  startTransaction(name: string, op: string) {
    return Sentry.startTransaction({ name, op });
  }

  // Breadcrumb (kullanici aksiyon izleme)
  addBreadcrumb(category: string, message: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({ category, message, data, level: 'info' });
  }
}

export const errorReporter = new ErrorReporter();
```

### Adim U.3: Feature-Level Error Boundary

```typescript
// src/error-handling/FeatureErrorBoundary.tsx

import React, { Component, ErrorInfo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { errorReporter } from './errorReporting';

interface Props {
  children: React.ReactNode;
  featureName: string;        // orn: 'feed', 'profile', 'wallet'
  fallback?: React.ReactNode;  // Custom fallback UI
  onError?: (error: Error) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorReporter.captureException(error, {
      tags: { feature: this.props.featureName, boundary: 'feature' },
      extra: { componentStack: errorInfo.componentStack },
    });
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
            Bir sorun olustu
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
            {this.props.featureName} yuklenirken bir hata olustu.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{ backgroundColor: '#D0F205', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Tekrar dene"
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>Tekrar Dene</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
```

**Kullanim (her feature navigator'inda):**
```tsx
// src/features/feed/navigation.tsx
<FeatureErrorBoundary featureName="feed">
  <FeedScreen />
</FeatureErrorBoundary>
```

### Adim U.4: Network Status Provider (Offline Banner)

```typescript
// src/error-handling/NetworkStatusProvider.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { View, Text, Animated } from 'react-native';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
});

export const useNetworkStatus = () => useContext(NetworkContext);

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NetworkContextType>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: null,
  });

  const [showBanner, setShowBanner] = useState(false);
  const bannerOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      const isConnected = netState.isConnected ?? true;
      setState({
        isConnected,
        isInternetReachable: netState.isInternetReachable,
        connectionType: netState.type,
      });

      if (!isConnected) {
        setShowBanner(true);
        Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      } else if (showBanner) {
        // Baglanti geri geldi - 2sn sonra banner'i kapat
        setTimeout(() => {
          Animated.timing(bannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            setShowBanner(false);
          });
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [showBanner]);

  return (
    <NetworkContext.Provider value={state}>
      {children}
      {showBanner && (
        <Animated.View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            backgroundColor: state.isConnected ? '#16A34A' : '#DC2626',
            paddingVertical: 4, paddingHorizontal: 16, opacity: bannerOpacity,
            zIndex: 9999,
          }}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text style={{ color: '#FFFFFF', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>
            {state.isConnected ? 'Baglanti yeniden kuruldu' : 'Internet baglantisi yok'}
          </Text>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
};
```

### Adim U.5: Paketin Kurulumu

```bash
# Sentry (crash reporting)
npm install @sentry/react-native

# Network detection (offline banner)
npm install @react-native-community/netinfo

# react-native-exception-handler zaten kurulu
```

### Error Handler Entegrasyon Sirasi

1. `App.tsx`'de `initializeGlobalErrorHandlers()` cagir
2. `errorReporter.initialize(SENTRY_DSN)` cagir
3. Login sonrasi `errorReporter.setUser()` cagir
4. Her feature navigator'ini `FeatureErrorBoundary` ile sar
5. `NetworkStatusProvider`'i provider tree'ye ekle
6. React Query `onError` callback'lerine `errorReporter.captureException()` ekle
7. Socket disconnect'e auto-reconnect + user notification ekle

---

## EK-V: Kapsamli Accessibility (Erisilebilirlik) Sistemi

### Mevcut Durum: KRITIK SEVIYEDE YETERSIZ

**Genel Tablo:**

| Ozellik | Etkilenen Dosya | Kapsam | Ciddiyet |
|---------|----------------|--------|----------|
| `accessibilityLabel` | 240+ interaktif element | **%0** | **KRITIK** |
| `accessibilityRole` | 200+ element | **%0** | **KRITIK** |
| `accessibilityState` | 150+ element | **%0** | **KRITIK** |
| `accessibilityHint` | 100+ element | **%0** | YUKSEK |
| `accessibilityValue` | 50+ element | **%0** | ORTA |
| `accessibilityLiveRegion` | 30+ dinamik icerik | **%0** | **KRITIK** |
| Renk Kontrasti | Brand rengi #D0F205 | **BASARISIZ** | **KRITIK** |
| Dokunma Hedef Boyutu | 10+ element | 44px altinda | YUKSEK |
| Font Olcekleme | Tum Text | Desteklenmiyor | YUKSEK |
| Reduced Motion | 797+ animasyon | Desteklenmiyor | **KRITIK** |
| Gorsel Alt Metni | 1,744 gorsel | **%10.5** | **KRITIK** |
| Form Erisilebilirlik | 26+ form | Kismi | YUKSEK |
| Hata Duyurusu | 124 dosya | Duyurulmuyor | YUKSEK |
| Focus Yonetimi | Tum uygulama | Yok | YUKSEK |
| Ekran Okuyucu Testi | N/A | Kanit yok | **KRITIK** |

### Engel Turleri ve Cozum Haritasi

#### V.1: Gorme Engelliler (Kor / Agir Gorme Kaybi)

**Sorun**: VoiceOver (iOS) ve TalkBack (Android) ile uygulama kullanilabilir degil.

**Etkilenen Kullanici Grubu**: ~2.2 milyar kisinin gorme bozuklugu var (WHO)

**Gerekli Aksiyonlar:**

```typescript
// a) HER interaktif elemente accessibilityLabel EKLE
// ONCE:
<Pressable onPress={handleLike}>
  <HeartIcon width={24} height={24} />
</Pressable>

// SONRA:
<Pressable
  onPress={handleLike}
  accessibilityRole="button"
  accessibilityLabel={isLiked ? "Begeniyi kaldir" : "Begeni"}
  accessibilityState={{ selected: isLiked }}
  accessibilityHint="Gonderiyi begenme durumunu degistirir"
>
  <HeartIcon width={24} height={24} />
</Pressable>
```

```typescript
// b) Gorsel icerik icin alt metin
// ONCE:
<Image source={avatarSource} alt={data.user?.name || 'User'} />

// SONRA:
<Image
  source={avatarSource}
  accessibilityLabel={`${data.user?.name || 'Kullanici'} profil resmi`}
  accessibilityRole="image"
/>
```

```typescript
// c) Dinamik icerik duyurusu (toast, hata, basari)
// ONCE:
showCustomToast(toast, { title: 'Giris basarili', action: 'success' });

// SONRA: Toast component'ine eklenmeli:
<View
  accessibilityRole="alert"
  accessibilityLiveRegion="assertive" // Aninda duyurulur
>
  <Text>{title}</Text>
</View>
```

```typescript
// d) Baslik hiyerarsisi
// ONCE:
<Text fontSize="$2xl" fontWeight="$bold">Giris Yap</Text>

// SONRA:
<Text
  variant="h1"
  accessibilityRole="header"
>
  Giris Yap
</Text>
```

**Kapsamli Checklist (Gorme Engelli):**

```
[ ] Tum Pressable/TouchableOpacity'lere accessibilityLabel ekle (240+ dosya)
[ ] Tum button'lara accessibilityRole="button" ekle
[ ] Tum baslik Text'lere accessibilityRole="header" ekle
[ ] Tum tab'lara accessibilityRole="tab" + accessibilityState.selected ekle
[ ] Tum form input'lara accessibilityLabel + accessibilityHint ekle
[ ] Tum Image'lara accessibilityLabel (alt text) ekle (1,744 gorsel)
[ ] Toast/notification'lara accessibilityLiveRegion="assertive" ekle
[ ] Dekoratif gorsel/icon'lari accessibilityElementsHidden={true} ile gizle
[ ] Bottom sheet/modal actıiginda focus'u icerige tasi
[ ] Bottom sheet/modal kapandiginda focus'u tetikleyiciye dondur
[ ] Liste elemanlarini accessibilityRole="list" / "listitem" ile isaretleme
[ ] Sayfa degisikliklerinde ekran okuyucu duyurusu yap
```

#### V.2: Az Gorenler (Dusuk Gorme / Bulanik Gorme)

**Sorun**: Font buyutme destegi yok, bazi renk kontrastlari yetersiz.

**a) Font Olcekleme Destegi:**

```typescript
// src/design-system/primitives/Text.tsx - GUNCELLENMIS

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
  allowFontScaling?: boolean;      // default: true
  maxFontSizeMultiplier?: number;  // default: 1.5
}

export const Text = React.forwardRef<RNText, TextProps>(
  ({ allowFontScaling = true, maxFontSizeMultiplier = 1.5, ...props }, ref) => (
    <RNText
      ref={ref}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
    />
  )
);
```

**b) Minimum Dokunma Hedef Boyutu:**

```typescript
// src/design-system/accessibility/a11y.constants.ts

export const A11Y_MIN_TOUCH_TARGET = {
  width: 44,   // iOS: 44pt, Android: 48dp (44 ortak minimum)
  height: 44,
};

// Kucuk elemanlar icin hitSlop kullan:
export const defaultHitSlop = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
};
```

**Sorunlu Alanlar (44px altinda):**
- Filter butonlari: 26px yukseklik -> `hitSlop` ekle veya boyut arttir
- Carousel noktalari: 8x8px -> sadece gorsel, dokunmatik degil yap
- Star rating iconu: kucuk -> minimum 44px alan ver
- Header icon butonlari: bazi 22x22 -> `hitSlop` ile genislet

**c) Yuksek Kontrast Modu:**

```typescript
// src/design-system/hooks/useHighContrast.ts

import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // iOS: bold text preference (yakin proxy)
    AccessibilityInfo.isBoldTextEnabled().then(setIsHighContrast);
    const subscription = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      setIsHighContrast
    );
    return () => subscription.remove();
  }, []);

  return isHighContrast;
};
```

#### V.3: Renk Korlugu

**Sorun**: Bilgi sadece renk ile iletiliyor, renk koru kullanicilar anlayamiyor.

**Kritik Renk Kontrast Hatalari:**

| Renk Kombinasyonu | Kontrast Orani | WCAG AA (4.5:1) | Aksiyon |
|-------------------|---------------|-----------------|---------|
| `#D0F205` (brand) on `#FFFFFF` | **~1.5:1** | **BASARISIZ** | Text icin KULLANMA, sadece bg olarak kullan + koyu text |
| `#9CA3AF` on `#FFFFFF` | ~2.8:1 | **BASARISIZ** | Daha koyu gri kullan (#6B7280 min.) |
| `#CCCCCC` on `#FFFFFF` | ~1.6:1 | **BASARISIZ** | Skeleton icin OK ama text icin KULLANMA |
| `#A3A3A3` on `#FFFFFF` | ~2.7:1 | **BASARISIZ** | Placeholder icin OK, icerik text icin degil |
| `#D0F205` (brand) on `#000000` | ~18:1 | Gecti | Dark mode'da sorun yok |

**Cozum: Renk + Ikon + Text Kombinasyonu:**

```tsx
// ONCE: Sadece renk ile durum gosterimi
<Box bg={isLiked ? '#FF3040' : 'transparent'}>
  <HeartIcon color={isLiked ? '#FF3040' : '#000'} />
</Box>

// SONRA: Renk + Ikon degisimi + Yazi
<Box bg={isLiked ? '#FF3040' : 'transparent'}>
  {isLiked ? <HeartIconSolid /> : <HeartIconOutline />}
  <Text accessibilityLabel={isLiked ? "Begenildi" : "Begenilmedi"}>
    {likesCount}
  </Text>
</Box>
// Ikon DOLU/BOS farki renk korlerinin de anlayabilecegi gorsel ipucu
```

#### V.4: Isitme Engelliler

**Sorun**: Ses tabanli bildirimler isitme engelliler tarafindan alinamiyor.

**Gerekli Aksiyonlar:**

```typescript
// a) Tum ses bildirimlerine gorsel karsilik ekle
// Notification sesi + gorsel badge + titresim

// b) Video iceriklere altyazi destegi (ileriki gelistirme)
// expo-video player'a caption track destegi

// c) Haptic feedback ile dokunsal geri bildirim
import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
```

**Paket kurulumu:**
```bash
npx expo install expo-haptics
```

#### V.5: Motor (Hareket) Engelliler

**Sorun**: Kucuk dokunma hedefleri, karmasik gesture'lar tek elle kullanilabilir degil.

**Gerekli Aksiyonlar:**

```typescript
// a) Tum interaktif elemanlarin minimum 44x44pt olmasi
// b) Swipe gesture'lara alternatif button sagla
// c) Long-press aksiyonlara alternatif menu sagla

// d) Switch Control / External keyboard destegi
// Her ekranda mantikli focus sirasi olmali

// Ornek: Tab swiping'e alternatif
// Mevcut: Sadece swipe ile tab degistirme
// Eklenmeli: Tab butonlarina dokunarak da degistirme (zaten var, ama
// accessibilityRole="tab" ile isaretlenmeli)
```

#### V.6: Okuma Zorlugu Cekenler (Disleksi)

**Sorun**: Font boyutu sabitlenen, satirlar arasi bosluk yetersiz metin.

**Gerekli Aksiyonlar:**

```typescript
// a) Font scaling destegi (V.2'de tanimlandi)
// b) Yeterli satir araligi (line-height)
// c) Uzun paragraflarda okunabilirlik icin maximum genislik

// src/design-system/tokens/typography.ts - GUNCELLENMIS
export const typography = {
  // ... mevcut token'lar ...

  lineHeight: {
    tight: 1.25,      // Basliklar
    normal: 1.5,      // Govde metni (WCAG 1.4.12 minimum)
    relaxed: 1.75,    // Uzun paragraflar - disleksi dostu
    loose: 2.0,       // Ekstra okunabilirlik modu
  },

  // Paragraf genisligi - okunabilirlik icin
  maxWidth: {
    prose: 580,        // ~65-75 karakter/satir (optimal)
    narrow: 420,       // Kisa paragraflar
  },

  // Kelime araligi
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,         // Disleksi dostu
    wider: 1.0,        // Ekstra okunabilirlik
  },
} as const;
```

#### V.7: Reduced Motion (Hareket Hassasiyeti)

**KRITIK**: 797+ animasyon dosyasi, hiçbirinde reduced motion kontrolu yok.

```typescript
// src/design-system/hooks/useReducedMotion.ts

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useReducedMotion = (): boolean => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotion
    );
    return () => subscription.remove();
  }, []);

  return isReducedMotion;
};
```

**Kullanim:**

```typescript
// Animasyonlu her component'te:
const isReducedMotion = useReducedMotion();

const animatedStyle = useAnimatedStyle(() => {
  if (isReducedMotion) {
    // Animasyon yerine aninda gecis
    return { opacity: isVisible ? 1 : 0 };
  }
  // Normal animasyon
  return {
    opacity: withTiming(isVisible ? 1 : 0, { duration: 300 }),
    transform: [{ translateY: withSpring(isVisible ? 0 : 50) }],
  };
});
```

**Etkilenen alanlar:**
- `FilterBarReanimated.tsx` - Scroll animasyonlari
- `AnimatedCounter/` - Digit animasyonlari
- `TabNavigator.tsx` - Tab gecis animasyonlari
- Lottie animasyonlari (splash, loading)
- Carousel animasyonlari (`react-native-reanimated-carousel`)
- Bottom sheet acilis/kapanis animasyonlari
- All `withTiming`, `withSpring`, `withSequence` kullanim noktalari

### Accessibility Test Stratejisi

#### Manuel Test Matrisi

| Test | iOS | Android | Oncelik |
|------|-----|---------|---------|
| VoiceOver ile tam navigasyon | Gerekli | - | P0 |
| TalkBack ile tam navigasyon | - | Gerekli | P0 |
| Switch Control ile form doldurma | Gerekli | - | P1 |
| Buyuk font (200%) ile tum ekranlar | Gerekli | Gerekli | P1 |
| Reduced Motion ile animasyonlar | Gerekli | Gerekli | P1 |
| Yuksek kontrast ile okunabilirlik | Gerekli | Gerekli | P2 |
| Keyboard-only navigasyon | - | Gerekli | P2 |
| RTL layout (gelecek) | Gerekli | Gerekli | P3 |

#### Otomatik Test Araclari

```bash
# ESLint accessibility plugin
npm install --save-dev eslint-plugin-react-native-a11y

# Testing library a11y queries
npm install --save-dev @testing-library/react-native
```

```javascript
// .eslintrc.js - Accessibility kurallari
{
  plugins: ['react-native-a11y'],
  rules: {
    'react-native-a11y/has-accessibility-props': 'error',
    'react-native-a11y/has-valid-accessibility-role': 'error',
    'react-native-a11y/no-nested-touchables': 'error',
    'react-native-a11y/has-valid-accessibility-state': 'warn',
    'react-native-a11y/has-valid-accessibility-value': 'warn',
    'react-native-a11y/has-valid-accessibility-live-region': 'warn',
  },
}
```

### Accessibility Entegrasyon Sirasi (Oncelik)

**Tier 0 - Hemen (1. Sprint):**
1. Tum `Pressable`'lara `accessibilityLabel` + `accessibilityRole="button"` ekle
2. Brand rengi `#D0F205`'u text uzerinde KULLANMA, sadece bg olarak koyu text ile kullan
3. Toast/error mesajlarina `accessibilityLiveRegion="assertive"` ekle
4. `eslint-plugin-react-native-a11y` kur ve kuralları aktifleştir

**Tier 1 - Yuksek Oncelik (2-3. Sprint):**
5. `useReducedMotion` hook'u yaz ve tum animasyonlara entegre et
6. Font scaling (`allowFontScaling` + `maxFontSizeMultiplier`) ekle
7. Minimum 44x44pt touch target + hitSlop duzeltmeleri
8. Form input'larina `accessibilityHint` ve hata duyurusu ekle
9. 1,744 gorsele `accessibilityLabel` (alt text) ekle

**Tier 2 - Orta Oncelik (4-5. Sprint):**
10. Focus yonetimi (modal/bottom sheet focus trap)
11. Tab/List semantic rolleri (`accessibilityRole="tab"/"list"`)
12. Haptic feedback entegrasyonu (`expo-haptics`)
13. Yuksek kontrast modu destegi
14. Baslik hiyerarsisi (`accessibilityRole="header"`)

**Tier 3 - Uzun Vadeli (6+ Sprint):**
15. VoiceOver + TalkBack tam test sureci
16. WCAG 2.1 Level AA uyumluluk denetimi
17. Engelli kullanicilarla kullanilabilirlik testi
18. CI/CD'ye otomatik accessibility testi ekleme

### Guncellenmis Basari Kriterleri (Accessibility)

| # | Kriter | Olcum |
|---|--------|-------|
| 15 | **%100 accessibilityLabel** | Tum interaktif elementlerde label var |
| 16 | **WCAG AA renk kontrasti** | Tum text/bg kombinasyonlari 4.5:1+ |
| 17 | **44px minimum touch target** | Tum dokunulabilir elemanlar |
| 18 | **Font scaling destegi** | Sistem font buyutmesine uyumlu |
| 19 | **Reduced motion destegi** | Sistem ayarina uyumlu animasyonlar |
| 20 | **Ekran okuyucu uyumluluk** | VoiceOver + TalkBack ile navigasyon |
| 21 | **Dinamik icerik duyurusu** | Toast/hata/basari ekran okuyucuya duyurulur |
| 22 | **Haptic feedback** | Dokunsal geri bildirim tum aksiyonlarda |

### Guncellenmis Toplam Sure (Error Handler + Accessibility Dahil)

| Faz | Aciklama | Sure |
|-----|----------|------|
| FAZ 0 | Hazirlik, Token, Altyapi | 1.5 Sprint |
| FAZ 1 | Primitive Componentler | 1.5 Sprint |
| FAZ 2 | Composite Componentler | 3 Sprint |
| FAZ 3 | Migration Sureci (codemod ile) | 3-5 Sprint |
| FAZ 4 | Temizlik ve Optimizasyon | 1.5 Sprint |
| FAZ 5 | Dokumantasyon | 1 Sprint |
| **FAZ 6** | **Global Error Handler Sistemi** | **1.5 Sprint** |
| **FAZ 7** | **Accessibility Tier 0 + Tier 1** | **3 Sprint** |
| **FAZ 8** | **Accessibility Tier 2 + Test** | **2 Sprint** |
| **TOPLAM** | | **18 - 20 Sprint** |

> **Not**: FAZ 6 (Error Handler) diger fazlardan bagimsiz olarak hemen baslayabilir ve paralel yurutulebilir. FAZ 7-8 (Accessibility) ise FAZ 2 sonrasinda, design system component'leri hazir olduktan sonra uygulanmalidir - boylece her component accessible olarak dogabilir.

---

---

# BOLUM 2: PROFESYONEL SOSYAL MEDYA UYGULAMA MIMARISI

> Bu bolum, Tipbox uygulamasinin bir sosyal medya platformu olarak profesyonel standartlara ulastirilmasi icin gerekli mimari yapiyi, eksik sistemleri, ve uygulama planini kapsamli olarak tanimlar. Bolum 1'deki design system refactoring sureci ile birlikte ele alinmalidir.

---

## SM-1: Mevcut Durum vs Profesyonel Standartlar

### Karsilastirma Matrisi

| Alan | Profesyonel Standart | Tipbox Mevcut Durum | Durum |
|------|----------------------|---------------------|-------|
| Feed Algoritmasi | ML-tabanli personalizasyon, edge-ranked | Kronolojik + basit cursor pagination | ⚠️ TEMEL |
| Real-time Altyapi | Scalable WebSocket + presence + typing | Socket.IO temel, 15 event, reconnect var | ✅ YETERLI |
| Content Pipeline | Upload → process → moderate → CDN | FormData upload, JPEG compress, API direkt | ⚠️ EKSIK |
| Content Moderation | AI + manuel review + report queue | Sadece block/report (client-side) | ❌ KRITIK EKSIK |
| Offline-First | SQLite/WatermelonDB + sync queue | Sadece React Query cache (RAM) | ❌ KRITIK EKSIK |
| Analytics | Event tracking, funnel, retention, heatmap | HİÇ YOK | ❌ KRITIK EKSIK |
| A/B Testing | Feature flags, experiment framework | HİÇ YOK | ❌ EKSIK |
| Security | Biometric, cert pinning, encryption | SecureStore + JWT, basic | ⚠️ YETERSIZ |
| Performance Monitoring | APM, FPS tracking, bundle analysis | Console.log, React.memo | ⚠️ YETERSIZ |
| Push Notifications | Rich, actionable, segmented, scheduled | Expo push, 20+ type, basic | ✅ TEMEL |
| Deep Linking | Universal links, deferred deep links | expo-linking, 10+ route | ✅ TEMEL |
| Media CDN | Adaptive quality, lazy load, blurhash | expo-image cache, JPEG compress | ⚠️ TEMEL |
| Background Sync | Queue + retry + conflict resolution | YOK | ❌ EKSIK |
| Monetization | In-app purchase, subscription, tipping | Wallet system (temel) | ⚠️ TEMEL |
| State Management | Normalized, optimistic, real-time sync | Zustand + React Query (iyi ayrilmis) | ✅ IYI |
| Error Handling | Global handler, crash reporting, recovery | YOK (Bolum 1 EK-U'da planlandi) | ❌ PLANLANDI |
| Accessibility | WCAG 2.1 AA, screen reader, motor | %0 kapsam (Bolum 1 EK-V'de planlandi) | ❌ PLANLANDI |

### Oncelik Siniflandirmasi

**P0 - Lansman Oncesi Zorunlu:**
- Content Moderation (yasal zorunluluk)
- Analytics (is kararlari icin veri)
- Security Hardening (kullanici guvenligi)
- Error Handling (zaten planlandi - EK-U)

**P1 - Lansman Sonrasi Ilk 3 Ay:**
- Offline-First Strategy
- Performance Monitoring (APM)
- Feed Algorithm v2 (engagement-based)
- A/B Testing Altyapisi
- Background Sync

**P2 - Buyume Fazinda:**
- ML-tabanli Feed Personalizasyon
- Advanced Push (rich, scheduled, segmented)
- Media CDN Optimization
- Monetization v2

---

## SM-2: Feed Mimarisi ve Algoritma

### Mevcut Durum Analizi

```
Mevcut Feed Akisi:
User → FeedScreen → useGetFeedPosts(cursor) → GET /api/feed?cursor=X&limit=20
                   → useGetFeedPostsByCategory(categoryId, cursor)
                   → FlatList + onEndReached → sonraki sayfa

Post Turleri: Free, Benchmark, Tips & Tricks, Question, Experience, Update
Feed Tipleri: Ana feed, Kategori feed, Profil feed, Bookmark feed
Siralama: Kronolojik (backend tarafindan)
```

### Hedef Feed Mimarisi

```
src/
├── features/
│   └── feed/
│       ├── api/
│       │   ├── hooks.ts              # useGetFeedPosts, useFeedMutations
│       │   └── feedApi.ts            # API endpoint tanimlari
│       ├── services/
│       │   ├── FeedCacheService.ts   # Offline-ready feed cache
│       │   ├── FeedPrefetchService.ts # Akilli prefetch (viewport-aware)
│       │   └── FeedAnalytics.ts      # Feed etkilesim tracking
│       ├── stores/
│       │   └── feedStore.ts          # Feed UI state (scroll position, filters)
│       ├── components/
│       │   ├── FeedList/
│       │   │   ├── FeedList.tsx       # FlashList + infinite scroll
│       │   │   ├── FeedListHeader.tsx # Filter chips, category tabs
│       │   │   └── FeedListEmpty.tsx  # Empty state
│       │   ├── PostCard/
│       │   │   ├── PostCard.tsx       # Unified post card (6 varyant)
│       │   │   ├── PostCardSkeleton.tsx
│       │   │   └── PostCardActions.tsx # Like, bookmark, share, upvote
│       │   └── FeedFilters/
│       │       ├── FilterChips.tsx
│       │       └── CategorySheet.tsx
│       └── screens/
│           └── FeedScreen.tsx
```

### Feed Algoritma Stratejisi

#### Faz 1 - Smart Chronological (Mevcut Altyapi Uzerinde)

```typescript
// Backend'de uygulanacak feed siralama mantigi
// Client tarafinda ek bir is yapilmaz, sadece API parametreleri gonderilir

interface FeedRequest {
  cursor?: string;
  limit: number;
  feedType: 'home' | 'category' | 'trending' | 'following';
  categoryId?: string;
  // Faz 1: Basit engagement sinyalleri
  timezone: string;
  lastSeenAt: string; // Son gorulen post timestamp'i
}

interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
  // Feed metadata
  feedVersion: string; // A/B test icin
  impressionId: string; // Analytics icin
}
```

**Client-Side Prefetch Stratejisi:**

```typescript
// services/FeedPrefetchService.ts
class FeedPrefetchService {
  private prefetchThreshold = 5; // Son 5 iteme gelince prefetch

  /**
   * Viewport-aware prefetch: Kullanici listenin sonuna yaklasinca
   * bir sonraki sayfayi onceden yukle
   */
  setupViewportPrefetch(
    queryClient: QueryClient,
    feedType: string,
    currentCursor: string | null
  ) {
    // React Query'nin prefetchInfiniteQuery'sini kullan
    if (currentCursor) {
      queryClient.prefetchInfiniteQuery({
        queryKey: feedKeys.list(feedType),
        queryFn: () => feedApi.getPosts({ cursor: currentCursor, limit: 20 }),
        staleTime: 2 * 60 * 1000, // 2 dakika
      });
    }
  }

  /**
   * Post detay prefetch: Kullanici bir posta 500ms+ bakinca
   * o postun detay verisini onceden yukle
   */
  prefetchPostDetail(queryClient: QueryClient, postId: string) {
    queryClient.prefetchQuery({
      queryKey: postKeys.detail(postId),
      queryFn: () => postApi.getPostDetail(postId),
      staleTime: 5 * 60 * 1000,
    });
  }
}
```

#### Faz 2 - Engagement-Based Ranking (Backend Gelistirme ile)

```
Siralama Sinyalleri (Backend):
┌─────────────────────────────────────────┐
│ 1. Recency Score (zamana gore azalma)   │
│ 2. Author Trust Score (trust sayisi)    │
│ 3. Engagement Rate (like/view orani)    │
│ 4. Category Affinity (kullanici tercihi)│
│ 5. Content Quality (uzunluk, media var) │
│ 6. Social Proximity (trust edilen kisi) │
│ 7. Post Type Diversity (cesitlilik)     │
│ 8. Time Decay (yarimlanma suresi: 6h)   │
└─────────────────────────────────────────┘

Final Score = Σ(signal_weight × signal_value) × time_decay
```

### Optimistic Updates ve Feed Consistency

```typescript
// Feed'de optimistic update pattern'i
// Like, bookmark, upvote gibi aksiyonlar aninda UI'da yansir

const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postApi.likePost(postId),

    // Optimistic update: API cevabini beklemeden UI'i guncelle
    onMutate: async (postId) => {
      // Devam eden fetch'leri iptal et (eski veriyle ezilmesin)
      await queryClient.cancelQueries({ queryKey: feedKeys.all });

      // Onceki state'i kaydet (rollback icin)
      const previousFeed = queryClient.getQueryData(feedKeys.list('home'));

      // Cache'deki postu optimistic olarak guncelle
      queryClient.setQueriesData(
        { queryKey: feedKeys.all },
        (old: any) => updatePostInFeed(old, postId, { isLiked: true, likeCount: +1 })
      );

      return { previousFeed };
    },

    // Hata durumunda rollback
    onError: (err, postId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(feedKeys.list('home'), context.previousFeed);
      }
    },

    // Basarili olursa arka planda tam veriyi al
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
};
```

### Scroll Position Restoration

```typescript
// stores/feedStore.ts - Feed scroll pozisyonunu koru
interface FeedStore {
  scrollPositions: Record<string, number>; // feedType -> offset
  lastViewedPostId: Record<string, string>; // feedType -> postId

  saveScrollPosition: (feedType: string, offset: number) => void;
  saveLastViewedPost: (feedType: string, postId: string) => void;
  getScrollPosition: (feedType: string) => number;
}

// FeedList.tsx icinde kullanim:
const FeedList: React.FC = () => {
  const listRef = useRef<FlashList>(null);
  const { saveScrollPosition, getScrollPosition } = useFeedStore();

  // Tab'a geri donuldugunde pozisyonu restore et
  useFocusEffect(
    useCallback(() => {
      const savedPosition = getScrollPosition('home');
      if (savedPosition > 0) {
        listRef.current?.scrollToOffset({ offset: savedPosition, animated: false });
      }
    }, [])
  );

  // Scroll pozisyonunu kaydet (debounced)
  const handleScroll = useCallback(
    debounce((event: NativeSyntheticEvent<NativeScrollEvent>) => {
      saveScrollPosition('home', event.nativeEvent.contentOffset.y);
    }, 200),
    []
  );
};
```

---

## SM-3: Real-Time Altyapi (Mesajlasma ve Bildirimler)

### Mevcut Durum

```
Mevcut Socket.IO Yapisi:
- socketService.ts: Tekil Socket.IO client
- 15+ event: send_message, new_message, typing, stop_typing, seen,
  join_room, leave_room, create_thread, delete_message, vb.
- Reconnect: Mevcut (auto-reconnect)
- Typing indicators: Mevcut
- Read receipts: Mevcut (seen event)
- Room-based: Her thread bir room
```

### Hedef Real-Time Mimari

```
src/
├── services/
│   └── realtime/
│       ├── RealtimeService.ts        # Socket lifecycle + reconnect
│       ├── RealtimeEventBus.ts       # Event routing + type safety
│       ├── PresenceService.ts        # Online/offline/away status
│       ├── TypingService.ts          # Typing indicator management
│       └── RealtimeTypes.ts          # Socket event type definitions
│
├── features/
│   └── messaging/
│       ├── services/
│       │   ├── MessageQueue.ts       # Offline message queue
│       │   ├── MessageDelivery.ts    # Delivery + read receipt tracking
│       │   └── MessageEncryption.ts  # E2E encryption (gelecek)
│       ├── stores/
│       │   └── messageStore.ts       # Active conversations state
│       └── hooks/
│           ├── useMessages.ts        # Message list + realtime sync
│           ├── useThreadPresence.ts  # Thread-level online status
│           └── useTypingIndicator.ts # Typing state management
```

### Event Bus Pattern (Type-Safe)

```typescript
// services/realtime/RealtimeTypes.ts
interface ServerToClientEvents {
  new_message: (data: { threadId: string; message: Message }) => void;
  typing: (data: { threadId: string; userId: string; fullName: string }) => void;
  stop_typing: (data: { threadId: string; userId: string }) => void;
  message_seen: (data: { threadId: string; messageId: string; userId: string }) => void;
  user_online: (data: { userId: string }) => void;
  user_offline: (data: { userId: string; lastSeen: string }) => void;
  thread_updated: (data: { threadId: string; lastMessage: Message }) => void;
  notification: (data: PushNotificationPayload) => void;
}

interface ClientToServerEvents {
  send_message: (data: { threadId: string; content: string; type: MessageType }) => void;
  typing: (data: { threadId: string }) => void;
  stop_typing: (data: { threadId: string }) => void;
  mark_seen: (data: { threadId: string; messageId: string }) => void;
  join_room: (data: { threadId: string }) => void;
  leave_room: (data: { threadId: string }) => void;
}

// services/realtime/RealtimeService.ts
class RealtimeService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectBackoff = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  // Baglanti durumu
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';

  connect(token: string): void {
    this.connectionState = 'connecting';

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'], // Polling fallback devre disi (performance)
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000,
      timeout: 10000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      // Offline kuyrugundaki mesajlari gonder
      MessageQueue.flush();
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionState = 'disconnected';
      if (reason === 'io server disconnect') {
        // Server tarafindan kapatildi - token expired olabilir
        this.handleAuthFailure();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.connectionState = 'reconnecting';
      this.reconnectAttempts++;
    });
  }

  // Offline-safe message gonderimi
  sendMessage(threadId: string, content: string, type: MessageType = 'text'): string {
    const tempId = generateTempId(); // Optimistic ID

    if (this.connectionState === 'connected' && this.socket) {
      this.socket.emit('send_message', { threadId, content, type });
    } else {
      // Offline: Kuyruge ekle, baglanti gelince gonder
      MessageQueue.enqueue({ threadId, content, type, tempId });
    }

    return tempId;
  }
}
```

### Offline Message Queue

```typescript
// features/messaging/services/MessageQueue.ts
interface QueuedMessage {
  id: string;
  threadId: string;
  content: string;
  type: MessageType;
  tempId: string;
  createdAt: string;
  retryCount: number;
  status: 'pending' | 'sending' | 'failed';
}

class MessageQueueService {
  private queue: QueuedMessage[] = [];
  private readonly MAX_RETRIES = 3;
  private readonly STORAGE_KEY = 'message_queue';

  // Uygulama baslarken kuyrugu yukle
  async initialize(): Promise<void> {
    const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.queue = JSON.parse(stored);
    }
  }

  // Mesaji kuyruge ekle
  enqueue(message: Omit<QueuedMessage, 'id' | 'createdAt' | 'retryCount' | 'status'>): void {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };
    this.queue.push(queuedMessage);
    this.persist();
  }

  // Baglanti gelince kuyrugu bosaalt
  async flush(): Promise<void> {
    const pendingMessages = this.queue.filter(m => m.status === 'pending');

    for (const message of pendingMessages) {
      try {
        message.status = 'sending';
        await realtimeService.sendMessage(message.threadId, message.content, message.type);
        this.queue = this.queue.filter(m => m.id !== message.id);
      } catch (error) {
        message.retryCount++;
        message.status = message.retryCount >= this.MAX_RETRIES ? 'failed' : 'pending';
      }
    }

    this.persist();
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
  }
}

export const MessageQueue = new MessageQueueService();
```

### Presence System

```typescript
// services/realtime/PresenceService.ts
type UserPresence = 'online' | 'away' | 'offline';

interface PresenceState {
  userId: string;
  status: UserPresence;
  lastSeen: string | null;
}

class PresenceService {
  private presenceMap = new Map<string, PresenceState>();
  private awayTimeout: NodeJS.Timeout | null = null;
  private readonly AWAY_THRESHOLD = 5 * 60 * 1000; // 5 dakika

  // AppState dinle - arka plana alinca "away" gonder
  initialize(): void {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        this.setOnline();
        this.clearAwayTimeout();
      } else if (state === 'background') {
        this.startAwayTimeout();
      }
    });
  }

  private startAwayTimeout(): void {
    this.awayTimeout = setTimeout(() => {
      this.setAway();
    }, this.AWAY_THRESHOLD);
  }

  setOnline(): void {
    realtimeService.emit('presence', { status: 'online' });
  }

  setAway(): void {
    realtimeService.emit('presence', { status: 'away' });
  }

  // Baska kullanicinin durumunu al
  getUserPresence(userId: string): PresenceState | null {
    return this.presenceMap.get(userId) || null;
  }

  // Hook: usePresence(userId)
  subscribe(userId: string, callback: (presence: PresenceState) => void): () => void {
    // Real-time presence update dinle
    const handler = (data: PresenceState) => {
      if (data.userId === userId) {
        this.presenceMap.set(userId, data);
        callback(data);
      }
    };
    realtimeService.on('user_online', handler);
    realtimeService.on('user_offline', handler);

    return () => {
      realtimeService.off('user_online', handler);
      realtimeService.off('user_offline', handler);
    };
  }
}
```

---

## SM-4: Content Pipeline ve Moderation

### Mevcut Durum

```
Mevcut Content Akisi:
User → CreatePostScreen → FormData (text + images) → POST /api/posts
                        → JPEG compress (0.9 quality)
                        → Max 5 image
                        → 6 post type: Free, Benchmark, Tips, Question, Experience, Update

Eksikler:
- Draft sistemi YOK (kullanici cikinca icerik kaybolur)
- Image optimization sadece client-side JPEG compress
- Video destegi sinirli
- Content moderation YOK (sadece block/report)
- Media CDN yok (direkt API'den servis)
- Scheduled post yok
```

### Hedef Content Pipeline

```
Content Olusturma Pipeline:

[Kullanici]
    ↓
[Draft Kaydet] ──→ AsyncStorage (lokal draft)
    ↓
[Media Yukle] ──→ Client-side Optimization
    │                ├── Image: Resize + JPEG compress + EXIF strip
    │                ├── Video: FFmpeg compress (gelecek)
    │                └── Blurhash generate (placeholder)
    ↓
[API Upload] ──→ POST /api/posts (multipart/form-data)
    ↓
[Backend Pipeline]
    ├── Media Processing
    │   ├── Image: Multiple sizes (thumb/medium/large/original)
    │   ├── CDN Upload (S3/CloudFront veya Cloudflare R2)
    │   └── NSFW Detection (AI - gelecek)
    ├── Content Analysis
    │   ├── Text spam detection
    │   ├── Toxic content filter
    │   └── Link safety check
    ├── Metadata Extraction
    │   ├── Hashtag parsing
    │   ├── Mention parsing (@user)
    │   └── URL preview (OG tags)
    └── Distribution
        ├── Feed injection
        ├── Notification dispatch (mentioned users)
        └── Analytics event
```

### Draft System

```typescript
// features/create-post/services/DraftService.ts
interface PostDraft {
  id: string;
  type: PostType;
  title?: string;
  content: string;
  mediaUris: string[]; // Lokal URI'lar
  categoryId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

class DraftService {
  private readonly STORAGE_KEY = 'post_drafts';
  private readonly MAX_DRAFTS = 10;
  private readonly AUTO_SAVE_INTERVAL = 5000; // 5 saniye

  // Otomatik kaydetme (debounced)
  private autoSaveTimer: NodeJS.Timeout | null = null;

  autoSave(draft: PostDraft): void {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);

    this.autoSaveTimer = setTimeout(async () => {
      await this.saveDraft(draft);
    }, this.AUTO_SAVE_INTERVAL);
  }

  async saveDraft(draft: PostDraft): Promise<void> {
    const drafts = await this.getAllDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);

    if (existingIndex >= 0) {
      drafts[existingIndex] = { ...draft, updatedAt: new Date().toISOString() };
    } else {
      if (drafts.length >= this.MAX_DRAFTS) {
        // En eski draft'i sil
        drafts.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        drafts.shift();
      }
      drafts.push(draft);
    }

    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
  }

  async getAllDrafts(): Promise<PostDraft[]> {
    const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async deleteDraft(draftId: string): Promise<void> {
    const drafts = await this.getAllDrafts();
    const filtered = drafts.filter(d => d.id !== draftId);
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }
}
```

### Content Moderation Stratejisi

```
Content Moderation Katmanlari:

Katman 1: Client-Side (Preventive)
├── Yasakli kelime filtresi (regex-based, locale-aware)
├── URL whitelist/blacklist kontrolu
├── Icerik uzunluk sinirlari (type-based)
└── Spam hiz limiti (5 post/saat)

Katman 2: Backend Auto-Moderation
├── Text toxicity analysis (Perspective API / OpenAI Moderation)
├── NSFW image detection (AWS Rekognition / Google Vision)
├── Spam score hesaplama
├── Duplicate content detection (simhash)
└── Link safety (Google Safe Browsing API)

Katman 3: Community Reporting
├── Report reasons: spam, harassment, hate_speech, nudity, violence, misinformation
├── Report threshold: 3+ unique reporter → auto-hide + queue
├── Reporter reputation score (false report penalti)
└── Block = hide from feed + prevent DM

Katman 4: Manual Review (Admin Panel)
├── Moderation queue (auto-flagged + reported)
├── Actions: approve, remove, warn, suspend, ban
├── Appeal process (user can contest)
└── Audit log (tum moderation aksiyonlari)
```

```typescript
// features/create-post/services/ContentValidator.ts
interface ValidationResult {
  isValid: boolean;
  errors: ContentValidationError[];
  warnings: ContentValidationWarning[];
}

interface ContentValidationError {
  field: 'title' | 'content' | 'media' | 'tags';
  code: string;
  message: string;
}

class ContentValidator {
  // Client-side validasyon (post gonderilmeden once)
  validate(draft: PostDraft): ValidationResult {
    const errors: ContentValidationError[] = [];
    const warnings: ContentValidationWarning[] = [];

    // Icerik uzunluk kontrolu
    const contentLimits: Record<PostType, { min: number; max: number }> = {
      free: { min: 1, max: 5000 },
      benchmark: { min: 50, max: 10000 },
      tips: { min: 20, max: 5000 },
      question: { min: 10, max: 3000 },
      experience: { min: 100, max: 15000 },
      update: { min: 1, max: 2000 },
    };

    const limits = contentLimits[draft.type];
    if (draft.content.length < limits.min) {
      errors.push({
        field: 'content',
        code: 'CONTENT_TOO_SHORT',
        message: `Minimum ${limits.min} karakter gerekli`,
      });
    }
    if (draft.content.length > limits.max) {
      errors.push({
        field: 'content',
        code: 'CONTENT_TOO_LONG',
        message: `Maksimum ${limits.max} karakter`,
      });
    }

    // Media kontrolu
    if (draft.mediaUris.length > 10) {
      errors.push({
        field: 'media',
        code: 'TOO_MANY_MEDIA',
        message: 'Maksimum 10 medya dosyasi',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
```

### Media Optimization Pipeline

```typescript
// services/MediaOptimizer.ts
interface OptimizedMedia {
  uri: string;
  width: number;
  height: number;
  size: number; // bytes
  mimeType: string;
  blurhash?: string;
}

class MediaOptimizer {
  // Image optimization
  async optimizeImage(uri: string, options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }): Promise<OptimizedMedia> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.85,
    } = options || {};

    // 1. Resize (buyuk resimleri kucult)
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // 2. EXIF strip (privacy - konum bilgisi kaldir)
    // ImageManipulator zaten EXIF'i temizler

    // 3. Blurhash generate (placeholder icin)
    // Not: Bu islem client'ta agir olabilir, backend'e birakilabilir
    const blurhash = await this.generateBlurhash(manipResult.uri);

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
      size: await this.getFileSize(manipResult.uri),
      mimeType: 'image/jpeg',
      blurhash,
    };
  }

  // Upload progress tracking
  async uploadWithProgress(
    uri: string,
    onProgress: (progress: number) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: `upload_${Date.now()}.jpg`,
    } as any);

    const response = await axios.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        onProgress(progress);
      },
    });

    return response.data.url;
  }

  private async generateBlurhash(uri: string): Promise<string | undefined> {
    try {
      // expo-image'in blurhash destegi kullanilabilir
      // veya react-native-blurhash paketi
      return undefined; // Backend'de generate edilecek
    } catch {
      return undefined;
    }
  }

  private async getFileSize(uri: string): Promise<number> {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? info.size || 0 : 0;
  }
}
```

---

## SM-5: Sosyal Graf ve Iliskiler (Trust/Truster Sistemi)

### Mevcut Durum

```
Mevcut Iliski Yapisi:
- Trust (Takip et) / Untrust
- Truster (Takipci)
- Block / Unblock
- Report
- User Suggestions (API endpoint mevcut)

Eksikler:
- Mutual trust (karsilikli) gosterimi zayif
- Trust suggestions algoritmasi basit
- Sosyal graf analizi yok
- "Close Friends" / liste sistemi yok
```

### Hedef Sosyal Graf Mimarisi

```
src/
├── features/
│   └── social-graph/
│       ├── api/
│       │   ├── hooks.ts              # useTrust, useBlock, useSuggestions
│       │   └── socialApi.ts
│       ├── services/
│       │   ├── TrustService.ts       # Trust/untrust business logic
│       │   ├── BlockService.ts       # Block + content filtering
│       │   └── SuggestionEngine.ts   # Client-side suggestion caching
│       ├── stores/
│       │   └── socialStore.ts        # Block list cache (fast lookup)
│       └── components/
│           ├── TrustButton.tsx        # Animated trust/untrust button
│           ├── UserSuggestionCard.tsx  # "Seni bunlar ilgilendirebilir"
│           └── MutualTrustBadge.tsx   # Karsilikli trust gostergesi
```

### Trust Actions ve Optimistic Updates

```typescript
// features/social-graph/api/hooks.ts
const useTrust = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: 'trust' | 'untrust' }) =>
      action === 'trust' ? socialApi.trust(userId) : socialApi.untrust(userId),

    onMutate: async ({ userId, action }) => {
      // Feed'deki, profildeki, suggestion'lardaki tum yerleri guncelle
      await queryClient.cancelQueries({ queryKey: socialKeys.all });

      // Profil sayfasindaki trust durumunu guncelle
      queryClient.setQueryData(
        userKeys.profile(userId),
        (old: any) => old ? {
          ...old,
          isTrusted: action === 'trust',
          trustCount: old.trustCount + (action === 'trust' ? 1 : -1),
        } : old
      );

      // Suggestion listesinden cikar (trust edince)
      if (action === 'trust') {
        queryClient.setQueryData(
          socialKeys.suggestions,
          (old: any[]) => old?.filter(s => s.id !== userId) || []
        );
      }
    },

    onSettled: (_, __, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
};
```

### Block System ve Content Filtering

```typescript
// features/social-graph/stores/socialStore.ts
// Block listesi hizli erisim icin Zustand'da cache'lenir

interface SocialStore {
  blockedUserIds: Set<string>;
  mutedUserIds: Set<string>;

  // Block listesini backend'den yukle
  loadBlockList: () => Promise<void>;

  // Bir kullanicinin bloklu olup olmadigini kontrol et
  isBlocked: (userId: string) => boolean;

  // Icerik filtreleme: Feed, yorumlar, mesajlar icin
  filterContent: <T extends { userId: string }>(items: T[]) => T[];
}

// Feed, yorum, mesaj listelerinde kullanim:
const FeedList: React.FC = () => {
  const { filterContent } = useSocialStore();
  const { data: posts } = useGetFeedPosts();

  // Bloklu kullanicilarin icerikleri otomatik filtrelenir
  const filteredPosts = useMemo(
    () => filterContent(posts || []),
    [posts, filterContent]
  );
};
```

---

## SM-6: Offline-First Strateji

### Mevcut Durum

```
Mevcut Offline Destegi:
- React Query cache (RAM only) - uygulama kapaninca kaybolur
- Zustand persist (AsyncStorage) - sadece auth + theme state
- Offline kuyruk: YOK
- Conflict resolution: YOK
- Network status detection: YOK (EK-U'da planlandi)
```

### Hedef Offline Mimarisi

```
Offline-First Katmanlari:

┌─────────────────────────────────────────┐
│           UI Layer (Screens)            │
├─────────────────────────────────────────┤
│         React Query Cache (RAM)         │
│   staleTime: 2hr, gcTime: 4hr          │
├─────────────────────────────────────────┤
│      Persistent Query Cache (Disk)      │
│   AsyncStorage-based query persistence  │
├─────────────────────────────────────────┤
│       Offline Action Queue              │
│   Like, bookmark, trust, message...     │
├─────────────────────────────────────────┤
│       Network Status Monitor            │
│   NetInfo + custom retry logic          │
└─────────────────────────────────────────┘
```

### React Query Persistent Cache

```typescript
// providers/QueryProvider.ts - Persistent cache eklentisi
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'tipbox-query-cache',
  // Sadece kritik verileri persist et (feed, profil, mesajlar)
  // Gecici verileri (search results, suggestions) haric tut
  serialize: (data) => {
    // Buyuk verileri filtrele (bellek tasmasini onle)
    const filtered = {
      ...data,
      clientState: {
        ...data.clientState,
        queries: data.clientState.queries.filter((q: any) => {
          const key = q.queryKey[0];
          // Sadece onemli query'leri persist et
          return ['feed', 'profile', 'threads', 'notifications'].includes(key);
        }),
      },
    };
    return JSON.stringify(filtered);
  },
  deserialize: (data) => JSON.parse(data),
});

// QueryClient'a persister baglama
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 24 * 60 * 60 * 1000, // 24 saat
  buster: APP_VERSION, // Versiyon degisince cache invalidate
});
```

### Offline Action Queue

```typescript
// services/OfflineQueue.ts
type OfflineAction =
  | { type: 'LIKE_POST'; postId: string }
  | { type: 'UNLIKE_POST'; postId: string }
  | { type: 'BOOKMARK_POST'; postId: string }
  | { type: 'TRUST_USER'; userId: string }
  | { type: 'SEND_MESSAGE'; threadId: string; content: string; tempId: string }
  | { type: 'CREATE_POST'; draft: PostDraft };

interface QueuedAction {
  id: string;
  action: OfflineAction;
  createdAt: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
}

class OfflineQueueService {
  private queue: QueuedAction[] = [];
  private isProcessing = false;
  private readonly STORAGE_KEY = 'offline_action_queue';

  async initialize(): Promise<void> {
    const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
    if (stored) this.queue = JSON.parse(stored);
  }

  enqueue(action: OfflineAction): void {
    this.queue.push({
      id: generateUUID(),
      action,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    });
    this.persist();

    // Online ise hemen isle
    if (NetworkMonitor.isConnected) {
      this.processQueue();
    }
  }

  // Network geri geldiginde kuyrugu isle
  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const pending = this.queue.filter(q => q.status === 'pending');

    for (const item of pending) {
      try {
        item.status = 'processing';
        await this.executeAction(item.action);
        // Basarili - kuyruktan cikar
        this.queue = this.queue.filter(q => q.id !== item.id);
      } catch (error) {
        item.retryCount++;
        item.status = item.retryCount >= 3 ? 'failed' : 'pending';
      }
    }

    this.isProcessing = false;
    this.persist();
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'LIKE_POST':
        await postApi.likePost(action.postId);
        break;
      case 'TRUST_USER':
        await socialApi.trust(action.userId);
        break;
      case 'SEND_MESSAGE':
        await messageApi.sendMessage(action.threadId, action.content);
        break;
      // ... diger action'lar
    }
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
  }

  // Failed aksiyonlari kullaniciya goster
  getFailedActions(): QueuedAction[] {
    return this.queue.filter(q => q.status === 'failed');
  }
}

export const OfflineQueue = new OfflineQueueService();
```

### Network-Aware API Layer

```typescript
// services/ApiService/NetworkAwareInterceptor.ts
// API isteklerini network durumuna gore yonet

const setupNetworkInterceptor = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(async (config) => {
    const isConnected = NetworkMonitor.isConnected;

    if (!isConnected) {
      // Offline iken GET istekleri cache'den cekilir (React Query halleder)
      // POST/PUT/DELETE istekleri kuyruge alinir
      if (config.method !== 'get') {
        throw new OfflineError('No internet connection. Action queued for later.');
      }
    }

    return config;
  });
};
```

---

## SM-7: Analytics ve Tracking Altyapisi

### Mevcut Durum: HIC YOK

Uygulamada hicbir analytics entegrasyonu bulunmuyor. Bu, bir sosyal medya uygulamasi icin **kritik bir eksiklik**. Is kararlari, A/B testleri, retention analizi ve kullanici davranisi anlayisi icin analytics zorunludur.

### Hedef Analytics Mimarisi

```
src/
├── services/
│   └── analytics/
│       ├── AnalyticsService.ts       # Ana analytics servisi
│       ├── AnalyticsTypes.ts         # Event type definitions
│       ├── providers/
│       │   ├── MixpanelProvider.ts   # Mixpanel entegrasyonu
│       │   ├── AmplitudeProvider.ts  # Amplitude alternatif
│       │   └── PostHogProvider.ts    # Self-hosted alternatif
│       ├── hooks/
│       │   ├── useTrackScreen.ts     # Ekran goruntulenme tracking
│       │   ├── useTrackEvent.ts      # Event tracking hook
│       │   └── useImpressionTracking.ts # Viewport-based impression
│       └── constants/
│           └── events.ts             # Event name constants
```

### Analytics Event Taxonomy

```typescript
// services/analytics/AnalyticsTypes.ts

// Tum event'ler type-safe olmali
type AnalyticsEvent =
  // Auth Events
  | { name: 'auth_login'; properties: { method: 'email' | 'google' | 'apple' } }
  | { name: 'auth_register'; properties: { method: 'email' | 'google' | 'apple' } }
  | { name: 'auth_logout'; properties: {} }

  // Feed Events
  | { name: 'feed_view'; properties: { feedType: string; postCount: number } }
  | { name: 'feed_scroll'; properties: { feedType: string; depth: number } }
  | { name: 'feed_refresh'; properties: { feedType: string } }
  | { name: 'feed_filter_change'; properties: { filter: string; feedType: string } }

  // Post Events
  | { name: 'post_view'; properties: { postId: string; postType: PostType; authorId: string } }
  | { name: 'post_create_start'; properties: { postType: PostType } }
  | { name: 'post_create_complete'; properties: { postType: PostType; mediaCount: number; duration: number } }
  | { name: 'post_create_abandon'; properties: { postType: PostType; step: string; duration: number } }
  | { name: 'post_like'; properties: { postId: string; postType: PostType } }
  | { name: 'post_unlike'; properties: { postId: string; postType: PostType } }
  | { name: 'post_bookmark'; properties: { postId: string; postType: PostType } }
  | { name: 'post_share'; properties: { postId: string; postType: PostType; shareMethod: string } }
  | { name: 'post_report'; properties: { postId: string; reason: string } }

  // Social Events
  | { name: 'user_trust'; properties: { targetUserId: string; source: string } }
  | { name: 'user_untrust'; properties: { targetUserId: string } }
  | { name: 'user_block'; properties: { targetUserId: string; reason?: string } }
  | { name: 'profile_view'; properties: { userId: string; source: string } }

  // Messaging Events
  | { name: 'message_send'; properties: { threadId: string; messageType: string } }
  | { name: 'thread_create'; properties: { participantCount: number } }
  | { name: 'thread_open'; properties: { threadId: string } }

  // Navigation Events
  | { name: 'screen_view'; properties: { screenName: string; previousScreen?: string } }
  | { name: 'tab_switch'; properties: { tab: string } }
  | { name: 'deep_link_open'; properties: { url: string; source?: string } }

  // Engagement Metrics
  | { name: 'session_start'; properties: { isFirstSession: boolean } }
  | { name: 'session_end'; properties: { duration: number; screenCount: number } }
  | { name: 'notification_received'; properties: { type: string } }
  | { name: 'notification_opened'; properties: { type: string } }

  // Performance Events
  | { name: 'app_cold_start'; properties: { duration: number } }
  | { name: 'screen_render'; properties: { screenName: string; duration: number } }
  | { name: 'api_request'; properties: { endpoint: string; duration: number; status: number } }

  // Error Events
  | { name: 'error_api'; properties: { endpoint: string; status: number; message: string } }
  | { name: 'error_crash'; properties: { message: string; stack?: string } }
  | { name: 'error_js'; properties: { message: string; componentStack?: string } };
```

### Analytics Service Implementation

```typescript
// services/analytics/AnalyticsService.ts

interface AnalyticsProvider {
  initialize(apiKey: string): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): void;
  track(eventName: string, properties?: Record<string, any>): void;
  screen(screenName: string, properties?: Record<string, any>): void;
  reset(): void; // Logout'ta
}

class AnalyticsService {
  private providers: AnalyticsProvider[] = [];
  private userId: string | null = null;
  private superProperties: Record<string, any> = {}; // Her event'e eklenir
  private eventQueue: Array<{ name: string; properties: Record<string, any>; timestamp: string }> = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (__DEV__) {
      // Development'ta console'a yaz
      this.providers.push(new ConsoleAnalyticsProvider());
    } else {
      // Production'da gercek provider kullan
      const mixpanel = new MixpanelProvider();
      await mixpanel.initialize(MIXPANEL_TOKEN);
      this.providers.push(mixpanel);
    }

    // Super properties (her event'e otomatik eklenir)
    this.superProperties = {
      app_version: APP_VERSION,
      platform: Platform.OS,
      os_version: Platform.Version,
      device_model: Device.modelName,
      locale: getLocale(),
    };

    this.isInitialized = true;

    // Kuyruklanmis event'leri gonder
    this.flushQueue();
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    this.providers.forEach(p => p.identify(userId, {
      ...traits,
      ...this.superProperties,
    }));
  }

  track(event: AnalyticsEvent): void {
    const enrichedProperties = {
      ...event.properties,
      ...this.superProperties,
      timestamp: new Date().toISOString(),
      user_id: this.userId,
    };

    if (!this.isInitialized) {
      // Henuz initialize olmadiysa kuyrukla
      this.eventQueue.push({
        name: event.name,
        properties: enrichedProperties,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.providers.forEach(p => p.track(event.name, enrichedProperties));
  }

  screen(screenName: string, properties?: Record<string, any>): void {
    this.providers.forEach(p => p.screen(screenName, {
      ...properties,
      ...this.superProperties,
    }));
  }

  // Logout'ta cagrilir
  reset(): void {
    this.userId = null;
    this.providers.forEach(p => p.reset());
  }

  private flushQueue(): void {
    this.eventQueue.forEach(event => {
      this.providers.forEach(p => p.track(event.name, event.properties));
    });
    this.eventQueue = [];
  }
}

export const analytics = new AnalyticsService();
```

### Screen Tracking Hook

```typescript
// services/analytics/hooks/useTrackScreen.ts
export const useTrackScreen = (screenName: string) => {
  const startTime = useRef(Date.now());

  useFocusEffect(
    useCallback(() => {
      startTime.current = Date.now();
      analytics.screen(screenName);

      return () => {
        // Ekrandan ayrilirken sure hesapla
        const duration = Date.now() - startTime.current;
        analytics.track({
          name: 'screen_view',
          properties: { screenName, duration },
        });
      };
    }, [screenName])
  );
};

// Kullanim:
const FeedScreen: React.FC = () => {
  useTrackScreen('Feed');
  // ...
};
```

### Impression Tracking

```typescript
// services/analytics/hooks/useImpressionTracking.ts
// Post'larin goruntulenme durumunu track et (feed'de viewport'a girince)

export const useImpressionTracking = (postId: string, postType: PostType) => {
  const hasTracked = useRef(false);
  const viewStartTime = useRef<number | null>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    const isVisible = viewableItems.some((item: any) => item.key === postId);

    if (isVisible && !hasTracked.current) {
      viewStartTime.current = Date.now();
      hasTracked.current = true;

      analytics.track({
        name: 'post_view',
        properties: { postId, postType, authorId: '' },
      });
    }
  }, [postId, postType]);

  return { onViewableItemsChanged };
};
```

---

## SM-8: Security Hardening

### Mevcut Durum

```
Mevcut Guvenlik Onlemleri:
- expo-secure-store: Access/Refresh token depolama
- JWT token: Bearer auth
- Token refresh: Interceptor ile otomatik
- Memory token cache: SecureStore I/O azaltmak icin
- HTTPS: API baglantilari (varsayim)

Eksikler:
- Biometric auth: YOK
- Certificate pinning: YOK
- Request signing: YOK
- Jailbreak/root detection: YOK
- Code obfuscation: YOK
- Secure clipboard: YOK
- Screenshot prevention (hassas ekranlar): YOK
- Token rotation: Sadece access token refresh
```

### Hedef Guvenlik Mimarisi

```
src/
├── services/
│   └── security/
│       ├── BiometricService.ts       # Face ID / Touch ID / Fingerprint
│       ├── CertificatePinning.ts     # SSL pinning
│       ├── SecureStorageService.ts    # Enhanced secure storage
│       ├── IntegrityService.ts       # Jailbreak/root detection
│       ├── ScreenProtection.ts       # Screenshot/screen recording guard
│       └── SecurityConfig.ts         # Merkezi guvenlik konfigurasyonu
```

### Biometric Authentication

```typescript
// services/security/BiometricService.ts
import * as LocalAuthentication from 'expo-local-authentication';

class BiometricService {
  private isAvailable: boolean = false;
  private biometricType: 'fingerprint' | 'face' | 'iris' | null = null;

  async initialize(): Promise<void> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    this.isAvailable = compatible && enrolled;

    if (this.isAvailable) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        this.biometricType = 'face';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        this.biometricType = 'fingerprint';
      }
    }
  }

  // Kullanici tercihini kontrol et
  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem('biometric_auth_enabled');
    return enabled === 'true' && this.isAvailable;
  }

  // Biometric dogrulama
  async authenticate(reason?: string): Promise<boolean> {
    if (!this.isAvailable) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason || 'Kimliginizi dogrulayin',
      cancelLabel: 'Iptal',
      disableDeviceFallback: false, // PIN/pattern fallback izin ver
      fallbackLabel: 'Sifre kullan',
    });

    return result.success;
  }

  // Uygulama tekrar acildiginda biometric sor
  async authenticateOnResume(): Promise<boolean> {
    const isEnabled = await this.isBiometricEnabled();
    if (!isEnabled) return true; // Biometric kapali, direkt gecis

    return this.authenticate('Tipbox\'a erisim icin dogrulayin');
  }

  getType(): string | null {
    return this.biometricType;
  }
}

export const biometricService = new BiometricService();
```

### Certificate Pinning

```typescript
// services/security/CertificatePinning.ts
// React Native'de SSL pinning icin react-native-ssl-pinning kullanilabilir

/**
 * Certificate Pinning Stratejisi:
 *
 * 1. Public key pinning (sertifika yenileme sorununu onler)
 * 2. Backup pin (sertifika gecisi icin)
 * 3. Pin failure reporting (Sentry'ye)
 *
 * Kurulum:
 * npm install react-native-ssl-pinning
 *
 * Not: Expo managed workflow'da custom native module gerektirir (expo prebuild)
 */

const PINNED_DOMAINS = {
  'api.tipbox.co': {
    includeSubdomains: true,
    publicKeyHashes: [
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary
      'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Backup
    ],
  },
};

// API Service'e entegrasyon:
// axios yerine ssl-pinning'li fetch kullanilabilir
// veya axios interceptor'da pinning kontrolu yapilabilir
```

### App Integrity Check

```typescript
// services/security/IntegrityService.ts
/**
 * Jailbreak/Root Detection
 * Debug mode detection
 * Emulator detection
 *
 * Amac: Production'da manipule edilmis cihazlari tespit et
 * Not: %100 guvenli degil, ama caydirici
 */

class IntegrityService {
  async checkIntegrity(): Promise<{
    isJailbroken: boolean;
    isEmulator: boolean;
    isDebugged: boolean;
  }> {
    return {
      isJailbroken: await this.checkJailbreak(),
      isEmulator: await this.checkEmulator(),
      isDebugged: __DEV__,
    };
  }

  private async checkJailbreak(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // Cydia, suspicious paths kontrol
      // expo-device veya react-native-device-info kullanilabilir
      return false; // Detayli implementation native tarafta
    }
    if (Platform.OS === 'android') {
      // su binary, Magisk, SuperSU kontrol
      return false;
    }
    return false;
  }

  private async checkEmulator(): Promise<boolean> {
    // expo-device kullanarak
    const isDevice = Device.isDevice;
    return !isDevice;
  }

  // Baslatma sirasinda calistir
  async enforce(): Promise<void> {
    if (__DEV__) return; // Development'ta kontrol yapma

    const integrity = await this.checkIntegrity();

    if (integrity.isJailbroken) {
      // Log + uyari goster (uygulamayi kapatma, ama bildirimi logla)
      analytics.track({
        name: 'security_jailbreak_detected',
        properties: { platform: Platform.OS },
      });
    }

    if (integrity.isEmulator && !__DEV__) {
      analytics.track({
        name: 'security_emulator_detected',
        properties: { platform: Platform.OS },
      });
    }
  }
}
```

### Hassas Ekran Korumasi

```typescript
// services/security/ScreenProtection.ts
/**
 * Belirli ekranlarda screenshot ve screen recording'i engellemek icin
 * Ornek: Odeme ekrani, ozel mesajlar, hesap ayarlari
 */

import * as ScreenCapture from 'expo-screen-capture';

export const useScreenProtection = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    // Screenshot'i engelle
    const subscription = ScreenCapture.addScreenshotListener(() => {
      // Screenshot alindi - loglama veya uyari
      analytics.track({
        name: 'security_screenshot_attempt',
        properties: { screen: 'protected' },
      });
    });

    // Screen recording'i engelle (iOS)
    ScreenCapture.preventScreenCaptureAsync();

    return () => {
      subscription.remove();
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, [enabled]);
};

// Kullanim:
const PaymentScreen: React.FC = () => {
  useScreenProtection(true);
  // ...
};
```

### Secure Data Handling

```typescript
// Token lifecycle guvenlik kurallari:

const SecurityRules = {
  // 1. Token'lar SADECE SecureStore'da saklanir (AsyncStorage'da ASLA)
  tokenStorage: 'SecureStore',

  // 2. Access token suresi: 15 dakika (backend tarafindan kontrol)
  accessTokenTTL: 15 * 60 * 1000,

  // 3. Refresh token suresi: 7 gun
  refreshTokenTTL: 7 * 24 * 60 * 60 * 1000,

  // 4. Hassas veriler clipboard'a kopyalandiginda 30sn sonra temizle
  clipboardAutoClean: 30 * 1000,

  // 5. 5 basarisiz login denemesinden sonra rate limit
  maxLoginAttempts: 5,
  loginLockoutDuration: 15 * 60 * 1000, // 15 dakika

  // 6. Arka planda 15 dakika sonra biometric sor
  backgroundAuthTimeout: 15 * 60 * 1000,
};
```

---

## SM-9: Performance Standartlari ve Monitoring

### Hedef Performans Metrikleri

| Metrik | Hedef | Olcum Yontemi |
|--------|-------|---------------|
| Cold Start (TTI) | < 2 saniye | Uygulama acilis → ilk interaktif ekran |
| Feed Render (FPS) | 60 FPS (min 55) | react-native-performance veya Flipper |
| Feed Scroll Jank | < %1 dropped frames | FlashList + useCallback optimizasyon |
| Image Load | < 500ms (cached), < 2s (network) | expo-image ile olcum |
| API Response (P95) | < 500ms | axios interceptor timing |
| JS Bundle Size | < 5 MB | Metro bundle analysis |
| Memory Usage | < 200 MB (peak) | Xcode/Android Profiler |
| Crash-free Sessions | > %99.5 | Sentry/Firebase Crashlytics |
| ANR (Android) | < %0.5 | Play Console |

### Performance Monitoring Service

```typescript
// services/PerformanceService.ts

class PerformanceService {
  private metrics = new Map<string, number[]>();

  // API response time tracking
  trackApiCall(endpoint: string, duration: number, status: number): void {
    const key = `api_${endpoint}`;
    if (!this.metrics.has(key)) this.metrics.set(key, []);
    this.metrics.get(key)!.push(duration);

    // Slow API alarm (>2s)
    if (duration > 2000) {
      analytics.track({
        name: 'perf_slow_api',
        properties: { endpoint, duration, status },
      });
    }
  }

  // Screen render time tracking
  trackScreenRender(screenName: string, renderTime: number): void {
    analytics.track({
      name: 'screen_render',
      properties: { screenName, duration: renderTime },
    });

    // Slow render alarm (>500ms)
    if (renderTime > 500) {
      console.warn(`[Perf] Slow render: ${screenName} took ${renderTime}ms`);
    }
  }

  // Cold start tracking
  trackColdStart(duration: number): void {
    analytics.track({
      name: 'app_cold_start',
      properties: { duration },
    });
  }

  // Memory warning
  setupMemoryWarning(): void {
    // iOS memory warning dinle
    AppState.addEventListener('memoryWarning', () => {
      analytics.track({
        name: 'perf_memory_warning',
        properties: {},
      });

      // React Query cache'ini agresif temizle
      queryClient.clear();
    });
  }
}

export const performanceService = new PerformanceService();
```

### Performance Hook

```typescript
// hooks/usePerformanceTracking.ts
export const usePerformanceTracking = (screenName: string) => {
  const renderStart = useRef(Date.now());

  useEffect(() => {
    const renderTime = Date.now() - renderStart.current;
    performanceService.trackScreenRender(screenName, renderTime);
  }, []);

  // InteractionManager ile agir islemleri ertele
  const deferHeavyWork = useCallback((work: () => void) => {
    InteractionManager.runAfterInteractions(() => {
      work();
    });
  }, []);

  return { deferHeavyWork };
};
```

### FlashList Best Practices

```typescript
// Feed listesi icin FlashList optimizasyon standartlari:

const FeedList: React.FC = () => {
  const renderItem = useCallback(({ item }: { item: Post }) => (
    <PostCard post={item} />
  ), []);

  const keyExtractor = useCallback((item: Post) => item.id, []);

  return (
    <FlashList
      data={posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={350} // Ortalama post card yuksekligi
      // Performance flags
      drawDistance={300} // Viewport disinda render mesafesi
      overrideItemLayout={(layout, item) => {
        // Post tipine gore yukseklik tahmini
        layout.size = getEstimatedPostHeight(item.type, item.mediaCount);
      }}
      // Scroll performance
      removeClippedSubviews={Platform.OS === 'android'}
      // Interaction blocking prevention
      windowSize={5}
    />
  );
};

// PostCard memo + areEqual
const PostCard = React.memo(PostCardComponent, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.post.likeCount === next.post.likeCount &&
    prev.post.isLiked === next.post.isLiked &&
    prev.post.bookmarkCount === next.post.bookmarkCount &&
    prev.post.isBookmarked === next.post.isBookmarked
  );
});
```

---

## SM-10: A/B Testing ve Feature Flags

### Hedef A/B Testing Mimarisi

```
src/
├── services/
│   └── experiments/
│       ├── ExperimentService.ts      # A/B test yonetimi
│       ├── FeatureFlagService.ts     # Feature flag yonetimi
│       ├── ExperimentTypes.ts        # Type definitions
│       └── hooks/
│           ├── useExperiment.ts      # A/B test variant hook
│           └── useFeatureFlag.ts     # Feature flag hook
```

### Feature Flag Service

```typescript
// services/experiments/FeatureFlagService.ts

interface FeatureFlags {
  // Feed
  feed_algorithm_v2: boolean;
  feed_video_autoplay: boolean;
  feed_story_bar: boolean;

  // Social
  close_friends_list: boolean;
  user_verification_badges: boolean;

  // Content
  post_drafts: boolean;
  scheduled_posts: boolean;
  post_analytics: boolean;

  // Messaging
  voice_messages: boolean;
  message_reactions: boolean;
  group_threads: boolean;

  // Monetization
  creator_subscriptions: boolean;
  tipping_v2: boolean;

  // Security
  biometric_auth: boolean;
  screenshot_protection: boolean;
}

class FeatureFlagService {
  private flags: Partial<FeatureFlags> = {};
  private readonly CACHE_KEY = 'feature_flags';
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 dakika

  async initialize(): Promise<void> {
    // 1. Cache'den yukle (hizli baslatma)
    const cached = await AsyncStorage.getItem(this.CACHE_KEY);
    if (cached) {
      this.flags = JSON.parse(cached);
    }

    // 2. Backend'den guncel flags'i al
    await this.refresh();

    // 3. Periyodik guncelleme baslat
    setInterval(() => this.refresh(), this.REFRESH_INTERVAL);
  }

  private async refresh(): Promise<void> {
    try {
      const response = await apiService.get<FeatureFlags>('/api/feature-flags');
      this.flags = response.data;
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(this.flags));
    } catch {
      // Cache'deki degerlerle devam et
    }
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] ?? false;
  }
}

export const featureFlags = new FeatureFlagService();
```

### Feature Flag Hook

```typescript
// services/experiments/hooks/useFeatureFlag.ts
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const [isEnabled, setIsEnabled] = useState(featureFlags.isEnabled(flag));

  useEffect(() => {
    // Flag degisirse guncelle
    const interval = setInterval(() => {
      const current = featureFlags.isEnabled(flag);
      if (current !== isEnabled) {
        setIsEnabled(current);
      }
    }, 10000); // 10sn kontrol

    return () => clearInterval(interval);
  }, [flag, isEnabled]);

  return isEnabled;
};

// Kullanim:
const FeedScreen: React.FC = () => {
  const showStoryBar = useFeatureFlag('feed_story_bar');

  return (
    <View>
      {showStoryBar && <StoryBar />}
      <FeedList />
    </View>
  );
};
```

### A/B Test Hook

```typescript
// services/experiments/hooks/useExperiment.ts
interface Experiment<T extends string> {
  name: string;
  variant: T;
  isControl: boolean;
}

export const useExperiment = <T extends string>(
  experimentName: string,
  variants: T[]
): Experiment<T> => {
  const [experiment, setExperiment] = useState<Experiment<T>>({
    name: experimentName,
    variant: variants[0],
    isControl: true,
  });

  useEffect(() => {
    // Backend'den kullanicinin hangi variant'ta oldugunu al
    const assignedVariant = experimentService.getVariant(experimentName);
    if (assignedVariant) {
      setExperiment({
        name: experimentName,
        variant: assignedVariant as T,
        isControl: assignedVariant === variants[0],
      });
    }

    // Experiment exposure event'i gonder
    analytics.track({
      name: 'experiment_exposure',
      properties: {
        experiment: experimentName,
        variant: assignedVariant || variants[0],
      },
    });
  }, [experimentName]);

  return experiment;
};

// Kullanim:
const TrustButton: React.FC = () => {
  const { variant } = useExperiment('trust_button_style', ['control', 'animated', 'gradient']);

  switch (variant) {
    case 'animated': return <AnimatedTrustButton />;
    case 'gradient': return <GradientTrustButton />;
    default: return <DefaultTrustButton />;
  }
};
```

---

## SM-11: Push Notification Stratejisi

### Mevcut Durum

```
Mevcut Push Yapisi:
- Expo push notifications (expo-notifications)
- 20+ notification type
- Token kaydi: Backend'e expo push token gonderimi
- Deep linking: Notification'dan ekrana yonlendirme
- Badge count: Temel destek

Eksikler:
- Rich notifications (resim, buton) sinirli
- Notification grouping yok
- Scheduled notifications yok
- Notification preferences (kullanici tercihi) temel
- Notification analytics yok
```

### Hedef Notification Mimarisi

```typescript
// services/NotificationService.ts - Enhanced

interface NotificationPreferences {
  // Global
  enabled: boolean;
  quietHoursStart: string | null; // "22:00"
  quietHoursEnd: string | null;   // "08:00"

  // Kanal bazli
  channels: {
    social: {
      newTrust: boolean;      // Biri seni trust etti
      mention: boolean;       // Bir postta bahsedildin
      like: boolean;          // Postun begenildi
      comment: boolean;       // Postuna yorum yapildi
    };
    messaging: {
      newMessage: boolean;    // Yeni mesaj
      messageRequest: boolean; // Mesaj istegi
    };
    content: {
      trendingPost: boolean;  // Postun trending oldu
      weeklyDigest: boolean;  // Haftalik ozet
    };
    system: {
      securityAlert: boolean; // Guvenlik uyarisi
      appUpdate: boolean;     // Uygulama guncelleme
    };
  };
}

class NotificationService {
  // Bildirim tercihlerini backend ile senkronize et
  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    await apiService.put('/api/notifications/preferences', prefs);
    await AsyncStorage.setItem('notification_prefs', JSON.stringify(prefs));
  }

  // Quiet hours kontrolu
  isQuietHours(): boolean {
    const prefs = this.getPreferences();
    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= prefs.quietHoursStart || currentTime < prefs.quietHoursEnd;
  }

  // Notification handling
  async handleNotificationReceived(notification: Notification): Promise<void> {
    const { type, data } = notification.request.content.data as any;

    // Analytics
    analytics.track({
      name: 'notification_received',
      properties: { type },
    });

    // Active thread'e mesaj bildirimi geldiyse gosterme
    const activeThreadId = useAppStore.getState().activeThreadId;
    if (type === 'new_message' && data.threadId === activeThreadId) {
      return; // Zaten o thread acik, bildirim gosterme
    }

    // Badge count guncelle
    await this.updateBadgeCount();
  }

  // Notification'a tiklandiginda
  async handleNotificationResponse(response: NotificationResponse): Promise<void> {
    const { type, data } = response.notification.request.content.data as any;

    // Analytics
    analytics.track({
      name: 'notification_opened',
      properties: { type },
    });

    // Deep link routing
    switch (type) {
      case 'new_message':
        navigate('MessageDetail', { threadId: data.threadId });
        break;
      case 'new_trust':
        navigate('Profile', { userId: data.userId });
        break;
      case 'post_like':
      case 'post_comment':
        navigate('PostDetail', { postId: data.postId });
        break;
      case 'mention':
        navigate('PostDetail', { postId: data.postId });
        break;
      default:
        navigate('Notifications');
    }
  }
}
```

---

## SM-12: Deep Linking ve Universal Links

### Mevcut Durum

```
Mevcut Deep Link Yapisi:
- expo-linking ile tipboxapp:// scheme
- 10+ route tanimli
- Notification'dan deep link yonlendirme

Eksikler:
- Universal links (HTTPS based) yok
- Deferred deep links yok (install oncesi link)
- Deep link analytics yok
- Branch/Firebase Dynamic Links entegrasyonu yok
```

### Hedef Deep Link Mimarisi

```typescript
// navigation/DeepLinkConfig.ts

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'tipboxapp://',           // Custom scheme
    'https://tipbox.co',      // Universal link
    'https://www.tipbox.co',  // Universal link (www)
  ],

  config: {
    screens: {
      // Ana ekranlar
      Feed: 'feed',
      Explore: 'explore',
      Profile: {
        path: 'profile/:userId',
        parse: { userId: String },
      },

      // Post detay
      PostDetail: {
        path: 'post/:postId',
        parse: { postId: String },
      },

      // Messaging
      MessageDetail: {
        path: 'messages/:threadId',
        parse: { threadId: String },
      },

      // Collections
      CollectionDetail: {
        path: 'collection/:collectionId',
        parse: { collectionId: String },
      },

      // Invite / Referral
      Invite: {
        path: 'invite/:referralCode',
        parse: { referralCode: String },
      },

      // Auth flows
      ResetPassword: {
        path: 'reset-password/:token',
        parse: { token: String },
      },

      // Share
      SharedPost: {
        path: 'share/:shareId',
        parse: { shareId: String },
      },
    },
  },

  // Deep link geldiginde
  async getInitialURL() {
    // Uygulama kapali iken gelen deep link
    const url = await Linking.getInitialURL();

    if (url) {
      analytics.track({
        name: 'deep_link_open',
        properties: { url, source: 'cold_start' },
      });
    }

    return url;
  },

  subscribe(listener) {
    // Uygulama acik iken gelen deep link
    const subscription = Linking.addEventListener('url', ({ url }) => {
      analytics.track({
        name: 'deep_link_open',
        properties: { url, source: 'foreground' },
      });
      listener(url);
    });

    return () => subscription.remove();
  },
};
```

---

## SM-13: Background Sync ve Task Management

### Hedef Background Sync Mimarisi

```typescript
// services/BackgroundSync.ts
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_SYNC_TASK = 'tipbox-background-sync';

// Background task tanimla
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // 1. Offline kuyrugu isle
    await OfflineQueue.processQueue();

    // 2. Unread notification count guncelle
    await notificationService.syncBadgeCount();

    // 3. Push token'i yenile (suresiz olmaz)
    await notificationService.refreshPushToken();

    // 4. Feature flags guncelle
    await featureFlags.refresh();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundSyncService {
  async register(): Promise<void> {
    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // Minimum 15 dakika (OS kisitlamasi)
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  }

  async unregister(): Promise<void> {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}
```

---

## SM-14: Monetization Altyapisi

### Mevcut Durum

```
Mevcut Wallet Sistemi:
- WalletService: Wallet olusturma, bakiye sorgulama
- walletId, walletIdentifier, walletBalance: appStore'da
- Temel bakiye yonetimi

Eksikler:
- In-App Purchase entegrasyonu yok
- Subscription sistemi yok
- Tipping (bahsis) akisi basit
- Gelir paylasimi (creator earnings) yok
- Odeme gecmisi detaylandirma yok
```

### Hedef Monetization Mimarisi

```typescript
// features/monetization/
// ├── services/
// │   ├── IAPService.ts            # In-App Purchase (RevenueCat)
// │   ├── SubscriptionService.ts   # Subscription yonetimi
// │   ├── TippingService.ts        # Kullaniciya bahsis gonderme
// │   ├── WalletService.ts         # (mevcut - gelistirilecek)
// │   └── TransactionService.ts    # Islem gecmisi
// ├── stores/
// │   └── monetizationStore.ts     # Subscription state, wallet state
// └── screens/
//     ├── WalletScreen.tsx          # Cuzdan detay
//     ├── SubscriptionScreen.tsx    # Premium abonelik
//     └── TransactionHistoryScreen.tsx

// In-App Purchase icin RevenueCat onerilir (cross-platform, analytics dahil)
// npm install react-native-purchases

interface SubscriptionTier {
  id: string;
  name: 'free' | 'premium' | 'creator_pro';
  features: string[];
  price: {
    monthly: number;
    yearly: number;
  };
}

interface TipTransaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  postId?: string; // Hangi post icin bahsis verildi
  message?: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
}
```

---

## SM-15: Guncel Folder Structure (Sosyal Medya Mimarisi Dahil)

```
src/
├── app/                              # Expo Router veya entry points
│
├── design-system/                    # [BOLUM 1] Design System
│   ├── tokens/                       # Color, typography, spacing tokens
│   ├── theme/                        # ThemeProvider, useTheme
│   ├── primitives/                   # Box, Text, Pressable, Image, Icon
│   └── components/                   # Button, Input, Card, Avatar, Toast...
│
├── features/                         # Feature-based modular architecture
│   ├── auth/                         # Login, Register, ForgotPassword
│   ├── feed/                         # Feed list, filters, algorithm
│   │   ├── api/
│   │   ├── services/
│   │   │   ├── FeedCacheService.ts
│   │   │   ├── FeedPrefetchService.ts
│   │   │   └── FeedAnalytics.ts
│   │   ├── stores/
│   │   ├── components/
│   │   └── screens/
│   ├── create-post/                  # Post creation + draft system
│   │   ├── services/
│   │   │   ├── DraftService.ts
│   │   │   ├── ContentValidator.ts
│   │   │   └── MediaOptimizer.ts
│   │   └── screens/
│   ├── messaging/                    # DM, threads, real-time
│   │   ├── services/
│   │   │   ├── MessageQueue.ts
│   │   │   └── MessageDelivery.ts
│   │   ├── stores/
│   │   └── screens/
│   ├── social-graph/                 # Trust/untrust, block, suggestions
│   │   ├── services/
│   │   └── stores/
│   ├── profile/                      # User profile, settings
│   ├── notifications/                # Push + in-app notifications
│   ├── explore/                      # Search, discover, trending
│   ├── collections/                  # User collections, bookmarks
│   ├── monetization/                 # Wallet, tips, subscriptions
│   │   ├── services/
│   │   │   ├── WalletService.ts
│   │   │   ├── TippingService.ts
│   │   │   └── IAPService.ts
│   │   └── screens/
│   └── settings/                     # App settings, preferences
│       ├── screens/
│       │   ├── NotificationPrefsScreen.tsx
│       │   ├── PrivacySettingsScreen.tsx
│       │   └── SecuritySettingsScreen.tsx
│       └── components/
│
├── services/                         # App-wide shared services
│   ├── ApiService/                   # Axios instance, interceptors
│   ├── TokenService.ts               # Secure token storage
│   ├── analytics/                    # [SM-7] Analytics system
│   │   ├── AnalyticsService.ts
│   │   ├── AnalyticsTypes.ts
│   │   ├── providers/
│   │   │   └── MixpanelProvider.ts
│   │   └── hooks/
│   │       ├── useTrackScreen.ts
│   │       └── useImpressionTracking.ts
│   ├── realtime/                     # [SM-3] WebSocket infrastructure
│   │   ├── RealtimeService.ts
│   │   ├── RealtimeEventBus.ts
│   │   ├── PresenceService.ts
│   │   └── TypingService.ts
│   ├── security/                     # [SM-8] Security services
│   │   ├── BiometricService.ts
│   │   ├── CertificatePinning.ts
│   │   ├── IntegrityService.ts
│   │   └── ScreenProtection.ts
│   ├── experiments/                  # [SM-10] A/B testing + feature flags
│   │   ├── ExperimentService.ts
│   │   ├── FeatureFlagService.ts
│   │   └── hooks/
│   ├── error/                        # [EK-U] Error handling
│   │   ├── GlobalErrorHandler.ts
│   │   ├── ErrorReporter.ts
│   │   └── ErrorBoundary.tsx
│   ├── offline/                      # [SM-6] Offline support
│   │   ├── OfflineQueue.ts
│   │   ├── NetworkMonitor.ts
│   │   └── PersistentCache.ts
│   ├── background/                   # [SM-13] Background tasks
│   │   └── BackgroundSync.ts
│   └── performance/                  # [SM-9] Performance monitoring
│       └── PerformanceService.ts
│
├── store/                            # Global Zustand stores
│   ├── appStore.ts                   # Auth, theme, app state
│   ├── socialStore.ts                # Block list, muted users
│   └── feedStore.ts                  # Feed UI state
│
├── navigation/                       # React Navigation config
│   ├── RootNavigator.tsx
│   ├── DeepLinkConfig.ts
│   └── linking.ts
│
├── hooks/                            # Shared hooks
│   ├── usePerformanceTracking.ts
│   ├── useNetworkStatus.ts
│   └── useScreenProtection.ts
│
├── i18n/                             # Internationalization
│   ├── tr/
│   └── en/
│
├── utils/                            # Shared utilities
│   ├── date.ts
│   ├── format.ts
│   └── validation.ts
│
└── types/                            # Shared TypeScript types
    ├── api.ts
    ├── navigation.ts
    └── models.ts
```

---

## SM-16: Uygulama Sirasi ve Oncelik Matrisi

### Master Implementation Timeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                     TIPBOX REFACTORING TIMELINE                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PARALEL IS AKISI A: Design System (Bolum 1)                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                      │
│  Sprint 1-2   │ FAZ 0: Token, Theme, Altyapi                        │
│  Sprint 3-4   │ FAZ 1: Primitive Components                         │
│  Sprint 5-7   │ FAZ 2: Composite Components                         │
│  Sprint 8-12  │ FAZ 3: Migration (codemod ile, 7 batch)             │
│  Sprint 13-14 │ FAZ 4: Temizlik + Optimizasyon                      │
│  Sprint 15    │ FAZ 5: Dokumantasyon                                │
│                                                                      │
│  PARALEL IS AKISI B: Sosyal Medya Altyapisi (Bolum 2)               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│  Sprint 1-2   │ SM-P0a: Error Handling (EK-U)                       │
│               │ SM-P0b: Analytics Altyapisi (SM-7)                  │
│  Sprint 3-4   │ SM-P0c: Security Hardening (SM-8)                   │
│               │ SM-P0d: Content Moderation (SM-4)                   │
│  Sprint 5-6   │ SM-P1a: Offline-First (SM-6)                        │
│               │ SM-P1b: Performance Monitoring (SM-9)               │
│  Sprint 7-8   │ SM-P1c: Feed Algorithm v2 (SM-2)                    │
│               │ SM-P1d: A/B Testing (SM-10)                         │
│  Sprint 9-10  │ SM-P1e: Background Sync (SM-13)                     │
│               │ SM-P1f: Draft System (SM-4)                         │
│  Sprint 11-12 │ SM-P1g: Push Enhancement (SM-11)                    │
│               │ SM-P1h: Deep Linking v2 (SM-12)                     │
│  Sprint 13+   │ SM-P2: Monetization v2, ML Feed, Advanced Features  │
│                                                                      │
│  PARALEL IS AKISI C: Accessibility (Bolum 1, EK-V)                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                    │
│  Sprint 8-10  │ FAZ 7: Tier 0 + Tier 1 (FAZ 2 sonrasi)             │
│  Sprint 11-12 │ FAZ 8: Tier 2 + Testing                             │
│                                                                      │
│  TOPLAM: ~15-20 Sprint (2 paralel ekip ile)                         │
│  Tek ekip ile: ~25-30 Sprint                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Sprint Bazli Detay (Sosyal Medya Altyapisi)

| Sprint | Is Paketi | Deliverable | Bagimlilik |
|--------|-----------|-------------|------------|
| S1 | Error Handling Setup | GlobalErrorHandler, Sentry, ErrorBoundary | Yok |
| S1 | Analytics Setup | AnalyticsService, ConsoleProvider, event taxonomy | Yok |
| S2 | Analytics Integration | Screen tracking, feed events, auth events | S1 |
| S2 | Security: Biometric | BiometricService, settings UI | Yok |
| S3 | Security: Integrity | Jailbreak detection, screen protection | S2 |
| S3 | Moderation: Client | ContentValidator, report flow enhancement | Yok |
| S4 | Moderation: Backend | Auto-moderation pipeline, admin tools | S3 |
| S4 | Moderation: Policy | Community guidelines, appeal process | S4 |
| S5 | Offline: Persistent Cache | React Query persister, query filtering | Yok |
| S5 | Offline: Action Queue | OfflineQueue, network-aware interceptor | S5 |
| S6 | Performance: APM | PerformanceService, slow API tracking | S1 (analytics) |
| S6 | Performance: FlashList | Feed optimization, memo patterns | Yok |
| S7 | Feed: Smart Ranking | Backend signal-based ranking, prefetch | S6 |
| S7 | Feed: Scroll Restore | feedStore, position persistence | Yok |
| S8 | A/B Testing | FeatureFlagService, ExperimentService | S1 (analytics) |
| S8 | A/B Testing: Integration | Feature flag hooks, first experiment | S8 |
| S9 | Background Sync | BackgroundSyncService, expo-task-manager | S5 (offline) |
| S9 | Draft System | DraftService, auto-save, draft list UI | Yok |
| S10 | Draft: Integration | Create post flow + draft recovery | S9 |
| S10 | Media Pipeline | MediaOptimizer, upload progress, blurhash | Yok |
| S11 | Push Enhancement | Notification preferences, quiet hours | Yok |
| S11 | Push: Rich | Rich notifications, grouping, analytics | S11 |
| S12 | Deep Linking v2 | Universal links, deferred deep links | Yok |
| S12 | Deep Link: Analytics | Deep link tracking, attribution | S1 (analytics) |

---

## SM-17: Basari Kriterleri (Sosyal Medya Standartlari)

| # | Kriter | Olcum | Hedef |
|---|--------|-------|-------|
| 1 | **Crash-free session rate** | Sentry dashboard | > %99.5 |
| 2 | **Cold start time** | Performance tracking | < 2 saniye |
| 3 | **Feed scroll FPS** | FlashList metrics | > 55 FPS |
| 4 | **API P95 latency** | Backend monitoring | < 500ms |
| 5 | **Offline action success** | OfflineQueue metrics | > %95 |
| 6 | **Content moderation coverage** | Auto-mod + report | %100 yayin oncesi |
| 7 | **Analytics event coverage** | Event taxonomy vs actual | > %90 |
| 8 | **Feature flag adoption** | New features behind flags | %100 |
| 9 | **Push notification opt-in** | Notification analytics | > %60 |
| 10 | **Deep link success rate** | Link analytics | > %95 |
| 11 | **Biometric auth adoption** | Security analytics | > %40 |
| 12 | **Draft recovery rate** | Draft analytics | > %80 |
| 13 | **Memory peak usage** | Performance monitoring | < 200MB |
| 14 | **JS bundle size** | Metro analysis | < 5MB |
| 15 | **Accessibility (WCAG AA)** | Automated + manual audit | %100 interaktif |
| 16 | **Unit test coverage** | Jest coverage report | > %70 |
| 17 | **E2E test coverage** | Detox/Maestro | Kritik akislar %100 |
| 18 | **CI/CD pipeline time** | GitHub Actions | < 15 dakika |

---

## SM-18: Risk Analizi ve Mitigasyon

| Risk | Olasilik | Etki | Mitigasyon |
|------|----------|------|------------|
| Paralel refactoring merge conflict | Yuksek | Orta | Feature branch strategy, kucuk PR'lar |
| Analytics provider maliyeti | Orta | Dusuk | Self-hosted PostHog alternatifi |
| Offline queue data loss | Dusuk | Yuksek | AsyncStorage persist + retry logic |
| Certificate pinning app review red | Dusuk | Orta | Apple/Google policy takibi |
| Background task iOS kisitlamalari | Orta | Orta | Minimum interval 15dk, kritik task onceligi |
| Content moderation false positive | Orta | Yuksek | Human review queue, appeal process |
| A/B test segment contamination | Dusuk | Orta | Sticky assignment, proper randomization |
| Migration sirasinda regression | Yuksek | Yuksek | Codemod + snapshot test + e2e test |
| Performance degradation (new services) | Orta | Orta | Lazy initialization, code splitting |
| Over-engineering (cok erken optimizasyon) | Orta | Orta | MVP-first yaklasim, iterative improvement |

---

## Sonraki Adimlar (Guncellemis - Bolum 1 + 2)

### Acil Aksiyonlar (Bu Hafta)
1. Bu dokumanin team review'u
2. `eslint-plugin-react-native-a11y` kur, mevcut hatalari gor
3. Kullanilmayan paketleri kaldir (zeego, @react-native-menu) - risk-free quick win
4. Global error handler'i implement et (react-native-exception-handler zaten kurulu)
5. Analytics provider secimi: Mixpanel vs Amplitude vs PostHog degerlendirmesi

### Kisa Vadeli (Ilk 2 Sprint)
6. Error handling + Sentry entegrasyonu (EK-U)
7. Analytics altyapisi kurulumu + temel event'ler (SM-7)
8. Security: Biometric auth entegrasyonu (SM-8)
9. Codemod PoC: `gluestack-to-design-system.ts` codemod'unu 1 feature uzerinde test et

### Orta Vadeli (Sprint 3-8)
10. Design System FAZ 0-2 (token, primitive, composite components)
11. Content Moderation altyapisi (SM-4)
12. Offline-First strateji implementasyonu (SM-6)
13. Performance monitoring (SM-9)
14. Feed algorithm v2 (SM-2)
15. A/B testing altyapisi (SM-10)

### Uzun Vadeli (Sprint 9+)
16. Design System FAZ 3-5 (migration, temizlik, dokumantasyon)
17. Accessibility FAZ 7-8 (SM-V)
18. Background sync + draft system (SM-13, SM-4)
19. Push notification enhancement (SM-11)
20. Deep linking v2 + universal links (SM-12)
21. Monetization v2 (SM-14)
22. Sprint planlama ve baslatma
