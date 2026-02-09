import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionPostSchema, QuestionPostFormData } from '../schemas/questionPostSchema';

export const useQuestionPostForm = (initialValues?: Partial<QuestionPostFormData>): UseFormReturn<QuestionPostFormData> => {
  return useForm<QuestionPostFormData>({
    resolver: zodResolver(questionPostSchema),
    defaultValues: {
      questionText: '',
      selectedBoost: '', // No boost selected by default - user must choose
      selectedImages: [],
      ...initialValues,
    },
    mode: 'onChange',
  });
};


