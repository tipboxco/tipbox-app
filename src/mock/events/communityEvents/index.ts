import { CommunityEventsData, Badge, EventFeedCard, SeeAllReward } from './types';
import { EventType } from '@/src/utils';

export const rewards_badges_mock: Badge[] = [
  {
    id: '1',
    title: 'Shutterhead',
    image: require('@/assets/events/badge_01.png'),
  },
  {
    id: '2', 
    title: 'Vote Voyager',
    image: require('@/assets/events/badge_02.png'),
  },
  {
    id: '3',
    title: 'Tracksmith',
    image: require('@/assets/events/badge_03.png'),
  },
  {
    id: '4',
    title: 'Tech Explorer',
    image: require('@/assets/events/badge_04.png'),
  }
];

export const see_all_reward_mock: SeeAllReward[] = [
  {
    id: '1',
    title: 'Shutterhead',
    image: require('@/assets/events/badge_01.png'),
    description: 'Complete 5 photography challenges to unlock this badge',
    category: 'Photography',
    isUnlocked: true,
    task: 5,
    completed: 5,
  },
  {
    id: '2',
    title: 'Vote Voyager',
    image: require('@/assets/events/badge_02.png'),
    description: 'Participate in 10 community votes to earn this badge',
    category: 'Community',
    isUnlocked: true,
    task: 10,
    completed: 10,
  },
  {
    id: '3',
    title: 'Tracksmith',
    image: require('@/assets/events/badge_03.png'),
    description: 'Complete 3 fitness challenges to unlock this badge',
    category: 'Fitness',
    isUnlocked: false,
    task: 10,
    completed: 8,
  },
  {
    id: '4',
    title: 'Tech Explorer',
    image: require('@/assets/events/badge_04.png'),
    description: 'Share 5 technology insights to earn this badge',
    category: 'Technology',
    isUnlocked: true,
    task: 5,
    completed: 5,
  },
  {
    id: '5',
    title: 'Creative Master',
    image: require('@/assets/events/badge_01.png'),
    description: 'Create 10 original content pieces to unlock this badge',
    category: 'Creative',
    isUnlocked: false,
    task: 10,
    completed: 2,
  },
  {
    id: '6',
    title: 'Social Butterfly',
    image: require('@/assets/events/badge_02.png'),
    description: 'Engage with 50 community posts to earn this badge',
    category: 'Social',
    isUnlocked: false,
    task: 10,
    completed: 0,
  },
];

export const mock_community_events: CommunityEventsData = {
  activeEvents: [
    {
      id: '1',
      title: 'Wishbox Etkinlik Adı Etkin...',
      description: "You're heading out for a weekend walk in Belgrade. What will you bring a camera to capture stories, music to set the mood, or tech to guide your steps? Your choice defines your journey.",
      image: require('@/assets/events/card-icon.png'),
      dateRange: '08 May 2025 - 15 May 2025',
      participants: 120,
      avatars: [
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
      ],
      status: 'active',
      category: 'community',
      eventType: EventType.TYPE1,
    },
    {
      id: '2',
      title: 'Wishbox Etkinlik Adı Etkin...',
      description: "You're heading out for a weekend walk in Belgrade. What will you bring a camera to capture stories, music to set the mood, or tech to guide your steps? Your choice defines your journey.",
      image: require('@/assets/events/card-icon.png'),
      dateRange: '10 May 2025 - 17 May 2025',
      participants: 85,
      avatars: [
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
      ],
      status: 'active',
      category: 'community',
      eventType: EventType.TYPE2,
      product: {
        id: 'product-1',
        name: 'iPhone 15 Pro Max',
        image: require('@/assets/inventory/product_02.png'),
        category: 'Technology',
      },
    },
    {
      id: '3',
      title: 'Wishbox Etkinlik Adı Etkin...',
      description: "You're heading out for a weekend walk in Belgrade. What will you bring a camera to capture stories, music to set the mood, or tech to guide your steps? Your choice defines your journey.",
      image: require('@/assets/events/card-icon.png'),
      dateRange: '12 May 2025 - 19 May 2025',
      participants: 95,
      avatars: [
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
      ],
      status: 'active',
      category: 'community',
      eventType: EventType.TYPE1,
    }
  ],
  upcomingEvents: [
    {
      id: '4',
      title: 'Wishbox Etkinlik Adı Etkin...',
      description: "You're heading out for a weekend walk in Belgrade. What will you bring a camera to capture stories, music to set the mood, or tech to guide your steps? Your choice defines your journey.",
      image: require('@/assets/events/card-icon.png'),
      dateRange: '20 May 2025 - 27 May 2025',
      participants: 0,
      avatars: [
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
      ],
      status: 'upcoming',
      category: 'community',
      eventType: EventType.TYPE1,
    },
    {
      id: '5',
      title: 'Wishbox Etkinlik Adı Etkin...',
      description: "You're heading out for a weekend walk in Belgrade. What will you bring a camera to capture stories, music to set the mood, or tech to guide your steps? Your choice defines your journey.",
      image: require('@/assets/events/card-icon.png'),
      dateRange: '25 May 2025 - 01 Jun 2025',
      participants: 0,
      avatars: [
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
      ],
      status: 'upcoming',
      category: 'community',
      eventType: EventType.TYPE1,
    },
    {
      id: '6',
      title: 'Wishbox Etkinlik Adı Etkin...',
      description: "You're heading out for a weekend walk in Belgrade. What will you bring a camera to capture stories, music to set the mood, or tech to guide your steps? Your choice defines your journey.",
      image: require('@/assets/events/card-icon.png'),
      dateRange: '30 May 2025 - 06 Jun 2025',
      participants: 0,
      avatars: [
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
      ],
      status: 'upcoming',
      category: 'community',
      eventType: EventType.TYPE1,
    }
  ],
  completedEvents: [
    {
      id: '7',
      title: 'Wishbox Etkinlik Adı Etkin...',
      description: "You're heading out for a weekend walk in Belgrade. What will you bring a camera to capture stories, music to set the mood, or tech to guide your steps? Your choice defines your journey.",
      image: require('@/assets/events/card-icon.png'),
      dateRange: '01 May 2025 - 08 May 2025',
      participants: 150,
      avatars: [
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
        require('@/assets/avatar/ozan.png'),
      ],
      status: 'completed',
      category: 'community',
      eventType: EventType.TYPE1,
    }
  ]
};
