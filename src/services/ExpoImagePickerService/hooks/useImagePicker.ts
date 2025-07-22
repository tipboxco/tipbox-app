import { useState } from 'react';
import { ImagePickerAsset } from 'expo-image-picker';
import { imagePickerService } from '..';
import type { ImagePickerResult } from '../types';

export const useImagePicker = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset | null>(null);

  const resetState = () => {
    setError(null);
    setSelectedImage(null);
  };

  const handlePickerResult = (result: ImagePickerResult) => {
    if (!result.success) {
      setError(result.error || 'Bilinmeyen bir hata oluştu');
      return false;
    }

    if (result.asset) {
      setSelectedImage(result.asset);
      return true;
    }

    return false;
  };

  const pickFromCamera = async () => {
    try {
      resetState();
      setIsLoading(true);
      const result = await imagePickerService.pickFromCamera();
      return handlePickerResult(result);
    } catch (err) {
      setError('Fotoğraf çekilirken bir hata oluştu');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      resetState();
      setIsLoading(true);
      const result = await imagePickerService.pickFromGallery();
      return handlePickerResult(result);
    } catch (err) {
      setError('Fotoğraf seçilirken bir hata oluştu');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    selectedImage,
    pickFromCamera,
    pickFromGallery,
    resetState,
  };
}; 