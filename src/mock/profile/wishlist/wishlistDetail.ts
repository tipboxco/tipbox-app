import { WishlistDetailItem } from '@/src/features/profile/types';

export const mockWishlistDetail: WishlistDetailItem[] = [
  {
    id: '1',
    productName: 'Apple iPhone 15 Pro Max',
    price: '64.999 TL',
    image: require('@/assets/product/product_01.png'),
    store: 'Apple Store',
    storeImage: require('@/assets/product/product_01.png'),
    addedDate: '2 days ago',
    isAvailable: true
  },
  {
    id: '2',
    productName: 'MacBook Pro M3 Max',
    price: '124.999 TL',
    image: require('@/assets/product/product_02.png'),
    store: 'Apple Store',
    storeImage: require('@/assets/product/product_02.png'),
    addedDate: '3 days ago',
    isAvailable: true
  },
  {
    id: '3',
    productName: 'Apple Vision Pro',
    price: '84.999 TL',
    image: require('@/assets/product/product_01.png'),
    store: 'Apple Store',
    storeImage: require('@/assets/product/product_01.png'),
    addedDate: '5 days ago',
    isAvailable: false
  }
];
