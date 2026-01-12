import { QuestionPost } from './types';

export const mock_questions: QuestionPost[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Michael Clark',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/default-useravatar.png'),
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
  {
    id: '2',
    user: {
      id: '2',
      name: 'Michael Clark',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/default-useravatar.png'),
    },
    category: {
      id: '2',
      name: 'Technology',
      subCategory: 'Electrical Home Appliances',
      image: require('@/assets/product/product_01.png'),
      product: {
        id: '2',
        name: 'Dyson V15s',
        subName: 'Detect Submarine™ Wet & Dry Cordless',
        image: require('@/assets/product/product_01.png'),
      },
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
  {
    id: '3',
    user: {
      id: '3',
      name: 'Michael Clark',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/default-useravatar.png'),
    },
    category: {
      id: '3',
      name: 'Technology',
      subCategory: 'Electrical Home Appliances',
      image: require('@/assets/inventory/product_05.png'),
    },
    content: 'Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills a...Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills a...',
    isBoosted: true,
    images: [],
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32,
    },
  },
];
