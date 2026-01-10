import { UserCardData } from './types';

export const mock_user_card: UserCardData = {
  id: "1",
  name: "Georgia Green",
  avatar: require('@/assets/avatar/default-useravatar.png'),
  description: "Passionate about exploring the latest gadgets and digital lifestyles. Sharing honest reviews and real-life experiences with tech products.",
  titles: [
    "Everyday Consumer",
    "Home Appliance Enthusiast",
    "Product Reviewer"
  ],
  stats: {
    posts: 333,
    trust: 223,
    truster: 10000
  },
  badges: [
    {
      image: require('@/assets/badges/badge_01.png'),
      title: "Early Tech Adopter"
    },
    {
      image: require('@/assets/badges/badge_02.png'),
      title: "Wishmaker"
    },
    {
      image: require('@/assets/badges/badge_03.png'),
      title: "Premium Shopper"
    },
    {
      image: require('@/assets/badges/badge_04.png'),
      title: "Hardware Expert"
    }
  ],
  actions: {
    gift: true,
    headphone: true,
    chat: true,
    notification: true,
    trust: false
  }
};