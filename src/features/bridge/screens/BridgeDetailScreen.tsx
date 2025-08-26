import React from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Pressable,
  Image,
} from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/src/store/themeStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BridgeStackParamList } from '../types';
import { Feather } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<BridgeStackParamList>;

export const BridgeDetailScreen = () => {
  const { colorMode } = useThemeStore();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const { brandName, brandDescription, followers, logo, banner } = route.params;

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
    >
      {/* Header Image Section */}
      <Box h={251} w="100%" position="relative">
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)'}
        />
        <Image
          source={banner}
          alt={brandName}
          position="absolute"
          w="100%"
          h="100%"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />
        
        {/* Back Button */}
        <Pressable
          position="absolute"
          top={20}
          left={16}
          onPress={handleBackPress}
          bg="rgba(255,255,255,0.6)"
          p="$2"
          borderRadius={25}
        >
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>
      </Box>

      {/* Content Section with Rounded Top Corners */}
      <Box
        position="absolute"
        top={220}
        left={0}
        right={0}
        bottom={0}
        bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
        borderTopLeftRadius={30}
        borderTopRightRadius={30}
        overflow="hidden"
      >
        <ScrollView>
          <VStack space="lg" p="$4" pt="$8">
            {/* Brand Info */}
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack space="sm" flex={1}>
                <HStack alignItems="center" space="sm">
                  <Text
                    fontSize={18}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {brandName}
                  </Text>
                  <Box
                    bg="rgba(144,8,255,0.8)"
                    borderWidth={1}
                    borderColor="#CA88FF"
                    borderRadius={10}
                    px="$2"
                    py="$1"
                  >
                    <Text fontSize={8} color="$white">Premium</Text>
                  </Box>
                </HStack>
                <Text
                  fontSize={9}
                  color={isDark ? '$textDark400' : '$textLight500'}
                >
                  {brandDescription}
                </Text>
                <HStack alignItems="center" space="sm">
                  <Feather name="users" size={12} color={isDark ? '#666' : '#999'} />
                  <Text
                    fontSize={9}
                    color={isDark ? '$textDark300' : '$textLight400'}
                  >
                    {(followers / 1000).toFixed(0)}K Followers
                  </Text>
                </HStack>
              </VStack>

              {/* Join Button */}
              <Pressable
                bg="rgba(215,215,215,0.8)"
                borderWidth={1}
                borderColor="#ADADAD"
                borderRadius={10}
                py="$1"
                px="$4"
              >
                <Text
                  fontSize={9}
                  fontWeight="$semibold"
                  color={isDark ? '$textDark50' : '$textLight900'}
                >
                  Join
                </Text>
              </Pressable>
            </HStack>

            {/* Browse Section */}
            <VStack space="md" mt="$4">
              <Text
                fontSize={14}
                fontWeight="$bold"
                color={isDark ? '$textDark50' : '$textLight900'}
              >
                Browse
              </Text>

              {/* Browse Cards */}
              <HStack space="md">
                {/* Surveys Card */}
                <Box
                  bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                  borderRadius={10}
                  p="$4"
                  flex={1}
                >
                  <Text
                    fontSize={12}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    Anketler & {'\n'}Oyunlaştırmalar
                  </Text>
                  <Box
                    h={1}
                    bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                    my="$2"
                  />
                  <Text
                    fontSize={9}
                    color={isDark ? '$textDark400' : '$textLight500'}
                  >
                    Anketler ve Oyunlaştırmalar{'\n'}hakkında küçük bir yazı
                  </Text>
                  <Pressable
                    bg="rgba(215,215,215,0.8)"
                    borderWidth={1}
                    borderColor="#ADADAD"
                    borderRadius={10}
                    py="$1"
                    px="$4"
                    alignSelf="flex-start"
                    mt="$2"
                  >
                    <Text
                      fontSize={9}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '$textLight900'}
                    >
                      Explore
                    </Text>
                  </Pressable>
                </Box>

                {/* Brand Products Card */}
                <Box
                  bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                  borderRadius={10}
                  p="$4"
                  flex={1}
                >
                  <Text
                    fontSize={12}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    Marka Ürünleri{'\n'}Defteri
                  </Text>
                  <Box
                    h={1}
                    bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                    my="$2"
                  />
                  <Text
                    fontSize={9}
                    color={isDark ? '$textDark400' : '$textLight500'}
                  >
                    Marka Ürünleri Defteri{'\n'}hakkında küçük bir yazı
                  </Text>
                  <Pressable
                    bg="rgba(215,215,215,0.8)"
                    borderWidth={1}
                    borderColor="#ADADAD"
                    borderRadius={10}
                    py="$1"
                    px="$4"
                    alignSelf="flex-start"
                    mt="$2"
                  >
                    <Text
                      fontSize={9}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '$textLight900'}
                    >
                      View
                    </Text>
                  </Pressable>
                </Box>
              </HStack>
            </VStack>

            {/* All Posts Section */}
            <VStack space="md" mt="$4">
              <Text
                fontSize={14}
                fontWeight="$bold"
                color={isDark ? '$textDark50' : '$textLight900'}
              >
                All Posts
              </Text>

              {/* Post Card */}
              <Box
                bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                borderRadius={10}
                p="$4"
              >
                {/* User Info */}
                <HStack space="sm" alignItems="center">
                  <Image
                    source={require('@/assets/avatar/ozan.png')}
                    alt="User Avatar"
                    width={44}
                    height={44}
                    borderRadius={22}
                  />
                  <VStack>
                    <Text
                      fontSize={12}
                      fontWeight="$bold"
                      color={isDark ? '$textDark50' : '$textLight900'}
                    >
                      Mehmet Koç
                    </Text>
                    <Box
                      bg="rgba(255,164,8,0.4)"
                      borderWidth={1}
                      borderColor="#FFCE08"
                      borderRadius={10}
                      px="$2"
                      py="$1"
                      mt="$1"
                    >
                      <Text fontSize={8} color={isDark ? '$textDark50' : '$textLight900'}>
                        Premium
                      </Text>
                    </Box>
                    <HStack alignItems="center" space="sm" mt="$1">
                      <Feather name="box" size={10} color={isDark ? '#666' : '#999'} />
                      <Text
                        fontSize={8}
                        color={isDark ? '$textDark300' : '$textLight400'}
                      >
                        Envanterine yeni bir ürün ve deneyimlerini ekledi!
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>

                {/* Post Content */}
                <VStack space="md" mt="$4">
                  <Text
                    fontSize={12}
                    fontWeight="$semibold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    Lorem ipsum Başlık
                  </Text>
                  <Text
                    fontSize={11}
                    color={isDark ? '$textDark400' : '$textLight500'}
                  >
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud...
                  </Text>
                </VStack>

                {/* Post Actions */}
                <HStack justifyContent="space-between" mt="$4">
                  <HStack space="lg">
                    <HStack space="sm" alignItems="center">
                      <Feather name="heart" size={16} color={isDark ? '#666' : '#999'} />
                      <Text fontSize={12} color={isDark ? '$textDark300' : '$textLight400'}>110</Text>
                    </HStack>
                    <HStack space="sm" alignItems="center">
                      <Feather name="message-circle" size={16} color={isDark ? '#666' : '#999'} />
                      <Text fontSize={12} color={isDark ? '$textDark300' : '$textLight400'}>32</Text>
                    </HStack>
                    <HStack space="sm" alignItems="center">
                      <Feather name="send" size={16} color={isDark ? '#666' : '#999'} />
                      <Text fontSize={12} color={isDark ? '$textDark300' : '$textLight400'}>11</Text>
                    </HStack>
                  </HStack>
                  <HStack space="sm" alignItems="center">
                    <Feather name="bookmark" size={16} color={isDark ? '#666' : '#999'} />
                    <Text fontSize={12} color={isDark ? '$textDark300' : '$textLight400'}>32</Text>
                  </HStack>
                </HStack>
              </Box>
            </VStack>
          </VStack>
        </ScrollView>
      </Box>
    </Box>
  );
};