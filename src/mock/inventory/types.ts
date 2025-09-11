export interface InventoryItem {
  id: string;
  brand: string;
  model: string;
  specs: string;
  image: any; // React Native Image source
  isNew?: boolean;
}

export interface InventoryGroup {
  id: string;
  title: string;
  items: InventoryItem[];
}

export interface InventoryState {
  searchQuery: string;
  groups: InventoryGroup[];
  selectedItem?: string;
}
