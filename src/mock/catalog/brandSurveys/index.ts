import { Survey, SurveyTab, Event, EventDetail } from './types';
import { BenchmarkPost } from '@/src/mock/profile/benchmark/types';
import { TipsAndTricksPost } from '@/src/mock/profile/tipsAndTricks/types';
import { Post } from '@/src/mock/profile/posts/types';

export const mock_survey_tabs: SurveyTab[] = [
  { id: '1', name: 'Anketler', isActive: true },
  { id: '2', name: 'Trendler', isActive: false },
  { id: '3', name: 'Etkinlikler', isActive: false },
];

export const mock_surveys: Survey[] = [
  {
    id: '1',
    title: 'iPhone 16 Pro Max Kullanıcı Deneyimi Anketi',
    description: 'Yeni iPhone 16 Pro Max hakkında görüşlerinizi paylaşın',
    type: 'Anket Tipi',
    duration: '3min',
    points: 250,
    status: 'start',
    brand: {
      id: '1',
      name: 'Apple',
      logo: require('@/assets/events/card-icon.png'),
      category: 'Technology',
    },
    user: {
      id: '1',
      name: 'Michael Clark',
      avatar: require('@/assets/avatar/default-useravatar.png'),
      title: 'Technology Enthusiast',
    },
  },
  {
    id: '2',
    title: 'Samsung Galaxy S25 Ultra Karşılaştırma Anketi',
    description: 'Samsung Galaxy S25 Ultra ile ilgili deneyimlerinizi anlatın',
    type: 'Anket Tipi',
    duration: '3min',
    points: 250,
    status: 'continue',
    brand: {
      id: '2',
      name: 'Samsung',
      logo: require('@/assets/events/card-icon.png'),
      category: 'Technology',
    },
    user: {
      id: '2',
      name: 'Sarah Johnson',
      avatar: require('@/assets/avatar/default-useravatar.png'),
      title: 'Mobile Expert',
    },
    progress: 60,
  },
  {
    id: '3',
    title: 'Google Pixel 9 Pro Kamera Performans Anketi',
    description: 'Google Pixel 9 Pro kamera kalitesi hakkında görüşleriniz',
    type: 'Anket Tipi',
    duration: '3min',
    points: 250,
    status: 'view_results',
    brand: {
      id: '3',
      name: 'Google',
      logo: require('@/assets/events/card-icon.png'),
      category: 'Technology',
    },
    user: {
      id: '3',
      name: 'Alex Chen',
      avatar: require('@/assets/avatar/default-useravatar.png'),
      title: 'Camera Specialist',
    },
    progress: 100,
  },
  {
    id: '4',
    title: 'OnePlus 13 Pro Performans Testi Anketi',
    description: 'OnePlus 13 Pro performans deneyiminizi paylaşın',
    type: 'Anket Tipi',
    duration: '3min',
    points: 250,
    status: 'start',
    brand: {
      id: '4',
      name: 'OnePlus',
      logo: require('@/assets/events/card-icon.png'),
      category: 'Technology',
    },
    user: {
      id: '4',
      name: 'David Wilson',
      avatar: require('@/assets/avatar/default-useravatar.png'),
      title: 'Performance Tester',
    },
  },
];

// Mock data for Trendler tab
export const mockBenchmarkData: BenchmarkPost = {
  id: '1',
  user: {
    id: '1',
    name: 'Ahmet Yılmaz',
    title: 'Tech Expert',
    avatar: require('@/assets/avatar/default-useravatar.png'),
  },
  products: [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      subName: 'Apple',
      image: require('@/assets/product/product_01.png'),
      isOwned: true,
      choice: true,
    },
    {
      id: '2',
      name: 'Samsung Galaxy S24',
      subName: 'Samsung',
      image: require('@/assets/product/product_02.png'),
      isOwned: false,
      choice: false,
    },
  ],
  content: 'iPhone 15 Pro vs Samsung Galaxy S24 karşılaştırması. Hangi telefon daha iyi performans sunuyor?',
  stats: {
    likes: 24,
    comments: 8,
    shares: 3,
    bookmarks: 12,
  },
  createdAt: '2024-01-15',
};

