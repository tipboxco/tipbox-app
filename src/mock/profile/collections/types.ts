export interface Collection {
  id: string;
  title: string;
  description: string;
  image: any;
  type: 'usual' | 'rare';
  isCompleted: boolean;
}
