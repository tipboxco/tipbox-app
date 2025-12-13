import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postSchema, PostFormData } from '../schemas/postSchema';

export const usePostForm = (initialValues?: Partial<PostFormData>) => {
  return useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      postText: '',
      selectedImages: [],
      ...initialValues,
    },
    mode: 'onChange',
  });
};


