// Gluestack UI tip tanımlarını genişletme
// Config'de tanımlanan 4xs ve 3xs font size'larını TypeScript tip sistemine ekliyoruz

// Font size token tipi - config'deki tüm font size'ları içerir
type ExtendedFontSize =
  | '$4xs'
  | '$3xs'
  | '$2xs'
  | '$xs'
  | '$sm'
  | '$md'
  | '$lg'
  | '$xl'
  | '$2xl'
  | '$3xl'
  | '$4xl'
  | '$5xl'
  | '$6xl'
  | '$7xl'
  | '$8xl'
  | '$9xl'
  | number;

// React Native tip tanımlarını genişletme
declare module 'react-native' {
  // React Native'in export ettiği tüm componentleri ve utility'leri export et
  export * from 'react-native';
  
  namespace ReactNative {
    interface TextStyle {
      fontSize?: ExtendedFontSize;
    }
  }
}

// Gluestack UI tip tanımlarını genişletme
declare module '@gluestack-ui/themed' {
  // Gluestack UI'nin export ettiği tüm componentleri export et
  export * from '@gluestack-ui/themed';
  
  // StyledComponentProps'un fontSize property'sini genişlet
  // Bu, Text, Heading ve diğer text componentler için geçerli
  export interface StyledComponentProps<
    TStyle,
    TProps,
    TComponent,
    TName
  > {
    fontSize?: ExtendedFontSize;
  }
}

