import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePostSchema, UpdatePostFormData } from '../schemas/updatePostSchema';

export const useUpdatePostForm = (initialValues?: Partial<UpdatePostFormData>) => {
  return useForm<UpdatePostFormData>({
    resolver: zodResolver(updatePostSchema),
    defaultValues: {
      description: '',
      selectedImages: [],
      ...initialValues,
    },
    mode: 'onChange',
  });
};


