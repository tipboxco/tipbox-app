import { PostCards } from '@/src/mock/profile/feed/types';

export const mock_brand_product_experience_posts: PostCards = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Michael Clark',
      avatar: require('@/assets/avatar/ozan.png'),
      title: 'Technology Enthusiast - Hardware Expert - Digital Surfer',
      action: 'Added new product and experiences to inventory!'
    },
    product: {
      id: '1',
      name: 'Dyson V15s Detect Submarine™',
      subName: 'Wet & Dry Cordless Vacuum Cleaner',
      image: require('@/assets/inventory/product_02.png'),
      rating: 4
    },
    content: [
      {
        tag: {
          icon: 'tag',
          title: 'Price and Shopping Experience'
        },
        text: 'I bought the Dyson V15s Detect Submarine™ from an official Dyson store for around $949. The price felt premium compared to other cordless vacuums, but Dyson often positions itself in the premium segment. The build quality is excellent, and the design feels modern and functional. Delivery was fast and packaging was well-protected.',
        rating: [1, 1, 1, 1, 0]
      },
      {
        tag: {
          icon: 'package',
          title: 'Product and Usage Experience'
        },
        text: 'After using it for 2 weeks, the suction power is impressive - easily handles both wet and dry messes. The battery lasts about 40 minutes on regular mode. The only downside is the weight - it\'s heavier than expected for a cordless model. The filtration system works great, and the HEPA filter is easy to replace.',
        rating: [1, 1, 1, 1, 0]
      }
    ],
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32
    },
    tags: ['2 Weeks', 'Highly Recommend', 'Premium Quality'],
    images: [
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png')
    ],
    createdAt: '4 hours ago'
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Sarah Johnson',
      avatar: require('@/assets/avatar/ozan.png'),
      title: 'Home & Lifestyle Expert - Product Reviewer',
      action: 'Added new product and experiences to inventory!'
    },
    product: {
      id: '2',
      name: 'Breville Barista Express',
      subName: 'Espresso Machine',
      image: require('@/assets/inventory/product_03.png'),
      rating: 5
    },
    content: [
      {
        tag: {
          icon: 'tag',
          title: 'Price and Shopping Experience'
        },
        text: 'Purchased from Breville official website during Black Friday sale for $599 (regular $799). Shipping was quick, arrived in perfect condition. The packaging was premium and included detailed setup instructions. Warranty registration was straightforward.',
        rating: [1, 1, 1, 1, 1]
      },
      {
        tag: {
          icon: 'package',
          title: 'Product and Usage Experience'
        },
        text: 'After using the Breville Barista Express for 3 months, I can confidently say it\'s worth every penny. The built-in grinder produces consistent grounds, and the steam wand creates perfect microfoam for latte art. The learning curve was steep, but the results are restaurant-quality. Daily use for morning coffees, and it still looks brand new.',
        rating: [1, 1, 1, 1, 1]
      }
    ],
    stats: {
      likes: 85,
      comments: 24,
      shares: 8,
      bookmarks: 18
    },
    tags: ['3 Months', 'Exceptional', 'Daily Use', 'Worth It'],
    images: [
      require('@/assets/product/Cat.png')
    ],
    createdAt: '6 hours ago'
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'Alex Chen',
      avatar: require('@/assets/avatar/ozan.png'),
      title: 'Tech Reviewer - Gadget Enthusiast',
      action: 'Added new product and experiences to inventory!'
    },
    product: {
      id: '3',
      name: 'Sony WH-1000XM5',
      subName: 'Noise Cancelling Headphones',
      image: require('@/assets/inventory/product_04.png'),
      rating: 5
    },
    content: [
      {
        tag: {
          icon: 'tag',
          title: 'Price and Shopping Experience'
        },
        text: 'Got these from Amazon for $399. Fast Prime delivery, excellent packaging. The box included the headphones, carrying case, cables, and quick start guide. Everything felt premium from the moment I opened it.',
        rating: [1, 1, 1, 1, 1]
      },
      {
        tag: {
          icon: 'package',
          title: 'Product and Usage Experience'
        },
        text: 'The Sony WH-1000XM5 is hands down the best noise-cancelling headphones I\'ve ever used. The sound quality is exceptional, and the noise cancellation is so effective that I can\'t hear my neighbor\'s construction work. Battery life is impressive too - easily lasts a full work week. Comfortable for long listening sessions. Best purchase of the year!',
        rating: [1, 1, 1, 1, 1]
      }
    ],
    stats: {
      likes: 142,
      comments: 45,
      shares: 23,
      bookmarks: 67
    },
    tags: ['1 Month', 'Perfect', 'Top Pick', 'Daily Driver'],
    images: [
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png')
    ],
    createdAt: '8 hours ago'
  }
];

