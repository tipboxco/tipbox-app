export interface LadderItem {
  id: string;
  title: string;
  description: string;
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
  };
}

export interface LadderScreenProps {
  navigation: any;
}

export interface LadderDetailScreenProps {
  route: {
    params: {
      id: string;
    };
  };
  navigation: any;
}

export type LadderStackParamList = {
  LadderScreen: undefined;
};
