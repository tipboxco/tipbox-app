export interface Brand {
  id: string;
  name: string;
  description: string;
  followers: string;
  logo: any;
  bannerImage: any;
  isJoined: boolean;
}

export interface BrandPost {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: any;
    title: string;
  };
  content: {
    title: string;
    description: string;
    productImage: any;
    productName: string;
    category: string;
  };
  interactions: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  tags: string[];
  usageContext: {
    duration: string;
    rating: string;
    frequency: string;
  };
  tip?: {
    title: string;
    content: string;
  };
}

export interface BrandSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  buttonText: string;
  buttonColor: string;
}

export interface BrandDetail {
  id: string;
  name: string;
  description: string;
  followers: string;
  logo: any;
  bannerImage: any;
  isJoined: boolean;
  sections: BrandSection[];
  posts: any[]; // Post tipine uygun olacak şekilde güncellendi
}