export const mockTipsAndTricksData: TipsAndTricksPost = {
  id: '1',
  user: {
    id: '1',
    name: 'Elif Kaya',
    title: 'Mobile Expert',
    avatar: require('@/assets/avatar/default-useravatar.png'),
  },
  category: {
    id: '1',
    name: 'iPhone',
    subCategory: 'Optimization',
    product: {
      id: '1',
      name: 'iPhone 15 Pro',
      subName: 'Apple',
      image: require('@/assets/product/product_01.png'),
    },
    image: require('@/assets/product/product_01.png'),
  },
  content: 'iPhone pil ömrünü uzatmak için 5 önemli ipucu. Bu yöntemlerle telefonunuz daha uzun süre dayanacak.',
  images: [
    require('@/assets/product/product_01.png'),
    require('@/assets/product/product_02.png'),
  ],
  stats: {
    likes: 18,
    comments: 5,
    shares: 2,
    bookmarks: 8,
  },
  tag: 'iPhone Tips',
  createdAt: '2024-01-14',
};

export const mockPostData: Post = {
  id: '1',
  user: {
    id: '1',
    name: 'Mehmet Demir',
    title: 'Gadget Reviewer',
    avatar: require('@/assets/avatar/default-useravatar.png'),
  },
  category: {
    id: '1',
    name: 'Technology',
    subCategory: 'Reviews',
    product: {
      id: '1',
      name: 'MacBook Pro M3',
      subName: 'Apple',
      image: require('@/assets/product/product_01.png'),
      hasDiscount: true,
    },
    image: require('@/assets/product/product_01.png'),
  },
  content: 'Yeni MacBook Pro M3 ile çalışma deneyimim. Performans ve pil ömrü gerçekten etkileyici!',
  images: [
    require('@/assets/product/product_01.png'),
  ],
  stats: {
    likes: 32,
    comments: 12,
    shares: 6,
    bookmarks: 15,
  },
  tag: 'MacBook Review',
  createdAt: '2024-01-13',
  isPromoted: true,
};

// Mock data for Etkinlikler tab
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Apple WWDC 2024',
    description: 'Apple Worldwide Developers Conference 2024. Yeni iOS, macOS ve diğer Apple teknolojileri hakkında bilgi alın.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'joined',
    image: require('@/assets/events/banner.png'),
  },
  {
    id: '2',
    title: 'Samsung Galaxy Unpacked',
    description: 'Samsung\'un yeni Galaxy serisi ürünlerini tanıttığı etkinlik. Yeni telefonlar ve aksesuarlar.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'join',
    image: require('@/assets/events/banner_02.png'),
  },
  {
    id: '3',
    title: 'Google I/O 2024',
    description: 'Google\'un yıllık geliştirici konferansı. Android, AI ve diğer Google servisleri hakkında güncellemeler.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'join',
    image: require('@/assets/events/banner.png'),
  },
  {
    id: '4',
    title: 'Microsoft Build 2024',
    description: 'Microsoft\'un geliştirici konferansı. Azure, Office 365 ve diğer Microsoft teknolojileri.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'join',
    image: require('@/assets/events/banner_02.png'),
  },
  {
    id: '5',
    title: 'Meta Connect 2024',
    description: 'Meta\'nın VR/AR teknolojileri ve metaverse gelişmeleri hakkında etkinlik.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'join',
    image: require('@/assets/events/banner.png'),
  },
  {
    id: '6',
    title: 'Tesla AI Day 2024',
    description: 'Tesla\'nın yapay zeka ve otonom sürüş teknolojileri hakkında etkinlik.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'join',
    image: require('@/assets/events/banner_02.png'),
  },
];

