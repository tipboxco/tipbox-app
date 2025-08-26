export interface BridgeCard {
  id: string;
  name: string;
  description: string;
  followers: number;
  logo: any;
  category: string;
  banner: any;
}

export const forYourInterestCards: BridgeCard[] = [
  {
    id: '1',
    name: 'Apple',
    description: 'Markanın Açıklama yazısının bir kısmı burada yazacak. Ne kadar göstereceğimizi sınırlayabiliriz.',
    followers: 120000,
    logo: require('@/assets/bridge/card-icon.png'),
    category: 'Teknoloji',
    banner: require('@/assets/bridge/banner.png'),
  },
  {
    id: '2',
    name: 'Samsung',
    description: 'Markanın Açıklama yazısının bir kısmı burada yazacak. Ne kadar göstereceğimizi sınırlayabiliriz.',
    followers: 120000,
    logo: require('@/assets/bridge/card-icon.png'),
    category: 'Teknoloji',
    banner: require('@/assets/bridge/banner.png'),
  },
  {
    id: '3',
    name: 'Xiaomi',
    description: 'Markanın Açıklama yazısının bir kısmı burada yazacak. Ne kadar göstereceğimizi sınırlayabiliriz.',
    followers: 120000,
    logo: require('@/assets/bridge/card-icon.png'),
    category: 'Teknoloji',
    banner: require('@/assets/bridge/banner.png'),
  },
];

export const exploreCards: BridgeCard[] = [
  {
    id: '4',
    name: 'Nike',
    description: 'Markanın Açıklama yazısının bir kısmı burada yazacak. Ne kadar göstereceğimizi sınırlayabiliriz.',
    followers: 250000,
    logo: require('@/assets/bridge/card-icon.png'),
    category: 'Giyim',
    banner: require('@/assets/bridge/banner.png'),
  },
  {
    id: '5',
    name: 'Adidas',
    description: 'Markanın Açıklama yazısının bir kısmı burada yazacak. Ne kadar göstereceğimizi sınırlayabiliriz.',
    followers: 200000,
    logo: require('@/assets/bridge/card-icon.png'),
    category: 'Giyim',
    banner: require('@/assets/bridge/banner.png'),
  },
  {
    id: '6',
    name: 'Puma',
    description: 'Markanın Açıklama yazısının bir kısmı burada yazacak. Ne kadar göstereceğimizi sınırlayabiliriz.',
    followers: 180000,
    logo: require('@/assets/bridge/card-icon.png'),
    category: 'Giyim',
    banner: require('@/assets/bridge/banner.png'),
  },
];

export const categories = [
  { id: '1', name: 'All' },
  { id: '2', name: 'Teknoloji' },
  { id: '3', name: 'Kişisel Bakım' },
  { id: '4', name: 'Giyim' },
  { id: '5', name: 'Yemek' },
];