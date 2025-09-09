export interface UserBadge {
  text: string;
  color: string;
  borderColor: string;
}

export interface UserProfile {
  name: string;
  avatar: any; // React Native require() tipini desteklemek için
  trust: number;
  truster: number;
  posts: number;
  badge: UserBadge;
}
