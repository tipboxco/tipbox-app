export interface LadderProgress {
  current: number;
  total: number;
}

export interface Ladder {
  id: string;
  title: string;
  description: string;
  image: any;
  progress: LadderProgress;
  isCompleted?: boolean;
}

export interface LadderSection {
  id: string;
  title: string;
  ladders: Ladder[];
}
