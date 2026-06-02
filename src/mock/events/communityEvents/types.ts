export interface EventProduct {
  id: string;
  name: string;
  image: any;
  category?: string;
}

export interface EventCard {
  id: string;
  title: string;
  description: string;
  image: any;
  dateRange: string;
  participants: number;
  avatars: any[];
  status: 'active' | 'upcoming' | 'completed';
  category: 'community' | 'achievement';
  eventType: import('@/src/utils').EventType;
  product?: EventProduct;
}

export interface Badge {
  id: string;
  title: string;
  image: any;
}

export interface SeeAllReward {
  id: string;
  title: string;
  image: any;
  description: string;
  category: string;
  isUnlocked: boolean;
  completed?: number;
  task?: number;
  tier?: 'bronze' | 'silver' | 'gold';
}

export interface EventFeedCard {
  id: string;
  user: {
    name: string;
    title: string;
    avatar: any;
  };
  product: {
    name: string;
    image: any;
    rating?: number;
  };
  content: {
    title: string;
    description: string;
    image?: any;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  category: string;
}

export interface CommunityEventsData {
  activeEvents: EventCard[];
  upcomingEvents: EventCard[];
  completedEvents: EventCard[];
}
