import { ImageSourcePropType } from 'react-native';

export interface ProductStats {
  reviews: number;
  likes: number;
  shares: number;
}

export interface Product {
  id: string;
  name: string;
  image: ImageSourcePropType;
  stats: ProductStats;
}

export interface ProductGroup {
  id: string;
  title: string;
  products: Product[];
}

export interface BrandProductData {
  id: string;
  title: string;
  productGroups: ProductGroup[];
}
