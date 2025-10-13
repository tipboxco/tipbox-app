import { ProductDetail } from './types';

export const mock_product_detail: ProductDetail = {
  id: '1',
  user: {
    id: '1',
    name: 'Michael Clark',
    avatar: require('@/assets/avatar/ozan.png'),
    title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
  },
  category: {
    id: '1',
    name: 'Technology',
    subCategory: 'Home Appliances > Vacuum Cleaners',
    image: require('@/assets/inventory/product_02.png'),
    product: {
      id: '1',
      name: 'Dyson V15s Detect Submarine™ Wet & Dry Cordl...',
      subName: 'Vacuum Cleaner',
      image: require('@/assets/inventory/product_02.png'),
    },
  },
  stats: {
    likes: 110,
    comments: 32,
    shares: 11,
    bookmarks: 32,
  },
  tag: {
    id: '1',
    name: 'Price and Shopping Experience',
    color: '#D9D9D9',
  },
  createdAt: '4 hours ago',
  content: 'I bought the Dyson V15s Detect Submarine™ from an official Dyson store for around $949. The price felt premium compared to other cordless vacuums, but Dyson often positions itself in the premium segment. The build quality is excellent, and the design feels modern and functional.',
  images: [
    require('@/assets/inventory/product_02.png'),
    require('@/assets/inventory/product_03.png'),
    require('@/assets/inventory/product_04.png'),
  ],
  experiences: [
    {
      id: '1',
      title: 'Price and Shopping Experience',
      description: 'I bought the Dyson V15s Detect Submarine™ from an official Dyson store for around $949. The price felt premium compared to other cordless vacuums, but Dyson often positions itself in the premium segment.',
      icon: 'tag',
    },
    {
      id: '2',
      title: 'Product and Usage Experience',
      description: 'I bought the Dyson V15s Detect Submarine™ from an official Dyson store for around $949. The price felt premium compared to other cordless vacuums, but Dyson often positions itself in the premium segment.',
      icon: 'package',
    },
  ],
  usageContext: [
    {
      id: '1',
      name: '2 Weeks',
      color: '#E5E5E5',
    },
    {
      id: '2',
      name: 'Could Be Better',
      color: '#E5E5E5',
    },
    {
      id: '3',
      name: 'Daily Use',
      color: '#E5E5E5',
    },
  ],
};
