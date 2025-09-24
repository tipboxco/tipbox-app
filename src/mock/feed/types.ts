export type FeedItemType = 'feed' | 'benchmark' | 'post' | 'question' | 'tipsAndTricks';

export interface BaseFeedItem {
  id: string;
  type: FeedItemType;
  user: {
    id: string;
    name: string;
    title: string;
    avatar: any;
    action?: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  createdAt: string;
}

export interface FeedPost extends BaseFeedItem {
  type: 'feed';
  product: {
    id: string;
    name: string;
    subName: string;
    image: any;
    rating: number;
  };
  content: Array<{
    tag: {
      icon: string;
      title: string;
    };
    text: string;
    rating: number[];
  }>;
  tags: string[];
  images: any[];
}

export interface BenchmarkPost extends BaseFeedItem {
  type: 'benchmark';
  products: Array<{
    id: string;
    name: string;
    subName: string;
    image: any;
    isOwned: boolean;
    choice: boolean;
  }>;
  content: string;
}

export interface Post extends BaseFeedItem {
  type: 'post';
  category: {
    id: string;
    name: string;
    subCategory: string;
    image: any;
    product?: {
      id: string;
      name: string;
      subName: string;
      image: any;
      hasDiscount: boolean;
    };
  };
  content: string;
  tag: string;
  images?: any[];
  isPromoted?: boolean;
}

export interface QuestionPost extends BaseFeedItem {
  type: 'question';
  category: {
    id: string;
    name: string;
    subCategory: string;
    image: any;
    product?: {
      id: string;
      name: string;
      subName: string;
      image: any;
    };
  };
  content: string;
  isBoosted: boolean;
  images: any[];
}

export interface TipsAndTricksPost extends BaseFeedItem {
  type: 'tipsAndTricks';
  category: {
    id: string;
    name: string;
    subCategory: string;
    image: any;
    product?: {
      id: string;
      name: string;
      subName: string;
      image: any;
    };
  };
  content: string;
  images: any[];
  tag: string;
}

export type FeedItem = FeedPost | BenchmarkPost | Post | QuestionPost | TipsAndTricksPost;
