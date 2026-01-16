import { NotificationItem, NotificationFilter } from './types';

export const notification_filters: NotificationFilter[] = [
  { id: 'all', label: 'All', isActive: true },
  { id: 'tips', label: 'Tips', isActive: false },
  { id: 'truster', label: 'Truster', isActive: false }, // CRITICAL FIX: trust → truster (backend API formatı)
  { id: 'replies', label: 'Replies', isActive: false },
];

export const notification_mock: NotificationItem[] = [
  {
    id: '1',
    type: 'like',
    user: {
      name: 'Mehmet Koç',
      avatar: require('@/assets/avatar/default-useravatar.png'),
    },
    message: 'Mehmet Koç, bir gönderini beğendi!',
    timeAgo: '22d',
    content: {
      title: 'Lorem ipsum Başlık',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud...',
      category: 'Kalıcılık / Dayanıklılık',
    },
  },
  {
    id: '2',
    type: 'tip',
    user: {
      name: 'Mehmet Koç',
      avatar: require('@/assets/avatar/default-useravatar.png'),
    },
    message: 'Mehmet Koç, bahşiş gönderdi!',
    timeAgo: '22d',
    action: {
      text: '+50 TIPS',
      onPress: () => console.log('TIPS claimed'),
    },
  },
  {
    id: '3',
    type: 'comment',
    user: {
      name: 'Mehmet Koç',
      avatar: require('@/assets/avatar/default-useravatar.png'),
    },
    message: 'Mehmet Koç, bir gönderine yorum yapıt!',
    timeAgo: '22d',
    content: {
      title: 'Lorem ipsum Başlık',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud...',
      category: 'Kalıcılık / Dayanıklılık',
    },
  },
  {
    id: '4',
    type: 'trust',
    user: {
      name: 'Mehmet Koç',
      avatar: require('@/assets/avatar/default-useravatar.png'),
    },
    message: 'Mehmet Koç, seni trust listesine ekledi!',
    timeAgo: '22d',
    action: {
      text: 'Profili Görüntüle',
      onPress: () => console.log('View profile'),
    },
  },
];
