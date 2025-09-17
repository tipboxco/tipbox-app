export interface QuestionPost {
  id: string;
  user: {
    name: string;
    title: string;
    avatar: any;
  };
  product: {
    name: string;
    subName: string;
    image: any;
  };
  content: string;
  isBoosted?: boolean;
  images?: any[];
  stats: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
}
