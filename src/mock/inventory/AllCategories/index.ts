export interface Product {
  id: string;
  name: string;
  image: string;
  rating: number;
}

export interface ProductGroup {
  id: string;
  name: string;
  image: string;
  products: Product[];
}

export interface SubCategory {
  id: string;
  name: string;
  image: string;
  productGroups: ProductGroup[];
}

export interface MainCategory {
  id: string;
  name: string;
  image: string;
  subCategories: SubCategory[];
}

// Her seviye için farklı bir resim kullanıyoruz
const MAIN_CATEGORY_IMAGE = 'https://picsum.photos/200/200';
const SUB_CATEGORY_IMAGE = 'https://picsum.photos/201/201';
const PRODUCT_GROUP_IMAGE = 'https://picsum.photos/202/202';
const PRODUCT_IMAGE = 'https://picsum.photos/203/203';

export const categories: MainCategory[] = [
  {
    id: 'technology',
    name: 'Teknoloji',
    image: MAIN_CATEGORY_IMAGE,
    subCategories: [
      {
        id: 'smartphones',
        name: 'Akıllı Telefonlar',
        image: SUB_CATEGORY_IMAGE,
        productGroups: [
          {
            id: 'flagship',
            name: 'Amiral Gemisi',
            image: PRODUCT_GROUP_IMAGE,
            products: [
              { id: 'iphone15pro', name: 'iPhone 15 Pro', image: PRODUCT_IMAGE, rating: 4.5 },
              { id: 's24ultra', name: 'Samsung S24 Ultra', image: PRODUCT_IMAGE, rating: 4.8 }
            ]
          },
          {
            id: 'midrange',
            name: 'Orta Segment',
            image: PRODUCT_GROUP_IMAGE,
            products: [
              { id: 'xiaomi13t', name: 'Xiaomi 13T', image: PRODUCT_IMAGE, rating: 4.2 },
              { id: 'realme-gt-neo', name: 'Realme GT Neo', image: PRODUCT_IMAGE, rating: 4.0 }
            ]
          },
          {
            id: 'foldable',
            name: 'Katlanabilir',
            image: PRODUCT_GROUP_IMAGE,
            products: [
              { id: 'zfold', name: 'Galaxy Z Fold', image: PRODUCT_IMAGE, rating: 4.6 },
              { id: 'mate-x', name: 'Huawei Mate X', image: PRODUCT_IMAGE, rating: 4.3 }
            ]
          }
        ]
      },
      {
        id: 'computers',
        name: 'Bilgisayar & Laptop',
        image: SUB_CATEGORY_IMAGE,
        productGroups: [
          {
            id: 'gaming-laptop',
            name: 'Oyun Laptopu',
            image: PRODUCT_GROUP_IMAGE,
            products: [
              { id: 'rog-strix', name: 'ASUS ROG Strix', image: PRODUCT_IMAGE, rating: 4.7 },
              { id: 'msi-raider', name: 'MSI Raider', image: PRODUCT_IMAGE, rating: 4.5 }
            ]
          },
          {
            id: 'ultrabook',
            name: 'Ultrabook',
            image: PRODUCT_GROUP_IMAGE,
            products: [
              { id: 'macbook-air-m2', name: 'MacBook Air M2', image: PRODUCT_IMAGE, rating: 4.9 },
              { id: 'dell-xps-13', name: 'Dell XPS 13', image: PRODUCT_IMAGE, rating: 4.6 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'fashion',
    name: 'Moda & Giyim',
    image: MAIN_CATEGORY_IMAGE,
    subCategories: [
      {
        id: 'womens-clothing',
        name: 'Kadın Giyim',
        image: SUB_CATEGORY_IMAGE,
        productGroups: [
          {
            id: 'dresses',
            name: 'Elbiseler',
            image: PRODUCT_GROUP_IMAGE,
            products: [
              { id: 'zara-midi', name: 'Zara Midi Dress', image: PRODUCT_IMAGE, rating: 4.4 },
              { id: 'hm-summer', name: 'H&M Summer Dress', image: PRODUCT_IMAGE, rating: 4.2 }
            ]
          },
          {
            id: 'blouse-shirt',
            name: 'Bluz & Gömlek',
            image: PRODUCT_GROUP_IMAGE,
            products: [
              { id: 'mango-blouse', name: 'Mango Bluz', image: PRODUCT_IMAGE, rating: 4.1 },
              { id: 'lcw-shirt', name: 'LCW Gömlek', image: PRODUCT_IMAGE, rating: 4.0 }
            ]
          }
        ]
      }
    ]
  }
  // Diğer ana kategoriler buraya eklenecek
];
