export interface Badge {
  image: any;
  title: string;
}

export interface UserCardData {
  id: string;
  name: string;
  avatar: any;
  description: string;
  titles: string[];
  stats: {
    posts: number;
    trust: number;
    truster: number;
  };
  badges: Badge[];
  actions: {
    gift: boolean;
    headphone: boolean;
    chat: boolean;
    notification: boolean;
    trust: boolean;
  };
}