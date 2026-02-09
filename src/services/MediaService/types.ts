import type { ImageSourcePropType } from 'react-native';

export interface SaveImageResult {
  success: boolean;
  error?: string;
}

export type ImageSource = ImageSourcePropType | string;
