export interface SupportRequest {
  id: string;
  userName: string;
  userTitle: string;
  userAvatar: any;
  requestTitle: string;
  requestDescription: string;
  status: 'active' | 'pending' | 'completed';
  statusText: string;
  statusColor: string;
  buttonText: string;
  onButtonPress?: () => void;
}

export interface SupportRequestFilter {
  id: string;
  name: string;
  isActive: boolean;
}

export interface SupportRequestData {
  filters: SupportRequestFilter[];
  requests: SupportRequest[];
}
