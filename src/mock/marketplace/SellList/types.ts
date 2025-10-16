import { ImageSourcePropType } from 'react-native';

export interface SellNFT {
  id: string;
  title: string;
  username: string;
  price: string;
  image: ImageSourcePropType;
  isSelected?: boolean;
}
