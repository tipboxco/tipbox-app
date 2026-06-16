import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categoryPostSchema, CategoryPostFormData } from '../schemas/categoryPostSchema';

export const useCategoryPostForm = (initialValues?: Partial<CategoryPostFormData>) => {
  return useForm<CategoryPostFormData>({
    resolver: zodResolver(categoryPostSchema),
    defaultValues: {
      postType: 'general',
      text: '',
      boostEnabled: false,
      selectedCategory: '',
      selectedImages: [],
      ...initialValues,
    },
    mode: 'onChange',
  });
};
