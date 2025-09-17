import { ImageSourcePropType } from 'react-native';

export interface BenchmarkUser {
  id: string;
  name: string;
  title: string;
  avatar: ImageSourcePropType;
}

export interface BenchmarkProduct {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType;
  isOwned: boolean;
  choice: boolean;
}

export interface BenchmarkStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface BenchmarkScore {
  overall: number;
  performance: number;
  design: number;
  battery: number;
  camera: number;
  display: number;
}

export interface BenchmarkPost {
  id: string;
  user: BenchmarkUser;
  products: BenchmarkProduct[];
  content: string;
  stats: BenchmarkStats;
  createdAt: string;
}
