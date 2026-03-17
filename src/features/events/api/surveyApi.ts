import { apiService } from '@/src/services/ApiService';
import type {
  SurveyQuestionsApiResponse,
  SurveySubmitRequest,
  SurveyCompleteApiResponse,
  SurveyCompleteErrorResponse,
} from '../types/survey.types';

/**
 * GET /brands/{brandId}/surveys/{surveyId}/questions
 * Anket sorularini getirir (Authorization: Bearer token)
 */
export const getSurveyQuestions = async (
  brandId: string,
  surveyId: string
): Promise<SurveyQuestionsApiResponse> => {
  const response = await apiService.getClient().get<SurveyQuestionsApiResponse>(
    `/brands/${brandId}/surveys/${surveyId}/questions`
  );
  return response.data;
};

/**
 * POST /brands/{brandId}/surveys/{surveyId}/submit
 * Tum cevaplari tek seferde gonderir.
 * Doner: pointsAwarded, totalSurveyPoints, badgesEarned[] (veya hata)
 */
export const submitSurveyAnswers = async (
  brandId: string,
  surveyId: string,
  answers: SurveySubmitRequest['answers']
): Promise<SurveyCompleteApiResponse> => {
  const response = await apiService.getClient().post<
    SurveyCompleteApiResponse | SurveyCompleteErrorResponse
  >(`/brands/${brandId}/surveys/${surveyId}/submit`, { answers });

  const data = response.data;
  if (!data.success) {
    const err = data as SurveyCompleteErrorResponse;
    const error = new Error(err.message) as Error & { response?: any };
    error.response = response;
    throw error;
  }
  return data as SurveyCompleteApiResponse;
};
