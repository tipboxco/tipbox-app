/**
 * Global API hook'u
 * 
 * NOT: Bu hook artık gerekli değil. 
 * JWT ve Refresh Token interceptor'ları ApiService constructor'ında otomatik olarak kuruluyor.
 * 
 * Spesifik API çağrıları için ilgili feature'ın api klasöründeki fonksiyonları kullanın.
 * 
 * @deprecated Interceptor'lar otomatik olarak kurulduğu için bu hook kullanılmıyor.
 */
export const useApi = () => {
  // Interceptor'lar ApiService constructor'ında otomatik olarak kuruluyor
  // Bu hook sadece geriye dönük uyumluluk için bırakıldı
}; 