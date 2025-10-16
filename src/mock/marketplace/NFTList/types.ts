import { ImageSourcePropType } from 'react-native';

export interface UserNFT {
  id: string;
  title: string;
  username: string;
  image: ImageSourcePropType;
  isSelected?: boolean;
}
