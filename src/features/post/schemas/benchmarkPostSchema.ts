import { z } from 'zod';

const selectedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  subName: z.string().optional(),
  image: z.any(),
  isOwned: z.boolean().optional(),
});

export const benchmarkPostSchema = z.object({
  postText: z.string().min(1, 'Açıklama zorunludur').max(500, 'Maksimum 500 karakter olabilir'),
  selectedProduct1: selectedProductSchema.nullable().refine((val) => val !== null, {
    message: 'İlk ürün seçimi zorunludur',
  }),
  selectedProduct2: selectedProductSchema.nullable().refine((val) => val !== null, {
    message: 'İkinci ürün seçimi zorunludur',
  }),
  selectedChoice: z.enum(['product1', 'product2'], {
    required_error: 'Ürün tercihi zorunludur',
  }),
  selectedImages: z.array(z.string()).optional(),
});

export type BenchmarkPostFormData = z.infer<typeof benchmarkPostSchema>;


