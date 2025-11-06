import { CollectionsData } from './types';

export const mockCollectionsData: CollectionsData = {
  all: [
    {
      id: '1',
      title: 'Vintage Watches',
      description: 'A curated collection of vintage timepieces',
      itemCount: 24,
      coverImage: require('@/assets/avatar/ozan.png'),
      isPrivate: false,
      createdAt: '2024-01-15',
      author: {
        name: 'John Doe',
        avatar: require('@/assets/avatar/ozan.png'),
      },
    },
    {
      id: '2',
      title: 'Rare Sneakers',
      description: 'Limited edition sneakers from around the world',
      itemCount: 18,
      coverImage: require('@/assets/avatar/ozan.png'),
      isPrivate: false,
      createdAt: '2024-02-20',
      author: {
        name: 'Jane Smith',
        avatar: require('@/assets/avatar/ozan.png'),
      },
    },
    {
      id: '3',
      title: 'Trading Cards',
      description: 'Pokemon and Yu-Gi-Oh collectibles',
      itemCount: 156,
      coverImage: require('@/assets/avatar/ozan.png'),
      isPrivate: true,
      createdAt: '2024-03-10',
      author: {
        name: 'Mike Johnson',
        avatar: require('@/assets/avatar/ozan.png'),
      },
    },
    {
      id: '4',
      title: 'Vintage Cameras',
      description: 'Classic film cameras and photography equipment',
      itemCount: 12,
      coverImage: require('@/assets/avatar/ozan.png'),
      isPrivate: false,
      createdAt: '2024-01-25',
      author: {
        name: 'Sarah Williams',
        avatar: require('@/assets/avatar/ozan.png'),
      },
    },
  ],
  created: [
    {
      id: '1',
      title: 'Vintage Watches',
      description: 'A curated collection of vintage timepieces',
      itemCount: 24,
      coverImage: require('@/assets/avatar/ozan.png'),
      isPrivate: false,
      createdAt: '2024-01-15',
      author: {
        name: 'John Doe',
        avatar: require('@/assets/avatar/ozan.png'),
      },
    },
    {
      id: '3',
      title: 'Trading Cards',
      description: 'Pokemon and Yu-Gi-Oh collectibles',
      itemCount: 156,
      coverImage: require('@/assets/avatar/ozan.png'),
      isPrivate: true,
      createdAt: '2024-03-10',
      author: {
        name: 'Mike Johnson',
        avatar: require('@/assets/avatar/ozan.png'),
      },
    },
  ],
  saved: [
    {
      id: '2',
      title: 'Rare Sneakers',
      description: 'Limited edition sneakers from around the world',
      itemCount: 18,
      coverImage: require('@/assets/avatar/ozan.png'),
      isPrivate: false,
      createdAt: '2024-02-20',
      author: {
        name: 'Jane Smith',
        avatar: require('@/assets/avatar/ozan.png'),
      },
    },
    {
      id: '4',
      title: 'Vintage Cameras',
      description: 'Classic film cameras and photography equipment',
      itemCount: 12,
      coverImage: require('@/assets/avatar/ozan.png'),
      isPrivate: false,
      createdAt: '2024-01-25',
      author: {
        name: 'Sarah Williams',
        avatar: require('@/assets/avatar/ozan.png'),
      },
    },
  ],
};
