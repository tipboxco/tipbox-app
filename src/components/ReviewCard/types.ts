export interface ReviewCardBaseProps {
  title: string;
  content: string;
  productImage: any;
  productName: string;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  rating: number;
  usageDuration: string;
  experience: string;
  userImage: any;
  userName: string;
  userBadge: string;
  userAction: string;
  onPress?: (review: any) => void;
}

export interface ReviewCardProps extends ReviewCardBaseProps {
  useCase: string;
}

export interface ReviewImageCardProps extends ReviewCardBaseProps {
  mainImage: any;
}
