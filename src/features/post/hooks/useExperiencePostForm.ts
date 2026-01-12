import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { experiencePostSchema, ExperiencePostFormData } from '../schemas/experiencePostSchema';

const getStepFields = (step: number): (keyof ExperiencePostFormData)[] => {
  switch (step) {
    case 0:
      return ['selectedProduct'];
    case 1:
      return ['step1Duration', 'selectedCondition', 'selectedFrequency'];
    case 2:
      return ['experienceText'];
    case 3:
      return ['priceRating', 'productRating'];
    default:
      return [];
  }
};

export const useExperiencePostForm = (initialValues?: Partial<ExperiencePostFormData>): UseFormReturn<ExperiencePostFormData> & { validateStep: (step: number) => Promise<boolean> } => {
  const form = useForm<ExperiencePostFormData>({
    resolver: zodResolver(experiencePostSchema),
    defaultValues: {
      selectedProduct: null,
      selectedDuration: '',
      selectedLocation: '',
      selectedPurpose: '',
      step1Duration: '',
      selectedCondition: '',
      selectedFrequency: '',
      experienceText: '',
      selectedImages: [],
      priceExperienceText: '',
      productExperienceText: '',
      priceRating: 0,
      productRating: 0,
      ...initialValues,
    },
    mode: 'onChange',
  });

  const { trigger } = form;

  const validateStep = async (step: number): Promise<boolean> => {
    const stepFields = getStepFields(step);
    return await trigger(stepFields);
  };

  return {
    ...form,
    validateStep,
  };
};

