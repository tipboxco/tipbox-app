export interface QuestionPost {
  id: string;
  user: {
    id: string;
    name: string;
    title: string;
    avatar: any;
  };
  category: QuestionCategory;
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

export interface QuestionCategory {
  id: string;
  name: string;
  subCategory: string;
  image: any;
  product?: QuestionProduct;
}

export interface QuestionProduct {
  id: string;
  name: string;
  subName: string;
  image: any;
}
