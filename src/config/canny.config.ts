/**
 * Canny Feedback/Feature Requests konfigürasyonu
 * .env üzerinden CANNY_REDIRECT_HOST, CANNY_COMPANY_ID, CANNY_REDIRECT_TARGET okunur
 */

let cannyRedirectHost = 'https://api-tipbox.exportergo.com';
let cannyCompanyId = '69737e15a53d7a0a4fe640a4';
let cannyRedirectTarget = 'https://xsyzsajkdaj.canny.io/feature-requests';

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
  /** API host (örn: https://api-tipbox.exportergo.com) */
  REDIRECT_HOST: cannyRedirectHost,
  /** Şirket ID */
  COMPANY_ID: cannyCompanyId,
  /** Hedef Canny sayfası (örn: https://xsyzsajkdaj.canny.io/feature-requests) */
  REDIRECT_TARGET: cannyRedirectTarget,
  /** Tam redirect URL */
  FEEDBACK_REDIRECT_URL: CANNY_FEEDBACK_REDIRECT_URL,
};
