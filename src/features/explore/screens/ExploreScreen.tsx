import React from 'react';
import { Text, Container, Center, VStack } from '@/src/components/ui';

export const ExploreScreen: React.FC = () => {
  return (
    <Container bg='#f8fafc' p={6}>
      <Center p={8}>
        <VStack spacing={4}>
          <Text variant='heading' size='3xl' weight='bold' color='#333'>
            Keşfet
          </Text>

          <Text variant='body' size='lg' color='#666'>
            Yeni içerikleri keşfedin
          </Text>

          <Text variant='caption' color='#94a3b8'>
            Bu sayfa henüz geliştirme aşamasında...
          </Text>
        </VStack>
      </Center>
    </Container>
  );
};
