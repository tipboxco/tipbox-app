import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;

interface Auth0Config {
  domain: string;
  clientId: string;
  audience?: string;
}

export const auth0Config: Auth0Config = {
  domain: extra?.auth0Domain || '',
  clientId: extra?.auth0ClientId || '',
  audience: extra?.auth0Audience,
}; 