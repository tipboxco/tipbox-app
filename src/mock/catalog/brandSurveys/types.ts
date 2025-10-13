import { ImageSourcePropType } from 'react-native';

export interface SurveyUser {
  id: string;
  name: string;
  avatar: ImageSourcePropType;
  title: string;
}

export interface SurveyBrand {
  id: string;
  name: string;
  logo: ImageSourcePropType;
  category: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  type: string;
  duration: string;
  points: number;
  status: 'start' | 'continue' | 'view_results';
  brand: SurveyBrand;
  user: SurveyUser;
  progress?: number;
}

export interface SurveyTab {
  id: string;
  name: string;
  isActive: boolean;
}
