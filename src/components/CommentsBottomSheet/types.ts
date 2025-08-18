export interface Comment {
  id: string;
  user: {
    name: string;
    avatar: any;
    badge?: {
      text: string;
      color: string;
      borderColor: string;
    };
  };
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}

export interface CommentsBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
}
