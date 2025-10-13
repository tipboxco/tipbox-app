import { ImageSourcePropType } from 'react-native';

export interface NewsDetailStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface NewsDetail {
  id: string;
  title: string;
  content: string;
  source: string;
  date: string;
  image: ImageSourcePropType;
  stats: NewsDetailStats;
  url?: string;
}
