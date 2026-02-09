export interface Collection {
  id: string;
  title: string;
  description: string;
  currentProgress: number;
  totalProgress: number;
  backgroundGradient: {
    colors: string[];
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  category?: string;
}

export interface CollectionsResponse {
  collections: Collection[];
  total: number;
}
