export interface NotificationItem {
  id: string;
  type: 'like' | 'tip' | 'comment' | 'trust';
  user: {
    name: string;
    avatar: any;
  };
  message: string;
  timeAgo: string;
  content?: {
    title: string;
    description: string;
    image?: any;
    category?: string;
  };
  action?: {
    text: string;
    onPress: () => void;
  };
}

export interface NotificationFilter {
  id: string;
  label: string;
  isActive: boolean;
}
