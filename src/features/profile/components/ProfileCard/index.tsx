import React from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Box, VStack, Text, HStack, Image, Pressable } from '@gluestack-ui/themed';

import { useColorMode } from '@/src/hooks/useColorMode';
import { ProfileStackParamList } from '../../navigation';
import { UserCardData } from '@/src/mock/profile/userCardData/types';

interface ProfileCardProps {
  userData: UserCardData;
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 130,
  },
});

export const ProfileCard = ({ userData }: ProfileCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  return (
    <Box>
      {/* Banner */}
      <Box h={130} overflow="hidden" position="relative">
        <Image
          source={require('@/assets/banner/banner_01.png')}
          alt="Profile Banner"
          w="100%"
          h="100%"
          resizeMode="cover"
        />
      </Box>

      {/* Back Button */}
      <Pressable 
        position="absolute" 
        top={20} 
        left={16}
        onPress={() => navigation.goBack()}
      >
        <Feather name="chevron-left" size={24} color="#fff" />
      </Pressable>

      {/* Menu Button */}
      <Box position="absolute" top={20} right={16}>
        <Feather name="more-vertical" size={24} color="#fff" />
      </Box>

      {/* Profile Image */}
      <Box 
        position="absolute" 
        top={104}
        left={16}
        borderRadius={100}
        overflow="hidden"
        w={68}
        h={68}
        borderWidth={2}
        borderColor="$white"
      >
        <Image
          source={userData.avatar}
          alt={userData.name}
          w="100%"
          h="100%"
        />
      </Box>

      {/* Profile Info and Actions */}
      <Box px={15} mt={50}>
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize={14}
              fontWeight="$bold"
            >
              {userData.name}
            </Text>

            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
              lineHeight={15}
              mt={2}
            >
              {userData.description}
            </Text>

            {/* Stats */}
            <HStack space="xs" mt={10}>
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={10}
                fontWeight="$bold"
              >
                {userData.stats.posts}
              </Text>
              <Text
                color={isDark ? '$textDark400' : '$textLight600'}
                fontSize={10}
              >
                Posts
              </Text>
              <Text
                color={isDark ? '$textDark400' : '$textLight600'}
                fontSize={10}
              >
                {" "}•{" "}
              </Text>
              <Pressable onPress={() => navigation.navigate('TrustList', { initialTab: 'trust' })}>
                <HStack alignItems="center" space="xs">
                  <Text
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize={10}
                    fontWeight="$bold"
                  >
                    {userData.stats.trust}
                  </Text>
                  <Text
                    color={isDark ? '$textDark400' : '$textLight600'}
                    fontSize={10}
                  >
                    Trust
                  </Text>
                </HStack>
              </Pressable>
              <Text
                color={isDark ? '$textDark400' : '$textLight600'}
                fontSize={10}
              >
                {" "}•{" "}
              </Text>
              <Pressable onPress={() => navigation.navigate('TrustList', { initialTab: 'truster' })}>
                <HStack alignItems="center" space="xs">
                  <Text
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize={10}
                    fontWeight="$bold"
                  >
                    {userData.stats.truster > 999 ? `${Math.floor(userData.stats.truster / 1000)}K` : userData.stats.truster}
                  </Text>
                  <Text
                    color={isDark ? '$textDark400' : '$textLight600'}
                    fontSize={10}
                  >
                    Truster
                  </Text>
                </HStack>
              </Pressable>
            </HStack>

            {/* Titles */}
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
              mt={2}
            >
              {userData.titles.join(" - ")}
            </Text>
          </Box>

          {/* Action Buttons */}
          <HStack space="sm" alignItems="center" position="absolute" right={0} top={-40}>
            {userData.actions.gift && (
              <Box 
                w={30} 
                h={30} 
                bg="#F7F7F7" 
                borderRadius={200} 
                borderWidth={1}
                borderColor="#E9E9E9"
                justifyContent="center" 
                alignItems="center"
              >
                <Feather name="gift" size={14} color="#000" />
              </Box>
            )}
            {userData.actions.headphone && (
              <Box 
                w={30} 
                h={30} 
                bg="#F7F7F7" 
                borderRadius={200} 
                borderWidth={1}
                borderColor="#E9E9E9"
                justifyContent="center" 
                alignItems="center"
              >
                <Feather name="headphones" size={14} color="#000" />
              </Box>
            )}
            {userData.actions.chat && (
              <Box 
                w={30} 
                h={30} 
                bg="#F7F7F7" 
                borderRadius={200} 
                borderWidth={1}
                borderColor="#E9E9E9"
                justifyContent="center" 
                alignItems="center"
              >
                <Feather name="message-circle" size={14} color="#000" />
              </Box>
            )}
            {userData.actions.notification && (
              <Box 
                w={30} 
                h={30} 
                bg="#F7F7F7" 
                borderRadius={200} 
                borderWidth={1}
                borderColor="#E9E9E9"
                justifyContent="center" 
                alignItems="center"
              >
                <Feather name="bell" size={14} color="#000" />
              </Box>
            )}
            {!userData.actions.trust && (
              <Pressable
                bg="#F7F7F7"
                borderRadius={200}
                borderWidth={1}
                borderColor="#E9E9E9"
                px={12}
                py={8}
                flexDirection="row"
                alignItems="center"
                gap={2}
              >
                <Feather name="user-plus" size={14} color="#000" />
                <Text
                  color="#000"
                  fontSize={10}
                  fontWeight="$semibold"
                >
                  Trust
                </Text>
              </Pressable>
            )}
          </HStack>
        </Box>
      </Box>

      {/* Inventory Header */}
      <Box mt={20} px={15}>
        <Box
          w="100%"
          h={34}
          position="relative"
          overflow="hidden"
          borderRadius={4}
        >
          {/* Background Image */}
          <Image
            source={require('@/assets/button/button_background_01.png')}
            alt="Button Background"
            position="absolute"
            w="100%"
            h="100%"
            resizeMode="cover"
          />

          {/* Text */}
          <Pressable
            position="absolute"
            w="100%"
            h="100%"
            justifyContent="center"
            alignItems="center"
            onPress={() => navigation.navigate('InventoryList')}
          >
            <Text
              color="$white"
              fontSize={10}
              fontWeight="$semibold"
              textAlign="center"
            >
              {userData.name}'s Inventory
            </Text>
          </Pressable>
        </Box>
      </Box>

      {/* Badge Items */}
      <Box mt={6} px={15}>
        <Box
          bg="$backgroundLight50"
          borderRadius={5}
          p={8}
          h={130}
        >
          <HStack space="md" justifyContent="space-between">
            {userData.badges.map((badge) => (
              <VStack key={badge.title} space="xs" alignItems="center">
                <Box
                  w={70}
                  h={70}
                  bg="$backgroundLight100"
                  borderRadius={5}
                  borderWidth={1}
                  borderColor="$backgroundLight200"
                  overflow="hidden"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Image
                    source={badge.image}
                    alt={badge.title}
                    w={60}
                    h={60}
                    resizeMode="contain"
                  />
                </Box>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize={8}
                  textAlign="center"
                >
                  {badge.title}
                </Text>
              </VStack>
            ))}
          </HStack>
          <Pressable onPress={() => navigation.navigate('Collections')}>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={11}
              textAlign="center"
              mt={12}
              fontWeight="$bold"
            >
              See More Collections
            </Text>
          </Pressable>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileCard;