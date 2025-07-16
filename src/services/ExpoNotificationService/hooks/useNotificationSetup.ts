import { useEffect, useState } from 'react';
import { NotificationServiceState } from '../types';
import { notificationService } from '../index';

export const useNotificationSetup = () => {
  const [state, setState] = useState<NotificationServiceState>({
    isInitialized: false,
    permissionStatus: 'undetermined',
  });

  useEffect(() => {
    const initialize = async () => {
      const status = await notificationService.initialize();
      setState(status);
    };

    initialize();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  return state;
};
