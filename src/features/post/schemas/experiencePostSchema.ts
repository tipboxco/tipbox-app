import { z } from 'zod';

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  description: z.string().optional(),
  image: z.any(),
});

export const experiencePostSchema = z.object({
  // Step 0: SelectProduct
  selectedProduct: productSchema.nullable().refine((val) => val !== null, {
    message: 'Ürün seçimi zorunludur',
  }),
  selectedDuration: z.string().optional(), // Step 0 için (inventory usage)
  selectedLocation: z.string().optional(), // Step 0 için (inventory usage)
  selectedPurpose: z.string().optional(), // Step 0 için (inventory usage)
  
  // Step 1: StepOneScreen
  step1Duration: z.string().min(1, 'Deneyim süresi zorunludur'), // Step 1 için ayrı duration
  selectedCondition: z.string().min(1, 'Ürün durumu zorunludur'),
  selectedFrequency: z.string().min(1, 'Kullanım sıklığı zorunludur'),
  
  // Step 2: StepTwoScreen
  experienceText: z.string().min(1, 'Deneyim metni zorunludur').max(500, 'Maksimum 500 karakter olabilir'),
  selectedImages: z.array(z.string()).optional(),
  
  // Step 3: StepThreeScreen
  priceExperienceText: z.string().optional(),
  productExperienceText: z.string().optional(),
  priceRating: z.number().min(1, 'Fiyat puanı zorunludur').max(5, 'Puan 1-5 arası olmalıdır'),
  productRating: z.number().min(1, 'Ürün puanı zorunludur').max(5, 'Puan 1-5 arası olmalıdır'),
});

export type ExperiencePostFormData = z.infer<typeof experiencePostSchema>;

