import { z } from 'zod';

export const questionPostSchema = z.object({
  questionText: z.string().min(1, 'Soru metni zorunludur').max(500, 'Maksimum 500 karakter olabilir'),
  selectedBoost: z.string().min(1, 'Boost seçeneği zorunludur'), // Backend requires boost option
  selectedImages: z.array(z.string()).optional(),
});

export type QuestionPostFormData = z.infer<typeof questionPostSchema>;


