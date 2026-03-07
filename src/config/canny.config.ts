/**
 * Canny Feedback/Feature Requests konfigürasyonu
 * .env üzerinden CANNY_REDIRECT_HOST, CANNY_COMPANY_ID, CANNY_REDIRECT_TARGET okunur
 */

let cannyRedirectHost = 'https://api-test.tipbox.co/api';
let cannyCompanyId = '695fcdc8fc0b828e91820b7c';
let cannyRedirectTarget = 'https://tipbox.canny.io/test-feedback';



try {
  const env = require('@env');
  if (env.CANNY_REDIRECT_HOST?.trim()) {
    cannyRedirectHost = env.CANNY_REDIRECT_HOST.trim().replace(/\/$/, '');
  }
  if (env.CANNY_COMPANY_ID?.trim()) {
    cannyCompanyId = env.CANNY_COMPANY_ID.trim();
  }
  if (env.CANNY_REDIRECT_TARGET?.trim()) {
    cannyRedirectTarget = env.CANNY_REDIRECT_TARGET.trim();
  }
} catch {
  // @env yoksa default değerler kullanılır
}

/** Feedback için Canny redirect endpoint URL'i (session ile SSO) */
export const CANNY_FEEDBACK_REDIRECT_URL = `${cannyRedirectHost}/canny/redirect?companyID=${encodeURIComponent(cannyCompanyId)}&redirect=${encodeURIComponent(cannyRedirectTarget)}`;

export const CANNY_CONFIG = {
  REDIRECT_HOST: cannyRedirectHost,
  /** Şirket ID */
  COMPANY_ID: cannyCompanyId,
  /** Hedef Canny sayfası (örn: https://xsyzsajkdaj.canny.io/feature-requests) */
  REDIRECT_TARGET: cannyRedirectTarget,
  /** Tam redirect URL */
  FEEDBACK_REDIRECT_URL: CANNY_FEEDBACK_REDIRECT_URL,
};
