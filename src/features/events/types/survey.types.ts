/**
 * Survey API Types - Backend Mobil Entegrasyon ile uyumlu
 *
 * Akis: Event Detail -> surveys[] -> GET /brands/{brandId}/surveys/{surveyId}/questions -> POST /brands/{brandId}/surveys/{surveyId}/submit
 */

/** Event detail icinde gelen survey ogesi (GET /events/{eventId}) */
export interface EventSurveyItem {
  id: string;
  brandId: string;
  title: string;
}

/** GET /brands/{brandId}/surveys/{surveyId}/questions - soru secenegi */
export interface SurveyQuestionOption {
  id: string;
  text: string;
}

/** GET /brands/{brandId}/surveys/{surveyId}/questions - tek soru */
export interface SurveyQuestionItem {
  id: string;
  text: string;
  type: string; // e.g. "SINGLE_CHOICE"
  options: SurveyQuestionOption[];
  order: number;
  isAnswered: boolean;
}

/** GET /brands/{brandId}/surveys/{surveyId}/questions response */
export interface SurveyQuestionsApiResponse {
  surveyId: string;
  totalQuestions: number;
  questions: SurveyQuestionItem[];
}

/** POST /brands/{brandId}/surveys/{surveyId}/submit request body */
export interface SurveySubmitRequest {
  answers: { questionId: string; optionId: string }[];
}

/** Completion sirasinda kazanilan badge */
export interface SurveyBadgeEarned {
  id: string;
  name: string;
  description: string;
  image: string; // URL
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

/** POST /brands/{brandId}/surveys/{surveyId}/submit - basarili response */
export interface SurveyCompleteApiResponse {
  success: true;
  message: string;
  pointsAwarded: number;
  totalSurveyPoints: number;
  badgesEarned: SurveyBadgeEarned[];
}

/** POST /brands/{brandId}/surveys/{surveyId}/submit - hata response */
export interface SurveyCompleteErrorResponse {
  success: false;
  message: string;
}

export type SurveyCompleteResponse = SurveyCompleteApiResponse | SurveyCompleteErrorResponse;
