import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { 
  Box, 
  VStack, 
  Text, 
  HStack, 
  Image, 
  Pressable
} from '@gluestack-ui/themed';

import { useColorMode } from '@/src/hooks/useColorMode';
import { ProfileStackParamList } from '../../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useAppStore } from '@/src/store/appStore';
import type { UserProfile } from '../../types';
import { useSafeAreaValues, useBottomTabBarHeightValue, toImageSource } from '@/src/utils';

interface ProfileCardProps {
  userData: UserProfile;
  userId?: string; // Profil sahibinin ID'si (kendi profili kontrolü için)
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

export const ProfileCard = ({ userData, userId }: ProfileCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { user } = useAppStore();
  const safeAreaTop = useSafeAreaValues('top');
  
  // Kullanıcının kendi profiline bakıp bakmadığını kontrol et
  const isOwnProfile = user?.id === userId;

  const handleEditProfile = () => {
    setIsMenuVisible(false);
    navigation.navigate('ProfileEdit');
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      console.log('[ProfileCard] Going back...');
      navigation.goBack();
    } else {
      console.log('[ProfileCard] Cannot go back, navigating to Main...');
      // Eğer geri gidilemiyorsa, Main tab'a dön
      rootNavigation.navigate('Main' as never);
    }
  };

  return (
    <Box>
      {/* Banner */}
      <Box h={130} overflow="hidden" position="relative">
        <Image
          source={toImageSource(userData.bannerUrl) || require('@/assets/banner/banner_01.png')}
          alt="Profile Banner"
          w="100%"
          h="100%"
          resizeMode="cover"
        />
        {/* Overlay */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.5)"
        />
      </Box>

      {/* Banner Controls */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-start"
        px={16}
        paddingTop={32}
        pointerEvents="box-none"
        zIndex={2000}
      >
        <Pressable onPress={handleBackPress} style={{ zIndex: 2000 }}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </Pressable>

        <Pressable
          onPress={() => {
            console.log('[ProfileCard] Menu button pressed');
            setIsMenuVisible(true);
          }}
          style={{ zIndex: 2000 }}
        >
          <Feather name="more-vertical" size={24} color="#fff" />
        </Pressable>
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
          source={toImageSource(userData.avatarUrl) || require('@/assets/avatar/ozan.png')}
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

            {userData.biography && (
              <Text
                color={isDark ? '$textDark400' : '$textLight600'}
                fontSize={10}
                lineHeight={15}
                mt={2}
              >
                {userData.biography}
              </Text>
            )}

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
              <Pressable onPress={() => {
                if (user?.id) {
                  navigation.navigate('TrustList', { 
                    userId: user.id,
                    initialTab: 'trust' 
                  });
                }
              }}>
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
              <Pressable onPress={() => {
                if (user?.id) {
                  navigation.navigate('TrustList', { 
                    userId: user.id,
                    initialTab: 'truster' 
                  });
                }
              }}>
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
            {userData.titles && userData.titles.length > 0 && (
              <Text
                color={isDark ? '$textDark400' : '$textLight600'}
                fontSize={10}
                mt={2}
              >
                {userData.titles.join(" - ")}
              </Text>
            )}
          </Box>

          {/* Action Buttons */}
          <HStack space="sm" alignItems="center" position="absolute" right={0} top={-40}>
            {isOwnProfile ? (
              // Kendi profili - Edit Profile butonu
              <Pressable
                bg="#F7F7F7"
                borderRadius={200}
                borderWidth={1}
                borderColor="#E9E9E9"
                px={12}
                py={8}
                flexDirection="row"
                alignItems="center"
                gap={6}
                onPress={handleEditProfile}
              >
                <Feather name="edit-2" size={14} color="#000" />
                <Text
                  color="#000"
                  fontSize={10}
                  fontWeight="$semibold"
                >
                  Edit Profile
                </Text>
              </Pressable>
            ) : (
              // Başka kullanıcının profili - Action butonları
              <>
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
                {userData.isTrusted === false && (
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
              </>
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
            onPress={() => navigation.navigate('InventoryList', { userId: userData.id })}
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
      {userData.badges && userData.badges.length > 0 && (
        <Box mt={6} px={15}>
          <Box
            borderRadius={5}
            p={14}
            h={130}
          >
            <HStack space="md" justifyContent="space-between">
              {userData.badges.slice(0, 4).map((badge) => (
                <VStack key={badge.id} space="xs" alignItems="center">
                  <Box
                    w={70}
                    h={70}
                    borderRadius={5}
                    borderWidth={0}
                    overflow="hidden"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Image
                      source={toImageSource(badge.image) || require('@/assets/badges/badge_01.png')}
                      alt={badge.title}
                      w={60}
                      h={60}
                      resizeMode="contain"
                    />
                  </Box>
                  <Text
                    color={isDark ? '$textDark400' : '#000000'}
                    fontSize={8}
                    fontWeight="$bold"
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
                fontSize={8}
                textAlign="center"
                mt="$4"
                fontWeight="$regular"
              >
                See More Collections
              </Text>
            </Pressable>
          </Box>
        </Box>
      )}

      {/* Menu Modal */}
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
          <Box
            flex={1}
            bg="rgba(0, 0, 0, 0.5)"
            justifyContent="flex-start"
            alignItems="flex-end"
          >
            <TouchableWithoutFeedback>
              <Box
                mt={60}
                mr={16}
                bg={isDark ? '#1F1F1F' : '#FFFFFF'}
                borderRadius={8}
                minWidth={180}
                overflow="hidden"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.25}
                shadowRadius={3.84}
                elevation={5}
              >
                {/* Edit Profile Option */}
                <Pressable
                  onPress={handleEditProfile}
                  px={16}
                  py={14}
                >
                  <HStack space="md" alignItems="center">
                    <Feather 
                      name="edit-2" 
                      size={18} 
                      color={isDark ? '#FFFFFF' : '#000000'} 
                    />
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize={14}
                      fontWeight="$medium"
                    >
                      Edit Profile
                    </Text>
                  </HStack>
                </Pressable>
              </Box>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </Modal>
    </Box>
  );
};

export default ProfileCard;