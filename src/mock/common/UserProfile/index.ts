import { UserProfile } from './types';

export const mock_user_profile: UserProfile = {
  name: 'Ozan Mutluoğlu',
  avatar: require('@/assets/avatar/default-useravatar.png'),
  trust: 776,
  truster: 556,
  posts: 556,
  badge: {
    text: 'Kitchen Specialist',
    color: '#FF0842',
    borderColor: '#FF0842',
  },
};
