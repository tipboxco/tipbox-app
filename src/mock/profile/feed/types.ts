export interface PostTag {
  icon: string;
  title: string;
}

export interface PostStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface PostUser {
  id: string;
  name: string;
  avatar: any;
  title: string;
  action?: string;
}

export interface PostProduct {
  id: string;
  name: string;
  subName: string;
  image: any;
  rating: number;
}

export interface PostContent {
  tag: PostTag;
  text: string;
  rating: number[];
}

export interface PostCard {
  id: string;
  user: PostUser;
  product: PostProduct;
  content: PostContent[];
  stats: PostStats;
  tags: string[];
  images: any[];
  createdAt: string;
}

export type PostCards = PostCard[];