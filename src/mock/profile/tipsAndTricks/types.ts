import { ImageSourcePropType } from 'react-native';

export interface TipsAndTricksUser {
  id: string;
  name: string;
  title: string;
  avatar: ImageSourcePropType;
}

export interface TipsAndTricksProduct {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType;
}

export interface TipsAndTricksStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface TipsAndTricksPost {
  id: string;
  user: TipsAndTricksUser;
  product: TipsAndTricksProduct;
  content: string;
  images?: ImageSourcePropType[];
  stats: TipsAndTricksStats;
  tag: string;
  createdAt: string;
}
