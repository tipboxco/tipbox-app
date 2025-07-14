import React from 'react';
import { Text, Container, Center } from '@/src/components/ui';

export const HomeScreen: React.FC = () => {
  return (
    <Container bg='#f5f5f5' p={4}>
      <Center p={8}>
        <Text variant='heading' size='3xl' weight='bold' color='#333'>
          Tipbox App'e Hoşgeldin
        </Text>
        <Text variant='body' size='lg' color='#666'>
          Basit ve temiz bir başlangıç
        </Text>
      </Center>
    </Container>
  );
};
