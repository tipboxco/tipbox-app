import type { ImageSourcePropType } from 'react-native';

/**
 * Marketplace Listing API Item
 * /marketplace/listings endpoint'inden gelen NFT satış verisi
 */
export interface MarketplaceListingApiItem {
  id: string;
  title: string;
  username: string;
  price: string;
  image: string;
  userAvatar: string;
}

/**
 * Marketplace Listings API Response
 * Endpoint direkt array döndürüyor, pagination bilgisi response'da yok
 * Limit ve offset'e göre pagination yapılacak
 */
export type MarketplaceListingsApiResponse = MarketplaceListingApiItem[];

/**
 * Marketplace Listings Query Parameters
 */
export interface MarketplaceListingsParams {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  rarity?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
}

/**
 * NFTCard Component Data
 * NFTCard component'inin beklediği veri formatı
 */
export interface NFTCardData {
  id: string;
  title: string;
  username: string;
  price: string;
  image: ImageSourcePropType;
  userAvatar?: string; // Şu an kullanılmıyor ama ileride kullanılabilir
}

