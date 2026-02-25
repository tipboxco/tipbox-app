import { apiService } from '@/src/services/ApiService';
import type {
  SurveyQuestionsApiResponse,
  SurveyAnswerApiResponse,
  SurveyCompleteApiResponse,
  SurveyCompleteErrorResponse,
} from '../types/survey.types';

/**
 * GET /surveys/{surveyId}/questions
 * Anket sorularını getirir (Authorization: Bearer token)
 */
export const getSurveyQuestions = async (
  surveyId: string
): Promise<SurveyQuestionsApiResponse> => {
  const response = await apiService.getClient().get<SurveyQuestionsApiResponse>(
    `/surveys/${surveyId}/questions`
  );
  return response.data;
};

/**
 * POST /surveys/{surveyId}/questions/{questionId}/answer
 * Tek bir soruya cevap gönderir. Her cevap otomatik kaydedilir.
 * isCompleted: true dönünce "Tamamla" butonu aktif edilir.
 */
export const submitSurveyQuestionAnswer = async (
  surveyId: string,
  questionId: string,
  answerId: string
): Promise<SurveyAnswerApiResponse> => {
  const response = await apiService.getClient().post<SurveyAnswerApiResponse>(
    `/surveys/${surveyId}/questions/${questionId}/answer`,
    { answerId }
  );
  return response.data;
};

/**
 * POST /surveys/{surveyId}/complete
 * Tüm sorular cevaplandıktan sonra anketi tamamlar.
 * Döner: pointsAwarded, totalSurveyPoints, badgesEarned[] (veya hata: zaten tamamlanmış / eksik soru)
 */
export const completeSurvey = async (
  surveyId: string
): Promise<SurveyCompleteApiResponse> => {
  const response = await apiService.getClient().post<
    SurveyCompleteApiResponse | SurveyCompleteErrorResponse
  >(`/surveys/${surveyId}/complete`, {});

  const data = response.data;
  if (!data.success) {
    const err = data as SurveyCompleteErrorResponse;
    const error = new Error(err.message) as Error & { response?: any };
    error.response = response;
    throw error;
  }
  return data as SurveyCompleteApiResponse;
};
