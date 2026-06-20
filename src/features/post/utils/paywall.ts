/**
 * Paywall (yetersiz TIPS bakiyesi) hata yardımcıları.
 * Boost'lu gönderiler (ör. question boost) yeterli TIPS yoksa backend 400 + VALIDATION_ERROR
 * "Insufficient TIPS balance. Available: X TIPS, required: Y TIPS" döndürür.
 */

const extractMessage = (error: unknown): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error?.message ||
    e?.response?.data?.message ||
    e?.message ||
    ''
  );
};

/** Hata yetersiz TIPS bakiyesi (paywall) hatası mı? */
export const isInsufficientBalanceError = (error: unknown): boolean => {
  const msg = extractMessage(error);
  return /insufficient.*tips\s*balance|insufficient\s*balance|yetersiz.*tips/i.test(
    msg
  );
};

/** Hata mesajından mevcut/gerekli TIPS miktarlarını çıkarır (varsa). */
export const parseTipsBalance = (
  error: unknown
): { available?: number; required?: number } => {
  const msg = extractMessage(error);
  const availableMatch = msg.match(/available:\s*([\d.]+)/i);
  const requiredMatch = msg.match(/required:\s*([\d.]+)/i);
  return {
    available: availableMatch ? parseFloat(availableMatch[1]) : undefined,
    required: requiredMatch ? parseFloat(requiredMatch[1]) : undefined,
  };
};
