import { InventoryGroup } from './types';

export const mock_inventory: InventoryGroup[] = [
  {
    id: 'laptops',
    title: 'Laptops',
    items: [
      {
        id: 'macbook-air-m4',
        brand: 'Apple',
        model: 'MacBook Air M4',
        specs: '16GB 256GB SSD',
        image: require('@/assets/inventory/product_01.png'),
        isNew: true
      }
    ]
  },
  {
    id: 'headphones',
    title: 'Headphones',
    items: [
      {
        id: 'airpods-max',
        brand: 'Apple',
        model: 'Airpods Max',
        specs: 'Midnight',
        image: require('@/assets/inventory/product_02.png')
      }
    ]
  },
  {
    id: 'phones',
    title: 'Phones',
    items: [
      {
        id: 'galaxy-z-fold7',
        brand: 'Samsung',
        model: 'Galaxy Z Fold 7',
        specs: '1 TB 16 GB Ram',
        image: require('@/assets/inventory/product_03.png')
      }
    ]
  },
  {
    id: 'tvs',
    title: 'TVs',
    items: [
      {
        id: 'samsung-qn990c',
        brand: 'Samsung',
        model: '98QN990C',
        specs: '8K Ultra HD Smart Neo QLED',
        image: require('@/assets/inventory/product_04.png')
      }
    ]
  },
  {
    id: 'smart-home',
    title: 'Smart Home',
    items: [
      {
        id: 'dyson-purifier',
        brand: 'Dyson',
        model: 'Purifier',
        specs: 'Hot+Cool Formaldehyde',
        image: require('@/assets/inventory/product_05.png')
      },
      {
        id: 'xiaomi-vacuum',
        brand: 'Xiaomi',
        model: 'S20+',
        specs: 'Robot Vacuum',
        image: require('@/assets/inventory/product_06.png')
      }
    ]
  },
  {
    id: 'wearables',
    title: 'Wearables',
    items: [
      {
        id: 'apple-watch-9',
        brand: 'Apple',
        model: 'Watch Series 9',
        specs: 'GPS + Cellular, 45mm',
        image: require('@/assets/inventory/product_07.png')
      }
    ]
  },
  {
    id: 'tablets',
    title: 'Tablets',
    items: [
      {
        id: 'wacom-cintiq',
        brand: 'Wacom',
        model: 'CINTIQ',
        specs: 'DTK2260K0A',
        image: require('@/assets/inventory/product_08.png')
      }
    ]
  },
  {
    id: 'kitchen',
    title: 'Kitchen',
    items: [
      {
        id: 'xiaomi-airfryer',
        brand: 'Xiaomi',
        model: 'Mi Smart Air Fryer',
        specs: 'Essential 6L',
        image: require('@/assets/inventory/product_09.png')
      }
    ]
  }
];
