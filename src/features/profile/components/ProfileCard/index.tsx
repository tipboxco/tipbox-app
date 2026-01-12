import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  GiftIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  BellIcon,
} from 'react-native-heroicons/outline';
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
import { useSafeAreaValues, toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useAddToTrustList, useRemoveFromTrustList } from '../../api/hooks';

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
  const { mutate: trustUser, isPending: isTrusting } = useAddToTrustList();
  const { mutate: untrustUser, isPending: isUntrusting } = useRemoveFromTrustList();
  
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
      // Eğer geri gidilemiyorsa, App tab'a dön (MainDrawer → TabNavigator)
      // NavigationService kullanarak type-safe navigation
      const { navigationService } = require('@/src/services/NavigationService');
      navigationService.navigate('App' as any);
    }
  };

  return (
    <View style={{ margin: 0, padding: 0, width: '100%', alignSelf: 'stretch' }}>
      {/* Banner */}
      <Box 
        h={160} 
        overflow="hidden" 
        position="relative" 
        style={{ 
          margin: 0, 
          padding: 0, 
          width: '100%',
          alignSelf: 'stretch',
        }}
      >
        <Image
          source={toImageSource(userData.bannerUrl) || require('@/assets/banner/banner_01.png')}
          alt="Profile Banner"
          style={{ width: '100%', height: '100%' }}
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
        top={safeAreaTop + 12}
        left={0}
        right={0}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-start"
        px={16}
        pointerEvents="box-none"
        zIndex={2000}
      >
        <Pressable onPress={handleBackPress} style={{ zIndex: 2000 }}>
          <ChevronLeftIcon width={24} height={24} color="#fff" />
        </Pressable>

        <Pressable
          onPress={() => {
            console.log('[ProfileCard] Menu button pressed');
            setIsMenuVisible(true);
          }}
          style={{ zIndex: 2000 }}
        >
          <EllipsisVerticalIcon width={24} height={24} color="#fff" />
        </Pressable>
      </Box>

      {/* Profile Image and Action Buttons Row */}
      <Box px={15} mt={-20} style={{ marginLeft: 0, marginRight: 0, paddingLeft: 15, paddingRight: 15 }}>
        <HStack alignItems="flex-start" justifyContent="space-between" space="md">
          {/* Profile Image */}
          <Box 
            borderRadius={100}
            overflow="hidden"
            w={68}
            h={68}
            borderWidth={2}
            borderColor="$white"
            flexShrink={0}
          >
            <Image
              source={toImageSource(userData.avatar) || DEFAULT_USER_AVATAR }
              alt={userData.name}
              w="100%"
              h="100%"
            />
          </Box>

          {/* Action Buttons */}
          <HStack space="sm" alignItems="center" flexShrink={0} mt={32}>
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
                <PencilIcon width={14} height={14} color="#000" />
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
                {/* SendTIPS */}
                <Pressable
                  w={30} 
                  h={30} 
                  bg="#F7F7F7" 
                  borderRadius={200} 
                  borderWidth={1}
                  borderColor="#E9E9E9"
                  justifyContent="center" 
                  alignItems="center"
                  onPress={() => {
                    // TODO: SendTIPS functionality
                    console.log('[ProfileCard] SendTIPS pressed');
                  }}
                >
                  <GiftIcon width={14} height={14} color="#000" />
                </Pressable>
                
                {/* 1-on-1 Request */}
                <Pressable
                  w={30} 
                  h={30} 
                  bg="#F7F7F7" 
                  borderRadius={200} 
                  borderWidth={1}
                  borderColor="#E9E9E9"
                  justifyContent="center" 
                  alignItems="center"
                  onPress={() => {
                    // TODO: 1-on-1 Request functionality
                    console.log('[ProfileCard] 1-on-1 Request pressed');
                  }}
                >
                  <PhoneIcon width={14} height={14} color="#000" />
                </Pressable>
                
                {/* DM */}
                <Pressable
                  w={30} 
                  h={30} 
                  bg="#F7F7F7" 
                  borderRadius={200} 
                  borderWidth={1}
                  borderColor="#E9E9E9"
                  justifyContent="center" 
                  alignItems="center"
                  onPress={() => {
                    // TODO: DM functionality
                    console.log('[ProfileCard] DM pressed');
                  }}
                >
                  <ChatBubbleLeftIcon width={14} height={14} color="#000" />
                </Pressable>
                
                {/* Notification */}
                <Pressable
                  w={30} 
                  h={30} 
                  bg="#F7F7F7" 
                  borderRadius={200} 
                  borderWidth={1}
                  borderColor="#E9E9E9"
                  justifyContent="center" 
                  alignItems="center"
                  onPress={() => {
                    // TODO: Notification functionality
                    console.log('[ProfileCard] Notification pressed');
                  }}
                >
                  <BellIcon width={14} height={14} color="#000" />
                </Pressable>
                
                {/* Trust / Un Trust */}
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
                  onPress={() => {
                    if (!userId) return;
                    
                    if (userData.isTrusted) {
                      // Un Trust - Trust listesinden kaldır
                      untrustUser(userId);
                    } else {
                      // Trust - Trust listesine ekle
                      trustUser(userId);
                    }
                  }}
                  disabled={isTrusting || isUntrusting}
                  opacity={(isTrusting || isUntrusting) ? 0.6 : 1}
                >
                  <Feather 
                    name={userData.isTrusted ? "user-minus" : "user-plus"} 
                    size={14} 
                    color="#000" 
                  />
                  <Text
                    color="#000"
                    fontSize={10}
                    fontWeight="$semibold"
                  >
                    {isTrusting ? "Ekleniyor..." : isUntrusting ? "Kaldırılıyor..." : (userData.isTrusted ? "Un Trust" : "Trust")}
                  </Text>
                </Pressable>
              </>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Profile Info */}
      <Box px={15} mt={10} style={{ marginLeft: 0, marginRight: 0, paddingLeft: 15, paddingRight: 15 }}>
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

      {/* Inventory Header */}
      <Box mt={20} px={15} style={{ marginLeft: 0, marginRight: 0, paddingLeft: 15, paddingRight: 15 }}>
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
                      source={toImageSource(badge.image) || require('@/assets/defaultImages/default-badge.png')}
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
    </View>
  );
};

export default ProfileCard;