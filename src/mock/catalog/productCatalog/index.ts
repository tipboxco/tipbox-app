import { Category } from './types';

// Figma tasarımından alınan 12 kategori - product görselleri ile
const baseCategories = [
  {
    id: '1',
    name: 'Computers & Tablets',
    icon: 'computer',
    image: require('@/assets/inventory/product_01.png')
  },
  {
    id: '2',
    name: 'Printers & Projectors',
    icon: 'printer',
    image: require('@/assets/inventory/product_02.png')
  },
  {
    id: '3',
    name: 'Phones & Phone Accessories',
    icon: 'smartphone',
    image: require('@/assets/inventory/product_03.png')
  },
  {
    id: '4',
    name: 'TV, Video & Audio Systems',
    icon: 'tv',
    image: require('@/assets/inventory/product_04.png')
  },
  {
    id: '5',
    name: 'Home Appliances',
    icon: 'home',
    image: require('@/assets/inventory/product_05.png')
  },
  {
    id: '6',
    name: 'Air Conditioners & Heaters',
    icon: 'thermometer',
    image: require('@/assets/inventory/product_06.png')
  },
  {
    id: '7',
    name: 'Small Home Appliances',
    icon: 'coffee',
    image: require('@/assets/inventory/product_07.png')
  },
  {
    id: '8',
    name: 'Cameras & Photography',
    icon: 'camera',
    image: require('@/assets/inventory/product_08.png')
  },
  {
    id: '9',
    name: 'Games & Game Consoles',
    icon: 'gamepad',
    image: require('@/assets/inventory/product_09.png')
  },
  {
    id: '10',
    name: 'Headphones & Speakers',
    icon: 'headphones',
    image: require('@/assets/inventory/product_10.png')
  },
  {
    id: '11',
    name: 'Smart Home Devices',
    icon: 'home-automation',
    image: require('@/assets/inventory/product_11.png')
  },
  {
    id: '12',
    name: 'Drones & Action Cameras',
    icon: 'drone',
    image: require('@/assets/inventory/product_12.png')
  }
];

// Her seviyede aynı 12 kategoriyi göstermek için - her kategori kendi subCategories'ini içerir
const createCategoryWithSubCategories = (baseCategory: any): Category => {
  return {
    ...baseCategory,
    subCategories: baseCategories.map(cat => ({
      id: `${baseCategory.id}-${cat.id}`,
      name: cat.name,
      categoryId: baseCategory.id,
      image: cat.image,
      productGroups: baseCategories.map(productGroup => ({
        id: `${baseCategory.id}-${cat.id}-${productGroup.id}`,
        name: productGroup.name,
        subCategoryId: `${baseCategory.id}-${cat.id}`,
        image: productGroup.image,
        products: baseCategories.map(product => ({
          id: `${baseCategory.id}-${cat.id}-${productGroup.id}-${product.id}`,
          name: product.name,
          description: `${product.name} - ${baseCategory.name} kategorisinde`,
          image: product.image,
          price: Math.floor(Math.random() * 50000) + 1000,
          productGroupId: `${baseCategory.id}-${cat.id}-${productGroup.id}`
        }))
      }))
    }))
  };
};

export const catalogData: Category[] = baseCategories.map(createCategoryWithSubCategories);
