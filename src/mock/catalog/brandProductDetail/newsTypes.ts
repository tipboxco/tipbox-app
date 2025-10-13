import { ImageSourcePropType } from 'react-native';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  image: ImageSourcePropType;
  url?: string;
}
