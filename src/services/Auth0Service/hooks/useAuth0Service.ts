import { useState, useCallback } from 'react';
import { auth0Service } from '../index';
import { Auth0Credentials, Auth0ServiceState, Auth0User } from '../types';

export const useAuth0Service = () => {
  const [state, setState] = useState<Auth0ServiceState>(auth0Service.getState());

  const handleError = useCallback((error: Error) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const login = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const credentials = await auth0Service.login();
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        user: auth0Service.getState().user,
      }));
      return credentials;
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [handleError]);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await auth0Service.logout();
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [handleError]);

  const refreshToken = useCallback(async (refreshToken: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const credentials = await auth0Service.refreshToken(refreshToken);
      setState(prev => ({ ...prev, isLoading: false }));
      return credentials;
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [handleError]);

  return {
    ...state,
    login,
    logout,
    refreshToken,
  };
}; 