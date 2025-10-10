import { Brand, BrandPost, BrandSection, BrandDetail } from './types';

export const mock_brand_data: Brand = {
  id: '1',
  name: 'Apple',
  description: 'Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak.',
  followers: '120K Followers',
  logo: require('@/assets/avatar/ozan.png'),
  bannerImage: require('@/assets/events/banner.png'),
  isJoined: false,
};

export const mock_brand_posts = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Ozan Mutluoğlu',
      avatar: require('@/assets/avatar/ozan.png'),
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
    },
    category: {
      id: '1',
      name: 'Ana Kategori',
      subCategory: 'Alt Kategori > Ürün Grubu > Ürün',
      image: require('@/assets/inventory/product_01.png'),
      product: {
        id: '1',
        name: 'PHILIPS Azur DST8050/20 Buharlı Ütü',
        subName: 'Buharlı Ütü',
        image: require('@/assets/inventory/product_01.png'),
      },
    },
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32,
    },
    tag: 'Kalıcılık / Dayanıklılık',
    createdAt: '2 hours ago',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud...',
    images: [require('@/assets/product/Cat.png')],
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Michael Clark',
      avatar: require('@/assets/avatar/ozan.png'),
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
    },
    category: {
      id: '2',
      name: 'Technology',
      subCategory: 'Home Appliances > Vacuum Cleaners',
      image: require('@/assets/inventory/product_02.png'),
      product: {
        id: '2',
        name: 'Dyson V15s Detect Submarine™ Wet & Dry Cordl...',
        subName: 'Vacuum Cleaner',
        image: require('@/assets/inventory/product_02.png'),
      },
    },
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32,
    },
    tag: 'Price and Shopping Experience',
    createdAt: '4 hours ago',
    content: 'I bought the Dyson V15s Detect Submarine™ from an official Dyson store for around $949. The price felt premium compared to other cordless vacuums, but Dyson often positions itself in...',
    images: [require('@/assets/product/Cat.png')],
  },
];

export const mock_brand_sections: BrandSection[] = [
  {
    id: '1',
    title: 'Anketler & \nOyunlaştırmalar',
    description: 'Anketler ve Oyunlaştırmalar hakkında küçük bir yazı',
    icon: require('@/assets/icons/box.svg'),
    buttonText: 'Explore',
    buttonColor: '#D7D7D7',
  },
  {
    id: '2',
    title: 'Marka Ürünleri \nDefteri',
    description: 'Marka Ürünleri Defteri hakkında küçük bir yazı',
    icon: require('@/assets/icons/bookmark.svg'),
    buttonText: 'View',
    buttonColor: '#D7D7D7',
  },
];

export const mock_brand_detail: BrandDetail = {
  id: '1',
  name: 'Apple',
  description: 'Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak. Marka Açıklamasının uzun hali burada yazacak.',
  followers: '120K Followers',
  logo: require('@/assets/avatar/ozan.png'),
  bannerImage: require('@/assets/events/banner.png'),
  isJoined: false,
  sections: mock_brand_sections,
  posts: mock_brand_posts,
};