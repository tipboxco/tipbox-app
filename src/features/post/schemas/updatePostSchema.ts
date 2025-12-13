import { z } from 'zod';

export const updatePostSchema = z.object({
  description: z.string().min(1, 'Açıklama zorunludur').max(500, 'Maksimum 500 karakter olabilir'),
  selectedImages: z.array(z.string()).optional(),
});

export type UpdatePostFormData = z.infer<typeof updatePostSchema>;


