export interface EventCard {
  id: string;
  title: string;
  description: string;
  image: any;
  dateRange: string;
  participants: number;
  avatars: string[];
  status: 'active' | 'upcoming' | 'completed';
  category: 'community' | 'achievement';
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
