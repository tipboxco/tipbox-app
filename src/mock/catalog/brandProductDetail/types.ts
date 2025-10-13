import { ImageSourcePropType } from 'react-native';

export interface ProductDetailStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface ProductDetailUser {
  id: string;
  name: string;
  avatar: ImageSourcePropType;
  title: string;
}

export interface ProductDetailCategory {
  id: string;
  name: string;
  subCategory: string;
  image: ImageSourcePropType;
  product: {
    id: string;
    name: string;
    subName: string;
    image: ImageSourcePropType;
  };
}

export interface ProductDetailTag {
  id: string;
  name: string;
  color: string;
}

export interface ProductDetailExperience {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ProductDetailUsageContext {
  id: string;
  name: string;
  color: string;
}

export interface ProductDetail {
  id: string;
  user: ProductDetailUser;
  category: ProductDetailCategory;
  stats: ProductDetailStats;
  tag: ProductDetailTag;
  createdAt: string;
  content: string;
  images: ImageSourcePropType[];
  experiences: ProductDetailExperience[];
  usageContext: ProductDetailUsageContext[];
}
