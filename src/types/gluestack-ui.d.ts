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

// React Native StyleSheet tip tanımlarını genişletme
// Gluestack UI token'larını desteklemek için
declare module 'react-native' {
  namespace ReactNative {
    interface TextStyle {
      fontSize?: ExtendedFontSize;
    }
  }
}

// Gluestack UI'nin tip tanımlarını genişletme
// StyledComponentProps içindeki fontSize tipini genişletiyoruz
declare module '@gluestack-ui/themed' {
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

