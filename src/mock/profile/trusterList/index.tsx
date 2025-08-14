import { TrustUser } from '@/src/features/profile/types';

export const mockTrusterList: TrustUser[] = [
    {
        id: '1',
        username: 'Deniz Yılmaz',
        handle: '@denizyilmaz',
        avatar: 'https://i.pravatar.cc/150?img=11',
        trustDate: new Date().toISOString(),
        trustScore: 97,
        badge: {
            name: 'Technology Expert',
            color: '#FFD700'
        },
        mutualFriendsText: 'Ahmet ve 3 kişi ile ortak arkadaşsınız',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        username: 'Merve Demir',
        handle: '@mervedemir',
        avatar: 'https://i.pravatar.cc/150?img=12',
        trustDate: new Date().toISOString(),
        trustScore: 94,
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
        username: 'Emre Kaya',
        handle: '@emrekaya',
        avatar: 'https://i.pravatar.cc/150?img=13',
        trustDate: new Date().toISOString(),
        trustScore: 93,
        badge: {
            name: 'Home Wizard',
            color: '#98FB98'
        },
        mutualFriendsText: 'Burak ve 2 kişi ile ortak arkadaşsınız',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '4',
        username: 'İrem Şahin',
        handle: '@iremsahin',
        avatar: 'https://i.pravatar.cc/150?img=14',
        trustDate: new Date().toISOString(),
        trustScore: 91,
        badge: {
            name: 'Smart Home Expert',
            color: '#87CEEB'
        },
        mutualFriendsText: 'Selin ile ortak arkadaşsınız',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];
