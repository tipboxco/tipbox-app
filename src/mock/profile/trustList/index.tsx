import { TrustUser } from '@/src/features/profile/types';

export const mockTrustList: TrustUser[] = [
  {
    id: '1',
    username: 'Ahmet Yılmaz',
    handle: '@ahmetyilmaz',
    avatar: 'https://i.pravatar.cc/150?img=1',
    trustDate: new Date().toISOString(),
    trustScore: 98,
    badge: {
      name: 'Technology Expert',
      color: '#FFD700'
    },
    mutualFriendsText: 'Mehmet ve 2 kişi ile ortak arkadaşsınız',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'Ayşe Demir',
    handle: '@aysedemir',
    avatar: 'https://i.pravatar.cc/150?img=2',
    trustDate: new Date().toISOString(),
    trustScore: 95,
    badge: {
      name: 'Cosmetic Expert',
      color: '#FFA500'
    },
    mutualFriendsText: 'Zeynep ile ortak arkadaşsınız',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    username: 'Mehmet Kaya',
    handle: '@mehmetkaya',
    avatar: 'https://i.pravatar.cc/150?img=3',
    trustDate: new Date().toISOString(),
    trustScore: 92,
    badge: {
      name: 'Home Wizard',
      color: '#98FB98'
    },
    mutualFriendsText: 'Burak ve 3 kişi ile ortak arkadaşsınız',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    username: 'Zeynep Şahin',
    handle: '@zeynepsahin',
    avatar: 'https://i.pravatar.cc/150?img=4',
    trustDate: new Date().toISOString(),
    trustScore: 90,
    badge: {
      name: 'Smart Home Expert',
      color: '#87CEEB'
    },
    mutualFriendsText: 'Ahmet ile ortak arkadaşsınız',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    username: 'Can Özkan',
    handle: '@canozkan',
    avatar: 'https://i.pravatar.cc/150?img=5',
    trustDate: new Date().toISOString(),
    trustScore: 88,
    badge: {
      name: 'Technology Expert',
      color: '#FFD700'
    },
    mutualFriendsText: 'Mehmet ve 4 kişi ile ortak arkadaşsınız',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    username: 'Elif Yıldız',
    handle: '@elifyildiz',
    avatar: 'https://i.pravatar.cc/150?img=6',
    trustDate: new Date().toISOString(),
    trustScore: 94,
    badge: {
      name: 'Cosmetic Expert',
      color: '#FFA500'
    },
    mutualFriendsText: 'Ayşe ve 2 kişi ile ortak arkadaşsınız',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    username: 'Burak Aydın',
    handle: '@burakaydin',
    avatar: 'https://i.pravatar.cc/150?img=7',
    trustDate: new Date().toISOString(),
    trustScore: 91,
    badge: {
      name: 'Home Wizard',
      color: '#98FB98'
    },
    mutualFriendsText: 'Can ile ortak arkadaşsınız',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    username: 'Selin Kara',
    handle: '@selinkara',
    avatar: 'https://i.pravatar.cc/150?img=8',
    trustDate: new Date().toISOString(),
    trustScore: 89,
    badge: {
      name: 'Smart Home Expert',
      color: '#87CEEB'
    },
    mutualFriendsText: 'Elif ve 2 kişi ile ortak arkadaşsınız',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];