import { ImageSourcePropType } from 'react-native';

export interface PostUser {
  id: string;
  name: string;
  title: string;
  avatar: ImageSourcePropType;
}

export interface PostProduct {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType;
  hasDiscount?: boolean;
}

export interface PostStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface Post {
  id: string;
  user: PostUser;
  product: PostProduct;
  content: string;
  images?: ImageSourcePropType[];
  stats: PostStats;
  tag: string;
  createdAt: string;
  isPromoted?: boolean;
}
