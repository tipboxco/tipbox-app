import React, { ReactNode } from 'react';

/**
 * ScrollProvider Component
 * 
 * Global scroll yönetimi için provider.
 * ScrollRegistry service'ini context olarak sağlar (opsiyonel).
 * 
 * Şu an için sadece bir wrapper component olarak kullanılıyor.
 * ScrollRegistry zaten global bir service olarak çalışıyor.
 * 
 * Future: ScrollRegistry'yi context olarak sağlayabiliriz
 * veya scroll event'lerini global olarak yönetebiliriz.
 */
export const ScrollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ScrollRegistry zaten global bir service, context'e gerek yok şimdilik
  // Future: Scroll event'leri veya state management eklenebilir
  return <>{children}</>;
};
