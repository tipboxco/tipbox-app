import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService, notificationHandlers } from '../index';
import { NotificationServiceState } from '../types';

/**
 * useNotificationSetup
 * 
 * Notification service'i initialize eder ve lifecycle'ı yönetir
 * 
 * Features:
 * - Service initialization
 * - Token registration
 * - Permission handling
 * - App state tracking
 * - Token refresh
 * - Killed state notification handling
 */
export function useNotificationSetup(options?: {
  autoInitialize?: boolean;
  autoRegisterToken?: boolean;
  onInitialized?: (state: NotificationServiceState) => void;
  onError?: (error: Error) => void;
}) {
  const {
    autoInitialize = true,
    autoRegisterToken = true,
    onInitialized,
    onError,
  } = options || {};

  const [state, setState] = useState<NotificationServiceState>({
    isInitialized: false,
    permissionStatus: 'undetermined',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize notification service
   */
  const initialize = useCallback(async () => {
    if (state.isInitialized) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const serviceState = await notificationService.initialize();
      setState(serviceState);

      // Killed state notification'ı handle et
      await notificationHandlers.handleKilledStateNotification();

      onInitialized?.(serviceState);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [state.isInitialized, onInitialized, onError]);

  /**
   * Register push token to backend
   */
  const registerToken = useCallback(async () => {
    if (!state.isInitialized || state.permissionStatus !== 'granted') {
      return;
    }

    try {
      await notificationService.registerPushTokenToBackend();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    }
  }, [state.isInitialized, state.permissionStatus, onError]);

  /**
   * Request permission
   */
  const requestPermission = useCallback(async () => {
    try {
      const permissionStatus = await notificationService.requestPermission();
      const currentState = notificationService.getState();
      setState(currentState);

      // Permission granted ise token'ı kaydet
      if (permissionStatus === 'granted' && autoRegisterToken) {
        await registerToken();
      }

      return permissionStatus;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      return 'denied' as const;
    }
  }, [autoRegisterToken, registerToken, onError]);

  /**
   * Refresh token
   */
  const refreshToken = useCallback(async () => {
    try {
      const shouldRefresh = await notificationService.shouldRefreshToken();
      if (!shouldRefresh) {
        return;
      }

      const token = await notificationService.refreshPushToken();
      if (token && autoRegisterToken) {
        await notificationService.registerPushTokenToBackend();
      }

      const currentState = notificationService.getState();
      setState(currentState);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    }
  }, [autoRegisterToken, onError]);

  /**
   * Retry pending token
   */
  const retryPendingToken = useCallback(async () => {
    try {
      await notificationService.retryPendingPushToken();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    }
  }, [onError]);

  // Auto initialize on mount
  useEffect(() => {
    if (autoInitialize && !state.isInitialized) {
      initialize();
    }
  }, [autoInitialize, state.isInitialized, initialize]);

  // App state change listener - token refresh
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && state.isInitialized) {
        // App foreground'a geldiğinde token refresh kontrolü yap
        await refreshToken();
        // Pending token'ı retry et
        await retryPendingToken();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [state.isInitialized, refreshToken, retryPendingToken]);

  return {
    state,
    isLoading,
    error,
    initialize,
    registerToken,
    requestPermission,
    refreshToken,
    retryPendingToken,
  };
}
