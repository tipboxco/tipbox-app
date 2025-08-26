export interface LadderItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  startDate: string;
  endDate: string;
  progress: number;
  rank?: {
    position: number;
    color: string;
  }[];
  userProgress?: {
    completedTasks: number;
    totalTasks: number;
    avatar?: string;
  };
}

export interface LadderScreenProps {
  navigation: any;
}

export interface LadderDetailScreenProps {
  route: {
    params: {
      item: LadderItem;
    };
  };
  navigation: any;
}

export interface TimeLadderProps {
  item: LadderItem;
  remainingTime: string;
  userScore: number;
  rank: number;
  topUsers: Array<{
    id: string;
    avatar: string;
  }>;
  onDetailPress: () => void;
  onPress: () => void;
}

export interface TimeLadderDetailScreenProps {
  route: {
    params: {
      item: LadderItem;
    };
  };
  navigation: any;
}

export type LadderStackParamList = {
  LadderScreen: undefined;
  LadderDetail: { item: LadderItem };
  TimeLadderDetail: { item: LadderItem };
};
