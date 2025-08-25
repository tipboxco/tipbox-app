import React from 'react';
import { ScrollView, Dimensions, Pressable } from 'react-native';
import { Box, Text, VStack, Center, Image } from '@gluestack-ui/themed';
import { Header } from '../../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const EMPTY_STATE_IMAGE_SIZE = SCREEN_WIDTH * 0.5;

export const InventoryScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Envanter"
        showBackButton={false}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Center flex={1} p="$4">
          <VStack space="lg" alignItems="center" width="100%">
            <Box
              bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
              borderRadius="$lg"
              p="$8"
              width={EMPTY_STATE_IMAGE_SIZE}
              height={EMPTY_STATE_IMAGE_SIZE}
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor={isDark ? '$backgroundDark100' : '$backgroundLight200'}
            >
              <Box
                width={EMPTY_STATE_IMAGE_SIZE * 0.6}
                height={EMPTY_STATE_IMAGE_SIZE * 0.6}
                alignItems="center"
                justifyContent="center"
              >
                <Feather
                  name="box"
                  size={EMPTY_STATE_IMAGE_SIZE * 0.4}
                  color={isDark ? '#666666' : '#999999'}
                />
              </Box>
            </Box>
            <VStack space="sm" alignItems="center">
              <Text
                size="lg"
                fontWeight="$bold"
                color={isDark ? '$textDark50' : '$textLight900'}
                textAlign="center"
              >
                Henüz ürün eklenmemiş
              </Text>
              <Text
                size="sm"
                color={isDark ? '$textDark400' : '$textLight500'}
                textAlign="center"
              >
                Ürün ekleyerek envanterinizi oluşturmaya başlayın
              </Text>
            </VStack>
            <Pressable onPress={() => navigation.navigate('AddProduct' as never)}>
              <Box
                bg="#E8FF6B"
                borderWidth={1}
                borderColor="#D8FF08"
                borderRadius="$xl"
                py="$2"
                px="$5"
                flexDirection="row"
                alignItems="center"
                mt="$4"
              >
                <Feather name="plus" size={14} color="#000000" />
                <Text
                  ml="$1"
                  color="#000000"
                  fontWeight="$bold"
                  size="sm"
                >
                  Ürün Ekle
                </Text>
              </Box>
            </Pressable>
          </VStack>
        </Center>
      </ScrollView>
    </Box>
  );
};