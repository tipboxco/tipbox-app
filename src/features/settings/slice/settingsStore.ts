import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { otaService } from '@/src/services/OTAService';
import { OTAServiceState, UpdateInfo } from '@/src/services/OTAService/types';

interface SettingsState extends OTAServiceState {
  checkForUpdate: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  resetUpdateState: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      // OTA State
      isChecking: false,
      hasUpdate: false,
      updateInfo: undefined,
      error: undefined,
      downloadProgress: 0,
      isInstalling: false,

      // Actions
      checkForUpdate: async () => {
        try {
          set({ isChecking: true, error: undefined });
          const updateInfo = await otaService.checkForUpdate();
          set({ 
            isChecking: false,
            hasUpdate: !!updateInfo,
            updateInfo: updateInfo || undefined,
          });
        } catch (error) {
          set({ 
            isChecking: false,
            error: error instanceof Error ? error.message : 'Güncelleme kontrolü başarısız oldu',
          });
        }
      },

      downloadUpdate: async () => {
        try {
          set({ downloadProgress: 0, error: undefined });
          await otaService.downloadUpdate((progress) => {
            set({ downloadProgress: progress });
          });
          set({ downloadProgress: 100 });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Güncelleme indirilemedi',
            downloadProgress: 0,
          });
        }
      },

      installUpdate: async () => {
        try {
          set({ isInstalling: true, error: undefined });
          await otaService.installUpdate();
          // Bu noktadan sonra uygulama yeniden başlatılacak
        } catch (error) {
          set({ 
            isInstalling: false,
            error: error instanceof Error ? error.message : 'Güncelleme yüklenemedi',
          });
        }
      },

      resetUpdateState: () => {
        set({
          isChecking: false,
          hasUpdate: false,
          updateInfo: undefined,
          error: undefined,
          downloadProgress: 0,
          isInstalling: false,
        });
      },
    }),
    { name: 'settings-store' }
  )
);
