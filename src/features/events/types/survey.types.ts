/**
 * Survey API Types - Backend Mobil Entegrasyon ile uyumlu
 *
 * Akış: Event Detail → surveys[] → GET /surveys/:id/questions → POST answer per question → POST /surveys/:id/complete
 */

/** Event detail içinde gelen survey öğesi (GET /events/{eventId}) */
export interface EventSurveyItem {
  id: string;
  brandId: string;
  title: string;
}

/** GET /surveys/{surveyId}/questions - soru seçeneği */
export interface SurveyQuestionOption {
  id: string;
  text: string;
}

/** GET /surveys/{surveyId}/questions - tek soru */
export interface SurveyQuestionItem {
  id: string;
  text: string;
  options: SurveyQuestionOption[];
  order: number;
}

/** GET /surveys/{surveyId}/questions response */
export interface SurveyQuestionsApiResponse {
  surveyId: string;
  totalQuestions: number;
  questions: SurveyQuestionItem[];
}

/** POST /surveys/{surveyId}/questions/{questionId}/answer response */
export interface SurveyAnswerApiResponse {
  success: boolean;
  message: string;
  /** Tüm sorular cevaplandığında true; "Tamamla" butonu buna göre aktif edilir */
  isCompleted: boolean;
}

/** Completion sırasında kazanılan badge (POST /surveys/{surveyId}/complete) */
export interface SurveyBadgeEarned {
  id: string;
  name: string;
  description: string;
  image: string; // URL
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

/** POST /surveys/{surveyId}/complete - başarılı response */
export interface SurveyCompleteApiResponse {
  success: true;
  message: string;
  /** Bu anket tamamlandığında kazanılan puan */
  pointsAwarded: number;
  /** Toplam survey puanı (tüm tamamlanan anketlerden) */
  totalSurveyPoints: number;
  /** Bu completion'da unlock edilen badge'ler (10+, 25+, 50+ kuralına göre) */
  badgesEarned: SurveyBadgeEarned[];
}

/** POST /surveys/{surveyId}/complete - hata response (zaten tamamlanmış / eksik soru) */
export interface SurveyCompleteErrorResponse {
  success: false;
  message: string;
}

export type SurveyCompleteResponse = SurveyCompleteApiResponse | SurveyCompleteErrorResponse;
