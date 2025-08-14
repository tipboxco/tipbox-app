import { UserData } from '@/src/features/profile/types';

export const mock_user_card: UserData = {
    id: "1",
    username: "Ozan Mutluoğlu",
    handle: "@ozanmutluoglu",
    badge: {
        id: "kitchen-specialist",
        name: "Kitchen Specialist",
        icon: "kitchen-icon",
        description: "Mutfak ekipmanları konusunda uzman"
    },
    stats: {
        trust: 776,
        truster: 556,
        supporter: 556
    }
}