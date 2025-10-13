import { Survey, SurveyTab } from './types';

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
      avatar: require('@/assets/avatar/ozan.png'),
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
      avatar: require('@/assets/avatar/ozan.png'),
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
      avatar: require('@/assets/avatar/ozan.png'),
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
      avatar: require('@/assets/avatar/ozan.png'),
      title: 'Performance Tester',
    },
  },
];
