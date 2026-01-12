import { SupportRequestData, SupportRequest, SupportRequestFilter } from './types';

export const supportRequestFilters: SupportRequestFilter[] = [
  { id: '1', name: 'Aktif Talepler', isActive: true },
  { id: '2', name: 'Sonuçlandırma Bekliyor', isActive: false },
  { id: '3', name: 'Sonuçlandırıldı', isActive: false },
];

export const mockSupportRequests: SupportRequest[] = [
  {
    id: '1',
    userName: 'Micheal Clark',
    userTitle: 'Technology Enthuistant - Hardware Ex...',
    userAvatar: require('@/assets/avatar/default-useravatar.png'),
    requestTitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco lab...',
    requestDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco lab...',
    status: 'active',
    statusText: 'Aktif Talep',
    statusColor: '#8FA515',
    buttonText: 'Sohbete Git',
  },
  {
    id: '2',
    userName: 'Micheal Clark',
    userTitle: 'Technology Enthuistant - Hardware Ex...',
    userAvatar: require('@/assets/avatar/default-useravatar.png'),
    requestTitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco lab...',
    requestDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco lab...',
    status: 'pending',
    statusText: 'Sonuçlandırma Bekliyor',
    statusColor: '#AC2424',
    buttonText: 'Sohbete Git',
  },
  {
    id: '3',
    userName: 'Micheal Clark',
    userTitle: 'Technology Enthuistant - Hardware Ex...',
    userAvatar: require('@/assets/avatar/default-useravatar.png'),
    requestTitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco lab...',
    requestDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco lab...',
    status: 'completed',
    statusText: 'Sonuçlandırıldı',
    statusColor: '#24AC2D',
    buttonText: 'Sohbete Git',
  },
];

export const supportRequestData: SupportRequestData = {
  filters: supportRequestFilters,
  requests: mockSupportRequests,
};
