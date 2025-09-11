import { PostCard } from './types';

export const mock_post_card: PostCard = {
  id: '1',
  user: {
    id: '1',
    name: 'Georgia Green',
    avatar: require('@/assets/avatar/ozan.png'),
    title: 'Everyday Consumer - Home Appliance Enthusiast - Product Reviewer',
    action: 'Added new product and experiences to inventory!'
  },
  product: {
    id: '1',
    name: 'PHILIPS Azur DST8050/20 Steam Iron',
    image: require('@/assets/product/product_01.png'),
    rating: 3
  },
  content: [
    {
      tag: {
        icon: 'tag',
        title: 'Price and Shopping Experience'
      },
      text: 'Purchased at $129 during a promo. Delivered within 48 hours, packaging was solid. E-invoice and warranty were auto-saved to my inventory.',
      rating: [1, 1, 1, 0, 0]
    },
    {
      tag: {
        icon: 'package',
        title: 'Product and Usage Experience'
      },
      text: 'Been using it for 2 weeks, around 15 min/day. Heats up quickly, steam power is strong. The only downside: small water tank requires frequent refills.',
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
  createdAt: '4.7 Days'
};
