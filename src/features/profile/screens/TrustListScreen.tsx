import React from 'react';
import { Box } from '@gluestack-ui/themed';
import { TrustList } from '../components/TrustList';
import { Header } from '../../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';

export const TrustListScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header 
        title="Trust List" 
        showBackButton 
        onMenuPress={() => navigation.goBack()}
      />
      <TrustList />
    </Box>
  );
};