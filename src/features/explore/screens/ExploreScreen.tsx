import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Input,
  InputField,
  Image
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SideMenu } from '@/src/components/SideMenu';
import { mock_user_profile } from '@/src/mock/common';
import { mock_post_cards } from '@/src/mock/profile/feed';
import { Feather } from '@expo/vector-icons';
import ExperiencePostCard from '@/src/components/ExperiencePostCard';



const ExploreScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'hottest' | 'news'>('hottest');

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Explore"
        onMenuPress={() => setIsMenuVisible(true)}
      />

      {/* Search Bar - Trust_TrusterListScreen style */}
      <VStack px="$4" py="$2">
        <HStack
          alignItems="center"
          bg={isDark ? '#1A1A1A' : '#FDFDFD'}
          borderWidth={1}
          borderColor="#E9E9E9"
          borderRadius={23}
          px={12}
          space="sm"
        >
          <Feather
            name="search"
            size={24}
            color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
          />
          <Input flex={1} borderWidth={0} bg="transparent">
            <InputField
              placeholder="Ürün Grubu seçin veya ürün adı arayın"
              placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
              color={isDark ? '#fff' : '#000'}
              fontSize={11}
            />
          </Input>
        </HStack>
      </VStack>

      <ScrollView>
        <VStack px="$4" py={'$2'} space="md">
          {/* Marketplace Card */}
          <Box
            bg="#CCCCCC"
            borderRadius={10}
            height={186}
            mb="$4"
            overflow="hidden"
          >
            {/* Top Section - Image Area */}
            <Box
              flex={1}
              bg="#CCCCCC"
              alignItems="center"
              justifyContent="center"
              minHeight={124}
            >
              {/* Placeholder for image - dashed border style */}
              <Box
                width={60}
                height={60}
                borderWidth={2}
                borderColor="#FFFFFF"
                borderStyle="dashed"
                borderRadius={8}
                alignItems="center"
                justifyContent="center"
              >
                <Feather name="image" size={24} color="#FFFFFF" />
              </Box>
            </Box>

            {/* Bottom Section - Text Area */}
            <Box
              bg="#727272"
              height={62}
              px="$6"
              py="$4"
              justifyContent="center"
            >
              <VStack space="xs">
                <Text
                  color="#FFFFFF"
                  fontSize={12}
                  fontWeight="$bold"
                >
                  Marketplace
                </Text>
                <Text
                  color="#FFFFFF"
                  fontSize={10}
                  fontWeight="$normal"
                  lineHeight={14}
                >
                  Lorem ipsum dolor sit amet, consectetur adipiscin
                </Text>
              </VStack>
            </Box>
          </Box>

          {/* Category Tabs - Trust_TrusterListScreen style */}
          <VStack px="$4" bg={isDark ? '#000' : '#FFF'}>
            <HStack space="lg">
              <Pressable
                onPress={() => setActiveCategory('hottest')}
                flex={1}
                alignItems="center"
                py="$2"
              >
                <Text
                  color={activeCategory === 'hottest' ? '#000' : '#8C8C8C'}
                  fontSize={12}
                  fontWeight="$bold"
                >
                  Hottest
                </Text>
                {activeCategory === 'hottest' && (
                  <Box
                    width={112}
                    height={2}
                    bg="#000"
                    mt="$1"
                    borderRadius={1}
                  />
                )}
              </Pressable>
              <Pressable
                onPress={() => setActiveCategory('news')}
                flex={1}
                alignItems="center"
                py="$2"
              >
                <Text
                  color={activeCategory === 'news' ? '#000' : '#8C8C8C'}
                  fontSize={12}
                  fontWeight="$bold"
                >
                  What's News
                </Text>
                {activeCategory === 'news' && (
                  <Box
                    width={112}
                    height={2}
                    bg="#000"
                    mt="$1"
                    borderRadius={1}
                  />
                )}
              </Pressable>
            </HStack>
          </VStack>

          {/* Content based on active tab */}
          {activeCategory === 'hottest' && (
            <VStack space="md" mb="$4">
              {mock_post_cards.map((post) => (
                <ExperiencePostCard
                  key={post.id}
                  data={post}
                />
              ))}
            </VStack>
          )}

          {activeCategory === 'news' && (
            <VStack space="md" mb="$4">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={16}
                fontWeight="$bold"
                textAlign="center"
                py="$8"
              >
                What's News content will be here
              </Text>
            </VStack>
          )}
        </VStack>
      </ScrollView>

      <SideMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        userProfile={mock_user_profile}
      />
    </Box>
  );
};

ExploreScreen.displayName = 'ExploreScreen';

export default ExploreScreen;