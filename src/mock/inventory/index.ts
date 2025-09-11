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
        isNew: true,
        price: '$529',
        rating: {
          price: 4.5,
          product: 4.8
        },
        reviews: {
          price: {
            text: "Bought the Apple Watch Series 9 for $529 at launch. Checkout with Apple Pay was quick, and delivery came in 2 days. Packaging was sleek and minimal, but the stainless steel model...",
            rating: 4.5
          },
          product: {
            text: "The display is bright even outdoors and battery lasts a full day. Build quality feels premium, and integration with my iPhone is seamless. The sport band, however, looks too casual for formal...",
            rating: 4.8
          }
        },
        features: {
          warranty: "3 Weeks",
          delivery: "Fast Delivery",
          quality: "Premium Quality"
        }
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
        image: require('@/assets/inventory/product_02.png'),
        price: '$549',
        rating: {
          price: 4.2,
          product: 4.5
        },
        reviews: {
          price: {
            text: "Purchased the AirPods Max for $549. Premium packaging and fast delivery. The price is steep but the build quality justifies it. Apple Pay checkout was seamless...",
            rating: 4.2
          },
          product: {
            text: "Sound quality is exceptional, noise cancellation works great. The headband is comfortable for long sessions. The only downside is the weight after extended use...",
            rating: 4.5
          }
        },
        features: {
          warranty: "2 Weeks",
          delivery: "Fast Delivery",
          quality: "Premium Quality"
        }
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
        image: require('@/assets/inventory/product_03.png'),
        price: '$1899',
        rating: {
          price: 4.0,
          product: 4.7
        },
        reviews: {
          price: {
            text: "The Galaxy Z Fold 7 is expensive at $1899, but the pre-order bonus and trade-in value made it more reasonable. Samsung's delivery was quick and packaging was secure...",
            rating: 4.0
          },
          product: {
            text: "Amazing device that transforms from phone to tablet. Screen quality is outstanding and multitasking is a breeze. Battery life could be better but fast charging helps...",
            rating: 4.7
          }
        },
        features: {
          warranty: "4 Weeks",
          delivery: "Express Delivery",
          quality: "Premium Quality"
        }
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
