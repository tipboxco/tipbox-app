import { Comment } from '@/src/components/CommentsBottomSheet/types';

export const mockComments: Comment[] = [
  {
    id: '1',
    user: {
      name: 'Ömer Faruk Demiral',
      avatar: require('@/assets/avatar/ozan.png'),
      badge: {
        text: 'Smart Home Expert',
        color: '#8BE735',
        borderColor: '#529A0E'
      }
    },
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
    timestamp: '54m',
    likes: 12,
    replies: [
      {
        id: '1-1',
        user: {
          name: 'Mehmet Koç',
          avatar: require('@/assets/avatar/ozan.png'),
          badge: {
            text: 'Tech Enthusiast',
            color: '#FFA408',
            borderColor: '#FFCE08'
          }
        },
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
        timestamp: '32m',
        likes: 5
      }
    ]
  },
  {
    id: '2',
    user: {
      name: 'Ayşe Yılmaz',
      avatar: require('@/assets/avatar/ozan.png'),
      badge: {
        text: 'Product Reviewer',
        color: '#FF6B6B',
        borderColor: '#E74C3C'
      }
    },
    content: 'Bu ürünü ben de kullanıyorum ve gerçekten çok memnunum. Özellikle otomatik şarj özelliği çok pratik.',
    timestamp: '1h',
    likes: 8
  },
  {
    id: '3',
    user: {
      name: 'Can Özkan',
      avatar: require('@/assets/avatar/ozan.png')
    },
    content: 'Fiyat/performans oranı nasıl? Ben de almayı düşünüyorum.',
    timestamp: '2h',
    likes: 3
  }
];
