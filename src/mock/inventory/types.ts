export interface InventoryGroup {
  id: string;
  title: string;
  items: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  brand: string;
  model: string;
  specs: string;
  image: any;
  isNew?: boolean;
  price?: string;
  rating?: {
    price: number;
    product: number;
  };
  reviews?: {
    price: {
      text: string;
      rating: number;
    };
    product: {
      text: string;
      rating: number;
    };
  };
  features?: {
    warranty: string;
    delivery: string;
    quality: string;
  };
}