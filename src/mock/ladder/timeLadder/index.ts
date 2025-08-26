import { LadderItem } from '@/src/features/ladder/types';

export const timeLadderData = {
  item: {
    id: 'time-1',
    title: 'Zamana Bağlı Görev Adı',
    description: 'Başarım Merdiveni Açıklamasının bir kısmı burada yazacak. Ne kadar göstereceğimizi sınırlayabiliriz. Bu görev için biraz daha uzun bir açıklama iyi olur...',
    image: 'https://picsum.photos/60',
    startDate: '2025-05-08',
    endDate: '2025-05-15',
    progress: 30,
    rank: [
      { position: 1, color: '#D3BE00' },
      { position: 2, color: '#BEBEBE' },
      { position: 3, color: '#AB7A49' },
    ],
    userProgress: {
      completedTasks: 4,
      totalTasks: 10,
      avatar: 'https://i.pravatar.cc/100?img=4',
    },
  },
  remainingTime: '11:42:03',
  userScore: 34599,
  rank: 12,
  topUsers: [
    {
      id: '1',
      avatar: 'https://i.pravatar.cc/100?img=1',
      rank: 1,
    },
    {
      id: '2',
      avatar: 'https://i.pravatar.cc/100?img=2',
      rank: 2,
    },
    {
      id: '3',
      avatar: 'https://i.pravatar.cc/100?img=3',
      rank: 3,
    },
  ],
};
