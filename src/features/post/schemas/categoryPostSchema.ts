import { z } from 'zod';

/** Kategori bazlı paylaşımda seçilebilen 3 tip */
export const CATEGORY_POST_TYPES = ['general', 'question', 'tips'] as const;
export type CategoryPostType = (typeof CATEGORY_POST_TYPES)[number];

/**
 * Tek ekranda General / Question / Tips & Tricks paylaşımını yönetmek için
 * birleşik form şeması. Alanlar tipe göre koşullu doğrulanır:
 * - text: her tip için zorunlu
 * - selectedCategory: yalnızca 'tips' için zorunlu (benefit category)
 * - boostEnabled: yalnızca 'question' için anlamlı (boost component)
 */
export const categoryPostSchema = z
  .object({
    postType: z.enum(CATEGORY_POST_TYPES),
    text: z.string().min(1, 'Gönderi metni zorunludur').max(500, 'Maksimum 500 karakter olabilir'),
    boostEnabled: z.boolean(),
    selectedCategory: z.string(),
    selectedImages: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.postType === 'tips' && (!data.selectedCategory || data.selectedCategory.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectedCategory'],
        message: 'Kategori seçimi zorunludur',
      });
    }
  });

export type CategoryPostFormData = z.infer<typeof categoryPostSchema>;
