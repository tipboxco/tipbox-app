import { PostCards } from './types';

export const mock_post_cards: PostCards = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Georgia Green',
      avatar: require('@/assets/avatar/default-useravatar.png'),
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
    id: '2',
    user: {
      id: '1',
      name: 'Georgia Green',
      avatar: require('@/assets/avatar/default-useravatar.png'),
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
  }
];