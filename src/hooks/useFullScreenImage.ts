import { useState, useCallback } from 'react';

export const useFullScreenImage = () => {
  const [visible, setVisible] = useState(false);
  const [imageSource, setImageSource] = useState<any>(null);

  const openImage = useCallback((source: any) => {
    setImageSource(source);
    setVisible(true);
  }, []);

  const closeImage = useCallback(() => {
    setVisible(false);
    // Clear source after fade-out animation
    setTimeout(() => {
      setImageSource(null);
    }, 300);
  }, []);

  return { visible, imageSource, openImage, closeImage };
};
