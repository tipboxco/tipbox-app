import { Post } from '@/src/mock/profile/posts/types';

export const mock_brand_product_posts: Post[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Michael Clark',
      avatar: require('@/assets/avatar/default-useravatar.png'),
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
    tag: 'Price and Shopping Experience',
    createdAt: '4 hours ago',
    content: 'I bought the Dyson V15s Detect Submarine™ from an official Dyson store for around $949. The price felt premium compared to other cordless vacuums, but Dyson often positions itself in the premium segment. The build quality is excellent, and the design feels modern and functional.',
    images: [require('@/assets/product/Cat.png')],
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Sarah Johnson',
      avatar: require('@/assets/avatar/default-useravatar.png'),
      title: 'Home & Lifestyle Expert - Product Reviewer',
    },
    category: {
      id: '2',
      name: 'Home Appliances',
      subCategory: 'Kitchen > Coffee Makers',
      image: require('@/assets/inventory/product_03.png'),
      product: {
        id: '2',
        name: 'Breville Barista Express Espresso Machine',
        subName: 'Espresso Machine',
        image: require('@/assets/inventory/product_03.png'),
      },
    },
    stats: {
      likes: 85,
      comments: 24,
      shares: 8,
      bookmarks: 18,
    },
    tag: 'Product and Usage Experience',
    createdAt: '6 hours ago',
    content: 'After using the Breville Barista Express for 3 months, I can confidently say it\'s worth every penny. The built-in grinder produces consistent grounds, and the steam wand creates perfect microfoam for latte art. The learning curve was steep, but the results are restaurant-quality.',
    images: [require('@/assets/product/Cat.png')],
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'Alex Chen',
      avatar: require('@/assets/avatar/default-useravatar.png'),
      title: 'Tech Reviewer - Gadget Enthusiast',
    },
    category: {
      id: '3',
      name: 'Electronics',
      subCategory: 'Audio > Headphones',
      image: require('@/assets/inventory/product_04.png'),
      product: {
        id: '3',
        name: 'Sony WH-1000XM5 Noise Cancelling Headphones',
        subName: 'Wireless Headphones',
        image: require('@/assets/inventory/product_04.png'),
      },
    },
    stats: {
      likes: 142,
      comments: 45,
      shares: 23,
      bookmarks: 67,
    },
    tag: 'Price and Shopping Experience',
    createdAt: '8 hours ago',
    content: 'The Sony WH-1000XM5 is hands down the best noise-cancelling headphones I\'ve ever used. The sound quality is exceptional, and the noise cancellation is so effective that I can\'t hear my neighbor\'s construction work. Battery life is impressive too - easily lasts a full work week.',
    images: [require('@/assets/product/Cat.png')],
  },
];
