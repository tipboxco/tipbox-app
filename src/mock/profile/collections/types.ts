export interface Collection {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  coverImage: any;
  isPrivate: boolean;
  createdAt: string;
  author: {
    name: string;
    avatar: any;
  };
}

export interface CollectionsData {
  all: Collection[];
  created: Collection[];
  saved: Collection[];
}
