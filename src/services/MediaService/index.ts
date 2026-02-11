import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Image } from 'react-native';
import type { ImageSource, SaveImageResult } from './types';

/**
 * MediaService
 * 
 * Handles saving images to device gallery/photo library
 * Uses expo-media-library for Android/iOS
 */
class MediaService {
  private static instance: MediaService;

  private constructor() {}

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  /**
   * Request permissions to save to photo library
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[MediaService] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Resolve image source to URI
   * Handles both local require() sources and remote URLs
   */
  private resolveImageSource(source: ImageSource): string | null {
    if (typeof source === 'string') {
      return source;
    }

    // Handle require() sources
    if (typeof source === 'number') {
      const resolved = Image.resolveAssetSource(source);
      return resolved?.uri || null;
    }

    // Handle { uri: string } format
    if (source && typeof source === 'object' && 'uri' in source) {
      return (source as { uri: string }).uri;
    }

    return null;
  }

  /**
   * Save image to device gallery
   * @param source - Local file URI, remote URL, or require() source
   * @param filename - Optional custom filename
   */
  async saveImageToGallery(
    source: ImageSource,
    filename?: string
  ): Promise<SaveImageResult> {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Permission denied to access photo library',
        };
      }

      // Resolve the image source
      const uri = this.resolveImageSource(source);
      if (!uri) {
        return {
          success: false,
          error: 'Could not resolve image source',
        };
      }

      let localUri = uri;

      // If it's a remote URL, download it first
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const fileExtension = uri.split('.').pop()?.split('?')[0] || 'png';
        const fileName = filename || `badge_${Date.now()}.${fileExtension}`;
        const downloadPath = `${FileSystem.cacheDirectory}${fileName}`;

        console.log('[MediaService] Downloading image from:', uri);
        const downloadResult = await FileSystem.downloadAsync(uri, downloadPath);
        localUri = downloadResult.uri;
      }

      // Save to gallery
      console.log('[MediaService] Saving image to gallery:', localUri);
      const asset = await MediaLibrary.createAssetAsync(localUri);
      
      // Optional: Create album and add to it
      if (Platform.OS !== 'web') {
        try {
          const album = await MediaLibrary.getAlbumAsync('Tipbox Badges');
          if (album == null) {
            await MediaLibrary.createAlbumAsync('Tipbox Badges', asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
        } catch (albumError) {
          console.warn('[MediaService] Could not create/add to album:', albumError);
          // Continue anyway - the image is still saved to gallery
        }
      }

      console.log('[MediaService] Image saved successfully');
      return { success: true };
    } catch (error) {
      console.error('[MediaService] Failed to save image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if we have permission to access photo library
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[MediaService] Permission check failed:', error);
      return false;
    }
  }
}

export const mediaService = MediaService.getInstance();
