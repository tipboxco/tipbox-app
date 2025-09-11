import { LadderDetail } from './types';
import { Users, Trophy } from 'lucide-react-native';

export const mock_ladder_details: { [key: string]: LadderDetail } = {
  '1': {
    id: '1',
    title: 'Tech Explorer',
    description: 'Uygulama içerisinde aktif olarak diğer kullanıcılar ile etkileşime geç. Ödülleri kazanmak için görev listesindeki tüm görevleri tamamla!',
    image: require('@/assets/ladders/ladders_01.png'),
    statistics: [
      {
        title: 'Statistic',
        value: '%87',
        icon: Users,
        description: 'of 1M+ User'
      }
    ],
    rewards: [
      {
        title: 'Rozet Adı',
        icon: Trophy,
        image: require('@/assets/badges/badge_01.png')
      }
    ],
    tasks: [
      {
        id: '1',
        title: '150 Yorum Yap',
        progress: {
          current: 75,
          total: 150
        }
      },
      {
        id: '2',
        title: '20 Deneyim Paylaş',
        progress: {
          current: 15,
          total: 20
        }
      },
      {
        id: '3',
        title: 'Şunu Yap',
        progress: {
          current: 3,
          total: 5
        }
      },
      {
        id: '4',
        title: 'Bunu Yap',
        progress: {
          current: 8,
          total: 10
        }
      }
    ]
  },
  '2': {
    id: '2',
    title: 'Gadget Guru',
    description: 'Premium cihazlar hakkında detaylı incelemeler yaparak kullanıcılara yardımcı ol ve ödülleri topla!',
    image: require('@/assets/ladders/ladders_02.png'),
    statistics: [
      {
        title: 'Statistic',
        value: '%45',
        icon: Users,
        description: 'of 500K+ User'
      }
    ],
    rewards: [
      {
        title: 'Gadget Master',
        icon: Trophy,
        image: require('@/assets/badges/badge_02.png')
      }
    ],
    tasks: [
      {
        id: '1',
        title: '50 Premium Cihaz İncelemesi',
        progress: {
          current: 20,
          total: 50
        }
      },
      {
        id: '2',
        title: '100 Yorum',
        progress: {
          current: 45,
          total: 100
        }
      }
    ]
  },
  '3': {
    id: '3',
    title: 'Smart Home Master',
    description: 'Akıllı ev sistemleri hakkında deneyimlerini paylaş ve uzman rozeti kazan!',
    image: require('@/assets/ladders/ladders_03.png'),
    statistics: [
      {
        title: 'Statistic',
        value: '%100',
        icon: Users,
        description: 'of 250K+ User'
      }
    ],
    rewards: [
      {
        title: 'Smart Home Expert',
        icon: Trophy,
        image: require('@/assets/badges/badge_03.png')
      }
    ],
    tasks: [
      {
        id: '1',
        title: '30 Akıllı Ev Cihazı İncelemesi',
        progress: {
          current: 30,
          total: 30
        },
        isCompleted: true
      }
    ]
  },
  '4': {
    id: '4',
    title: 'Audio Enthusiast',
    description: 'Ses sistemleri ve kulaklıklar hakkında detaylı incelemeler yap ve ödülleri topla!',
    image: require('@/assets/ladders/ladders_04.png'),
    statistics: [
      {
        title: 'Statistic',
        value: '%33',
        icon: Users,
        description: 'of 100K+ User'
      }
    ],
    rewards: [
      {
        title: 'Audio Master',
        icon: Trophy,
        image: require('@/assets/badges/badge_04.png')
      }
    ],
    tasks: [
      {
        id: '1',
        title: '20 Ses Sistemi İncelemesi',
        progress: {
          current: 5,
          total: 20
        }
      },
      {
        id: '2',
        title: '30 Kulaklık İncelemesi',
        progress: {
          current: 10,
          total: 30
        }
      }
    ]
  }
};