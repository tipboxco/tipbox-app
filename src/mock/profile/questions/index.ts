import { QuestionPost } from './types';

export const mock_questions: QuestionPost[] = [
  {
    id: '1',
    user: {
      name: 'Michael Clark',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/ozan.png'),
    },
    product: {
      name: 'Dyson V15s',
      subName: 'Detect Submarine™ Wet & Dry Cordless',
      image: require('@/assets/product/product_01.png'),
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
  {
    id: '2',
    user: {
      name: 'Michael Clark',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/ozan.png'),
    },
    product: {
      name: 'Dyson V15s',
      subName: 'Detect Submarine™ Wet & Dry Cordless',
      image: require('@/assets/product/product_01.png'),
    },
    content: 'Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills a...Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills a...',
    isBoosted: false,
    images: [],
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32,
    },
  },
];
