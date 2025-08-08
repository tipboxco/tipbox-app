export interface UpdateInfo {
  version: string;
  buildNumber: number;
  changelog: string;
  size: number; // bytes
  isRequired: boolean;
  downloadUrl: string;
}

export interface OTAServiceState {
  isChecking: boolean;
  hasUpdate: boolean;
  updateInfo?: UpdateInfo;
  error?: string;
  downloadProgress: number;
  isInstalling: boolean;
}

export interface OTAService {
  checkForUpdate(): Promise<UpdateInfo | null>;
  downloadUpdate(onProgress: (progress: number) => void): Promise<void>;
  installUpdate(): Promise<void>;
}
