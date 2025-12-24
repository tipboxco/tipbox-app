import { z } from 'zod';

export const postSchema = z.object({
  postText: z.string().min(1, 'Gönderi metni zorunludur').max(500, 'Maksimum 500 karakter olabilir'),
  selectedImages: z.array(z.string()).optional(),
});

export type PostFormData = z.infer<typeof postSchema>;


