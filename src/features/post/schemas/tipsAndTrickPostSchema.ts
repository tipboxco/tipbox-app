import { z } from 'zod';

export const tipsAndTrickPostSchema = z.object({
  tipsText: z.string().min(1, 'Tips & Tricks metni zorunludur').max(500, 'Maksimum 500 karakter olabilir'),
  selectedCategory: z.string().min(1, 'Kategori seçimi zorunludur'),
  selectedImages: z.array(z.string()).optional(),
});

export type TipsAndTrickPostFormData = z.infer<typeof tipsAndTrickPostSchema>;


