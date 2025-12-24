import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tipsAndTrickPostSchema, TipsAndTrickPostFormData } from '../schemas/tipsAndTrickPostSchema';

export const useTipsAndTrickPostForm = (initialValues?: Partial<TipsAndTrickPostFormData>) => {
  return useForm<TipsAndTrickPostFormData>({
    resolver: zodResolver(tipsAndTrickPostSchema),
    defaultValues: {
      tipsText: '',
      selectedCategory: '',
      selectedImages: [],
      ...initialValues,
    },
    mode: 'onChange',
  });
};


