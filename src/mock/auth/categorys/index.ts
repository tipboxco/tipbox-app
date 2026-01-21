export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

const categories: Category[] = [
  {
    id: '1',
    name: 'Technology',
    subCategories: [
      { id: '1-1', name: 'Smartphones' },
      { id: '1-2', name: 'Computers & Hardware' },
      { id: '1-3', name: 'Software & Applications' },
    ],
  },
  {
    id: '2',
    name: 'Fashion & Clothing',
    subCategories: [
      { id: '2-1', name: "Women's Clothing" },
      { id: '2-2', name: "Men's Clothing" },
      { id: '2-3', name: 'Accessories' },
    ],
  },
  {
    id: '3',
    name: 'Beauty & Personal Care',
    subCategories: [
      { id: '3-1', name: 'Makeup' },
      { id: '3-2', name: 'Skincare' },
      { id: '3-3', name: 'Hair Products' },
    ],
  },
  {
    id: '4',
    name: 'Food & Beverages',
    subCategories: [
      { id: '4-1', name: 'Restaurant Experiences' },
      { id: '4-2', name: 'Snacks' },
      { id: '4-3', name: 'Coffee & Beverages' },
    ],
  },
  {
    id: '5',
    name: 'Games & Entertainment',
    subCategories: [
      { id: '5-1', name: 'Console Games' },
      { id: '5-2', name: 'PC Games' },
      { id: '5-3', name: 'Mobile Games' },
    ],
  },
  {
    id: '6',
    name: 'Sports & Outdoor',
    subCategories: [
      { id: '6-1', name: 'Sports Equipment' },
      { id: '6-2', name: 'Fitness & Health' },
      { id: '6-3', name: 'Outdoor Clothing' },
    ],
  },
  {
    id: '7',
    name: 'Home & Living',
    subCategories: [
      { id: '7-1', name: 'Decoration' },
      { id: '7-2', name: 'Home Appliances' },
      { id: '7-3', name: 'Furniture' },
    ],
  },
  {
    id: '8',
    name: 'Transportation & Travel',
    subCategories: [
      { id: '8-1', name: 'Car Experiences' },
      { id: '8-2', name: 'Travel Equipment' },
      { id: '8-3', name: 'Accommodation' },
    ],
  },
];

export default categories;
