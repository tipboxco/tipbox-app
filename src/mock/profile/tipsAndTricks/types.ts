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

export interface TipsAndTricksCategory {
  id: string;
  name: string;
  subCategory: string;
  product?: TipsAndTricksProduct;
  image: ImageSourcePropType;
}

export interface TipsAndTricksPost {
  id: string;
  user: TipsAndTricksUser;
  category: TipsAndTricksCategory;
  content: string;
  images?: ImageSourcePropType[];
  stats: TipsAndTricksStats;
  tag: string;
  createdAt: string;
}
