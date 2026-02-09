import { z } from 'zod';

export const questionPostSchema = z.object({
  questionText: z.string().min(1, 'Soru metni zorunludur').max(500, 'Maksimum 500 karakter olabilir'),
  boostEnabled: z.boolean().default(false), // Boost ON/OFF switch
  selectedImages: z.array(z.string()).optional(),
});

export type QuestionPostFormData = z.infer<typeof questionPostSchema>;

