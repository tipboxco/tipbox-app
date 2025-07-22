import Auth0, { Credentials } from 'react-native-auth0';
import { auth0Config } from '@/src/config/auth0.config';
import { Auth0ServiceConfig, Auth0ServiceState, Auth0User, Auth0Credentials } from './types';

class Auth0Service {
  private auth0: Auth0;
  private config: Auth0ServiceConfig;
  private state: Auth0ServiceState = {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  };

  constructor(config: Auth0ServiceConfig = auth0Config) {
    this.config = config;
    this.auth0 = new Auth0({
      domain: this.config.domain,
      clientId: this.config.clientId,
    });
  }

  async login(): Promise<Auth0Credentials> {
    try {
      const credentials = await this.auth0.webAuth.authorize({
        scope: 'openid profile email offline_access',
        audience: this.config.audience,
      });

      this.state.isAuthenticated = true;
      await this.loadUserInfo(credentials.accessToken);

      return credentials as Auth0Credentials;
    } catch (error) {
      this.state.error = error as Error;
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.auth0.webAuth.clearSession();
      this.state = {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      };
    } catch (error) {
      this.state.error = error as Error;
      throw error;
    }
  }

  async loadUserInfo(accessToken: string): Promise<Auth0User> {
    try {
      const user = await this.auth0.auth.userInfo({ token: accessToken });
      this.state.user = user as Auth0User;
      return user as Auth0User;
    } catch (error) {
      this.state.error = error as Error;
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<Auth0Credentials> {
    try {
      const credentials = await this.auth0.auth.refreshToken({ refreshToken });
      return credentials as Auth0Credentials;
    } catch (error) {
      this.state.error = error as Error;
      throw error;
    }
  }

  getState(): Auth0ServiceState {
    return { ...this.state };
  }
}

export const auth0Service = new Auth0Service();
export * from './types'; 