import * as Updates from 'expo-updates';
import { OTAService, UpdateInfo } from './types';

class ExpoOTAService implements OTAService {
  async checkForUpdate(): Promise<UpdateInfo | null> {
    try {
      // Development modunda güncelleme kontrolünü simüle edelim
      if (__DEV__) {
        console.log('Development modunda OTA güncellemeleri devre dışıdır.');
        return null;
      }

      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        const manifest = update.manifest;
        return {
          version: manifest.version || '1.0.0',
          buildNumber: manifest.buildNumber || 1,
          changelog: manifest.extra?.changelog || '',
          size: manifest.extra?.size || 0,
          isRequired: manifest.extra?.isRequired || false,
          downloadUrl: manifest.extra?.downloadUrl || '',
        };
      }
      
      return null;
    } catch (error) {
      if (__DEV__) {
        console.log('Development modunda OTA güncellemeleri devre dışıdır.');
        return null;
      }
      console.error('Error checking for update:', error);
      throw error;
    }
  }

  async downloadUpdate(onProgress: (progress: number) => void): Promise<void> {
    try {
      if (__DEV__) {
        console.log('Development modunda OTA güncellemeleri devre dışıdır.');
        return;
      }

      const { isAvailable } = await Updates.checkForUpdateAsync();
      
      if (!isAvailable) {
        throw new Error('No update available');
      }

      await Updates.fetchUpdateAsync({
        onProgress: ({ totalBytes, downloadedBytes }) => {
          const progress = (downloadedBytes / totalBytes) * 100;
          onProgress(progress);
        },
      });
    } catch (error) {
      if (__DEV__) {
        console.log('Development modunda OTA güncellemeleri devre dışıdır.');
        return;
      }
      console.error('Error downloading update:', error);
      throw error;
    }
  }

  async installUpdate(): Promise<void> {
    try {
      if (__DEV__) {
        console.log('Development modunda OTA güncellemeleri devre dışıdır.');
        return;
      }

      await Updates.reloadAsync();
    } catch (error) {
      if (__DEV__) {
        console.log('Development modunda OTA güncellemeleri devre dışıdır.');
        return;
      }
      console.error('Error installing update:', error);
      throw error;
    }
  }
}

export const otaService = new ExpoOTAService();
