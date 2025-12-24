import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { benchmarkPostSchema, BenchmarkPostFormData } from '../schemas/benchmarkPostSchema';

export const useBenchmarkPostForm = (initialValues?: Partial<BenchmarkPostFormData>) => {
  return useForm<BenchmarkPostFormData>({
    resolver: zodResolver(benchmarkPostSchema),
    defaultValues: {
      postText: '',
      selectedProduct1: null,
      selectedProduct2: null,
      selectedChoice: undefined,
      selectedImages: [],
      ...initialValues,
    },
    mode: 'onChange',
  });
};