// Mock data for Event Detail Screen
export const mockEventDetail: EventDetail = {
  id: '1',
  title: 'Apple WWDC 2024',
  description: 'Apple Worldwide Developers Conference 2024. Yeni iOS, macOS ve diğer Apple teknolojileri hakkında bilgi alın.',
  fullDescription: 'Apple Worldwide Developers Conference 2024, Apple\'ın yıllık geliştirici konferansıdır. Bu etkinlikte iOS, macOS, watchOS, tvOS ve diğer Apple platformları için yeni özellikler, araçlar ve teknolojiler tanıtılır. Geliştiriciler için önemli güncellemeler ve yeni API\'ler hakkında bilgi alabilirsiniz.',
  dateRange: '08 May 2025 - 15 May 2025',
  status: 'joined',
  image: require('@/assets/events/banner.png'),
  statistics: {
    title: 'Statistic',
    percentage: 87,
    description: 'Complete of 1M+ User',
  },
  rewards: {
    title: 'Rewards',
    badgeName: 'Rozet Adı',
    badgeImage: require('@/assets/badges/rozet_01.png'),
  },
  requirements: [
    {
      id: '1',
      title: '150 Yorum Yap',
      progress: 150,
      total: 150,
      icon: 'message-circle',
    },
    {
      id: '2',
      title: '20 Deneyim Paylaş',
      progress: 20,
      total: 20,
      icon: 'share',
    },
    {
      id: '3',
      title: 'Şunu Yap',
      progress: 166,
      total: 296,
      icon: 'check-circle',
    },
    {
      id: '4',
      title: 'Bunu Yap',
      progress: 217,
      total: 296,
      icon: 'star',
    },
  ],
};

// Mock data for Brand Survey List Screen
export const mockBrandSurveys = [
  {
    id: '1',
    title: 'Apple Ürün Deneyimi Anketi',
    description: 'Apple ürünlerinin kullanım deneyimi hakkında kısa anket.',
    type: 'Anket Tipi',
    duration: '3min',
    points: 250,
    status: 'view_results' as const,
    progress: 100,
  },
  {
    id: '2',
    title: 'iPhone Kullanım Alışkanlıkları',
    description: 'iPhone kullanım alışkanlıklarınızı öğrenmek için anket.',
    type: 'Anket Tipi',
    duration: '3min',
    points: 250,
    status: 'view_results' as const,
    progress: 100,
  },
  {
    id: '3',
    title: 'MacBook Performans Değerlendirmesi',
    description: 'MacBook performansı hakkında görüşlerinizi paylaşın.',
    type: 'Anket Tipi',
    duration: '3min',
    points: 250,
    status: 'view_results' as const,
    progress: 100,
  },
  {
    id: '4',
    title: 'Apple Watch Kullanım Deneyimi',
    description: 'Apple Watch kullanım deneyiminizi değerlendirin.',
    type: 'Anket Tipi',
    duration: '3min',
    points: 250,
    status: 'view_results' as const,
    progress: 100,
  },
  {
    id: '5',
    title: 'iPad Pro Kreatif Kullanım',
    description: 'iPad Pro ile yaratıcı çalışmalarınız hakkında anket.',
    type: 'Anket Tipi',
    duration: '3min',
    points: 250,
    status: 'view_results' as const,
    progress: 100,
  },
];

// Mock data for Brand Events Screen (only completed events)
export const mockBrandEvents = [
  {
    id: '1',
    title: 'Apple WWDC 2024',
    description: 'Apple Worldwide Developers Conference 2024. Yeni iOS, macOS ve diğer Apple teknolojileri hakkında bilgi alın.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'completed' as const,
    image: require('@/assets/events/banner.png'),
  },
  {
    id: '2',
    title: 'Samsung Galaxy Unpacked',
    description: 'Samsung\'un yeni Galaxy serisi ürünlerini tanıttığı etkinlik. Yeni telefonlar ve aksesuarlar.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'completed' as const,
    image: require('@/assets/events/banner_02.png'),
  },
  {
    id: '3',
    title: 'Google I/O 2024',
    description: 'Google\'ın yıllık geliştirici konferansı. Yeni Android özellikleri ve Google servisleri.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'completed' as const,
    image: require('@/assets/events/banner.png'),
  },
  {
    id: '4',
    title: 'Microsoft Build 2024',
    description: 'Microsoft\'un geliştirici konferansı. Azure, Office 365 ve diğer Microsoft teknolojileri.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'completed' as const,
    image: require('@/assets/events/banner_02.png'),
  },
  {
    id: '5',
    title: 'Meta Connect 2024',
    description: 'Meta\'nın VR/AR teknolojileri konferansı. Oculus ve Metaverse gelişmeleri.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'completed' as const,
    image: require('@/assets/events/banner.png'),
  },
  {
    id: '6',
    title: 'Tesla AI Day 2024',
    description: 'Tesla\'nın yapay zeka ve otonom sürüş teknolojileri hakkında etkinlik.',
    dateRange: '08 May 2025 - 15 May 2025',
    status: 'completed' as const,
    image: require('@/assets/events/banner_02.png'),
  },
];
