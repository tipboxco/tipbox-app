import { BenchmarkPost } from './types';

export const mock_benchmark_posts: BenchmarkPost[] = [
    {
        id: '1',
        user: {
            id: '1',
            name: 'Michael Clark',
            title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
            avatar: require('@/assets/avatar/default-useravatar.png'),
        },
        products: [
            {
                id: '1',
                name: 'PHILIPS AZUR',
                subName: 'DST8050/20 Steam Iron',
                image: require('@/assets/product/Cat.png'),
                isOwned: true,
                choice: true,
            },
            {
                id: '2',
                name: 'PHILIPS AZUR',
                subName: 'DST8050/20 Steam Iron',
                image: require('@/assets/product/Cat.png'),
                isOwned: false,
                choice: false,
            },
        ],
        content: 'Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills a...Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and brilliantly for kitchen and bathroom floors, picking up spills r kitchen and bathro...',
        stats: {
            likes: 324,
            comments: 56,
            shares: 23,
            bookmarks: 89,
        },
        createdAt: '2024-03-17T10:30:00Z',
    },
    {
        id: '2',
        user: {
            id: '2',
            name: 'Sarah Johnson',
            title: 'Professional Photographer - Tech Reviewer',
            avatar: require('@/assets/avatar/default-useravatar.png'),
        },
        products: [
            {
                id: '1',
                name: 'PHILIPS AZUR',
                subName: 'DST8050/20 Steam Iron',
                image: require('@/assets/product/Cat.png'),
                isOwned: true,
                choice: true,
            },
            {
                id: '2',
                name: 'PHILIPS AZUR',
                subName: 'DST8050/20 Steam Iron',
                image: require('@/assets/product/Cat.png'),
                isOwned: false,
                choice: false,
            },
        ],
        content: 'Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills a...Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and brilliantly for kitchen and bathroom floors, picking up spills r kitchen and bathro...',
        stats: {
            likes: 456,
            comments: 78,
            shares: 45,
            bookmarks: 112,
        },
        createdAt: '2024-03-17T09:15:00Z',
    },
];
