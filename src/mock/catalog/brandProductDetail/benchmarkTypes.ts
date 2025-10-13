import { ImageSourcePropType } from 'react-native';

export interface BenchmarkProduct {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType;
  choice: boolean;
  isOwned: boolean;
}

export interface BenchmarkUser {
  id: string;
  name: string;
  avatar: ImageSourcePropType;
  title: string;
}

export interface BenchmarkStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface BenchmarkPost {
  id: string;
  user: BenchmarkUser;
  content: string;
  products: BenchmarkProduct[];
  stats: BenchmarkStats;
  createdAt: string;
}
