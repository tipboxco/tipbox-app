import { FeedItem } from './types';

export const mock_feed_data: FeedItem[] = [
  // Feed Posts
  {
    id: 'feed-1',
    type: 'feed',
    user: {
      id: '1',
      name: 'Georgia Green',
      avatar: require('@/assets/avatar/ozan.png'),
      title: 'Everyday Consumer - Home Appliance Enthusiast - Product Reviewer',
      action: 'Added new product and experiences to inventory!'
    },
    product: {
      id: '1',
      name: 'PHILIPS Azur ',
      subName: 'DST8050/20 Steam Iron',
      image: require('@/assets/product/product_01.png'),
      rating: 3
    },
    content: [
      {
        tag: {
          icon: 'tag',
          title: 'Price and Shopping Experience'
        },
        text: 'Purchased at $129 during a promo. Delivered within 48 hours, packaging was solid. E-invoice and warranty were auto-saved to my inventory. Purchased at $129 during a promo. Delivered within 48 hours, packaging was solid. E-invoice and warranty were auto-saved to my inventory.',
        rating: [1, 1, 1, 0, 0]
      },
      {
        tag: {
          icon: 'package',
          title: 'Product and Usage Experience'
        },
        text: 'Been using it for 2 weeks, around 15 min/day. Heats up quickly, steam power is strong. The only downside: small water tank requires frequent refills. Been using it for 2 weeks, around 15 min/day. Heats up quickly, steam power is strong. The only downside: small water tank requires frequent refills.',
        rating: [1, 1, 1, 0, 0]
      }
    ],
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32
    },
    tags: ['2 Weeks', 'Could Be Better', 'Daily Use'],
    images: [
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png')
    ],
    createdAt: '4.7 Days'
  },
  {
    id: 'feed-2',
    type: 'feed',
    user: {
      id: '1',
      name: 'Georgia Green',
      avatar: require('@/assets/avatar/ozan.png'),
      title: 'Everyday Consumer - Home Appliance Enthusiast - Product Reviewer',
      action: 'Added new product and experiences to inventory!'
    },
    product: {
      id: '2',
      name: 'SAMSUNG Galaxy',
      subName: 'Watch 6 Classic',
      image: require('@/assets/product/product_02.png'),
      rating: 4
    },
    content: [
      {
        tag: {
          icon: 'tag',
          title: 'Price and Shopping Experience'
        },
        text: 'Got it from Samsung Store during pre-order period. Great unboxing experience, premium packaging. Watch came with 2 band options. Got it from Samsung Store during pre-order period. Great unboxing experience, premium packaging. Watch came with 2 band options.',
        rating: [1, 1, 1, 1, 0]
      },
      {
        tag: {
          icon: 'package',
          title: 'Product and Usage Experience'
        },
        text: 'Using it for a month now. Battery life is impressive (3-4 days), health tracking is accurate. The rotating bezel is intuitive. Screen is bright and responsive. Using it for a month now. Battery life is impressive (3-4 days), health tracking is accurate. The rotating bezel is intuitive. Screen is bright and responsive.',
        rating: [1, 1, 1, 1, 0]
      }
    ],
    stats: {
      likes: 245,
      comments: 48,
      shares: 15,
      bookmarks: 67
    },
    tags: ['1 Month', 'Satisfied', 'Daily Driver'],
    images: [],
    createdAt: '2.3 Days'
  },

  // Benchmark Posts
  {
    id: 'benchmark-1',
    type: 'benchmark',
    user: {
      id: '1',
      name: 'Michael Clark',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/ozan.png'),
    },
    products: [
      {
        id: '1',
        name: 'PHILIPS AZUR',
        subName: 'DST8050/20 Steam Iron',
        image: require('@/assets/product/Cat.png'),
        isOwned: true,
        choice: true,
      },
      {
        id: '2',
        name: 'PHILIPS AZUR',
        subName: 'DST8050/20 Steam Iron',
        image: require('@/assets/product/Cat.png'),
        isOwned: false,
        choice: false,
      },
    ],
    content: 'Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills a...Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and brilliantly for kitchen and bathroom floors, picking up spills r kitchen and bathro...',
    stats: {
      likes: 324,
      comments: 56,
      shares: 23,
      bookmarks: 89,
    },
    createdAt: '2024-03-17T10:30:00Z',
  },

  // Posts
  {
    id: 'post-1',
    type: 'post',
    user: {
      id: '1',
      name: 'Michael Clark',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/ozan.png'),
    },
    category: {
      id: '1',
      name: 'Technology Subcategories',
      subCategory: 'Technology Subcategories',
      image: require('@/assets/product/product_01.png'),
      product: {
        id: '1',
        name: 'Dyson V15s',
        subName: 'Detect Submarine™ Wet & Dry Cordless Vacuum',
        image: require('@/assets/product/product_01.png'),
        hasDiscount: true,
      },
    },
    content: 'Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills and leaving surfaces spotless. The suction power is incredible, and switching between wet and dry modes is seamless.',
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32,
    },
    tag: 'Permanence / Durability',
    createdAt: '2024-03-17T10:30:00Z',
  },

  // Questions
  {
    id: 'question-1',
    type: 'question',
    user: {
      id: '1',
      name: 'Michael Clark',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/ozan.png'),
    },
    category: {
      id: '1',
      name: 'Technology',
      subCategory: 'Electrical Home Appliances',
      image: require('@/assets/product/product_01.png'),
      product: {
        id: '1',
        name: 'Dyson V15s',
        subName: 'Detect Submarine™ Wet & Dry Cordless',
        image: require('@/assets/product/product_01.png'),
      },
    },
    content: 'Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills a...Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills a...',
    isBoosted: true,
    images: [
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png'),
    ],
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32,
    },
  },

  // Tips and Tricks
  {
    id: 'tips-1',
    type: 'tipsAndTricks',
    user: {
      id: '1',
      name: 'John Doe',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/ozan.png'),
    },
    category: {
      id: '1',
      name: 'Technology',
      subCategory: 'Computer / Tablets',
      image: require('@/assets/product/product_01.png'),
      product: {
        id: '1',
        name: 'MacBook Pro M2',
        subName: 'Apple',
        image: require('@/assets/product/product_01.png'),
      },
    },
    content: 'MacBook Pro M2 kullanıcıları için önemli bir ipucu: Batarya ömrünü uzatmak için "Optimized Battery Charging" özelliğini aktif tutun. Bu özellik, kullanım alışkanlıklarınızı öğrenerek şarj döngüsünü optimize eder. MacBook Pro M2 kullanıcıları için önemli bir ipucu: Batarya ömrünü uzatmak için "Optimized Battery Charging" özelliğini aktif tutun. Bu özellik, kullanım alışkanlıklarınızı öğrenerek şarj döngüsünü optimize eder.',
    images: [],
    stats: {
      likes: 245,
      comments: 23,
      shares: 12,
      bookmarks: 45,
    },
    tag: 'Battery',
    createdAt: '2024-03-17T10:30:00Z',
  },

  // Update Posts
  {
    id: 'update-1',
    type: 'update',
    user: {
      id: '1',
      name: 'Sarah Johnson',
      title: 'Product Reviewer - Tech Enthusiast - Early Adopter',
      avatar: require('@/assets/avatar/ozan.png'),
      action: 'Updated their post',
    },
    product: {
      id: '1',
      name: 'Dyson V15s',
      subName: 'Detect Submarine™ Wet & Dry Cordless Vacuum',
      image: require('@/assets/product/product_01.png'),
      hasDiscount: false,
    },
    content: 'I\'ve been using this vacuum for over a month now and wanted to share an update. The battery life has been consistently good, lasting about 45 minutes on full power. The wet cleaning feature works great for kitchen spills. I\'ve been using this vacuum for over a month now and wanted to share an update. The battery life has been consistently good, lasting about 45 minutes on full power.',
    images: [
      require('@/assets/product/Cat.png'),
    ],
    stats: {
      likes: 89,
      comments: 15,
      shares: 8,
      bookmarks: 22,
    },
    updateInfo: {
      title: 'Post Updated',
      description: 'Added new information about battery life and usage experience',
    },
    createdAt: '2024-03-18T14:20:00Z',
  },
];
