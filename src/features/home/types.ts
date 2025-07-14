// Home feature'a özel tipler

import type { BaseEntity } from '@/src/types';

// Home Screen Types
export interface DashboardStats {
  totalTips: number;
  totalUsers: number;
  dailyTips: number;
  weeklyTips: number;
}

// Widget Types
export interface Widget extends BaseEntity {
  title: string;
  type: 'chart' | 'counter' | 'list' | 'card';
  data: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isVisible: boolean;
}

// Recent Activity Types
export interface RecentActivity extends BaseEntity {
  type: 'tip_added' | 'tip_liked' | 'user_joined' | 'comment_added';
  title: string;
  description: string;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
}

// Quick Action Types
export type QuickActionType = 'add_tip' | 'search' | 'favorites' | 'settings';

export interface QuickAction {
  id: QuickActionType;
  title: string;
  icon: string;
  color: string;
  action: () => void;
}
