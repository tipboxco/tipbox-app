import { Ladder } from './types';

export const mock_ladders: Ladder[] = [
  {
    id: '1',
    title: 'Tech Explorer',
    description: 'Review 5 different tech products and share your experiences.',
    image: require('@/assets/ladders/ladders_01.png'),
    progress: {
      current: 3,
      total: 5
    }
  },
  {
    id: '2',
    title: 'Gadget Guru',
    description: 'Complete detailed reviews of 3 premium gadgets.',
    image: require('@/assets/ladders/ladders_02.png'),
    progress: {
      current: 2,
      total: 3
    }
  },
  {
    id: '3',
    title: 'Smart Home Master',
    description: 'Share your experience with 4 different smart home devices.',
    image: require('@/assets/ladders/ladders_03.png'),
    progress: {
      current: 4,
      total: 4
    },
    isCompleted: true
  },
  {
    id: '4',
    title: 'Audio Enthusiast',
    description: 'Review 3 different audio devices and compare their features.',
    image: require('@/assets/ladders/ladders_04.png'),
    progress: {
      current: 1,
      total: 3
    }
  }
];