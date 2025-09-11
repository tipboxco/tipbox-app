import { ComponentType } from 'react';

export interface LadderTask {
  id: string;
  title: string;
  progress: {
    current: number;
    total: number;
  };
  isCompleted?: boolean;
}

export interface LadderStatistic {
  title: string;
  value: string;
  icon: ComponentType<any>;
  description: string;
}

export interface LadderReward {
  title: string;
  icon: ComponentType<any>;
  image: any;
}

export interface LadderDetail {
  id: string;
  title: string;
  description: string;
  image: any;
  statistics: LadderStatistic[];
  rewards: LadderReward[];
  tasks: LadderTask[];
}