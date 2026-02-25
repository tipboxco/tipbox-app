import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionPostSchema, QuestionPostFormData } from '../schemas/questionPostSchema';

export const useQuestionPostForm = (initialValues?: Partial<QuestionPostFormData>): UseFormReturn<QuestionPostFormData> => {
  return useForm<QuestionPostFormData>({
    resolver: zodResolver(questionPostSchema),
    defaultValues: {
      questionText: '',
      boostEnabled: false, // Boost OFF by default
      selectedImages: [],
      ...initialValues,
    },
    mode: 'onChange',
  });
};

