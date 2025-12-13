import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionPostSchema, QuestionPostFormData } from '../schemas/questionPostSchema';

export const useQuestionPostForm = (initialValues?: Partial<QuestionPostFormData>) => {
  return useForm<QuestionPostFormData>({
    resolver: zodResolver(questionPostSchema),
    defaultValues: {
      questionText: '',
      selectedBoost: 'no-boost',
      selectedImages: [],
      ...initialValues,
    },
    mode: 'onChange',
  });
};


