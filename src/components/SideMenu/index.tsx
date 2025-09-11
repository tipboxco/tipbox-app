import React from 'react';
import {
  Box,
  VStack,
  Text,
  Pressable,
  HStack,
  ScrollView,
  Image,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/store';
import { Feather as FeatherIcon } from '@expo/vector-icons';

interface MenuItem {
  id: string;
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
}

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  userProfile: {
    name: string;
    avatar: any;
    trust: number;
    truster: number;
    posts: number;
    badge?: {
      text: string;
      color: string;
      borderColor: string;
    };
  };
}

type FeatherIconName = keyof typeof FeatherIcon.glyphMap;

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 80,
  },
});

export const SideMenu = ({
  visible,
  onClose,
  userProfile,
}: SideMenuProps) => {
  const { colorMode } = useColorMode();
  const navigation = useNavigation<any>();
  const isDark = colorMode === 'dark';
  const logout = useAuthStore(state => state.logout);

  const MENU_ITEMS: MenuItem[] = [
    {
      id: 'account',
      icon: 'user',
      label: 'Account',
      onPress: () => {
        onClose();
        navigation.navigate('Profile');
      },
    },
    {
      id: 'wallet',
      icon: 'credit-card',
      label: 'Wallet',
      onPress: () => {},
    },
    {
      id: 'bookmarks',
      icon: 'bookmark',
      label: 'Bookmarks',
      onPress: () => {},
    },
    {
      id: 'marketplace',
      icon: 'shopping-bag',
      label: 'Marketplace',
      onPress: () => {},
    },
    {
      id: 'prime-pass',
      icon: 'award',
      label: 'Prime Pass',
      onPress: () => {},
    },
    {
      id: 'settings',
      icon: 'settings',
      label: 'Settings',
      onPress: () => {
        onClose();
        navigation.navigate('Settings');
      },
    },
  ];

  if (!visible) return null;

  return (
    <>
      <Pressable
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0, 0, 0, 0.5)"
        zIndex={998}
        onPress={onClose}
      />
    <Box
      position="absolute"
      top={0}
      left={0}
      bottom={0}
      w={301}
      bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
      zIndex={999}
      borderRightWidth={1}
      borderRightColor={isDark ? '$backgroundDark100' : '$backgroundLight200'}
    >
      <Pressable
        position="absolute"
        top={4}
        right={4}
        zIndex={1000}
        p="$2"
        rounded="$full"
        bg={isDark ? '$backgroundDark800' : '$backgroundLight200'}
        onPress={onClose}
      >
        <FeatherIcon name="x" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
      </Pressable>
      <ScrollView>
        {/* Banner Section */}
        <Box h={280} w="100%" position="relative" bg="$white">
          {/* Banner */}
          <Box h={120} w="100%" overflow="hidden">
            <LinearGradient
              colors={['#4A1D96', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradient, { height: 120 }]}
            />
          </Box>
          
          {/* Profile Section */}
          <Box position="absolute" top={70} left={0} right={0} px="$6">
            <Box alignItems="center">
              <Box
                borderWidth={4}
                borderColor={isDark ? '$backgroundDark950' : '$white'}
                rounded="$full"
                overflow="hidden"
                w={100}
                h={100}
                bg="$white"
              >
                <Image
                  source={userProfile.avatar}
                  alt={userProfile.name}
                  w="100%"
                  h="100%"
                  rounded="$full"
                />
              </Box>
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={18}
                fontWeight="$bold"
                mt="$2"
              >
                {userProfile.name}
              </Text>
              {userProfile.badge && (
                <Box
                  mt="$1"
                  px="$3"
                  py="$1"
                  rounded="$full"
                  borderWidth={1}
                  borderColor="#FF0842"
                  bg="rgba(255, 8, 152, 0.4)"
                >
                  <Text fontSize={12} color="#FFFFFF">
                    {userProfile.badge.text}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Stats Section */}
        <Box mt={-20} mb="$4" px="$6">
          <HStack justifyContent="space-between">
            <VStack alignItems="center" space="xs">
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={14}
                fontWeight="$bold"
              >
                {userProfile.posts}
              </Text>
              <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize={11}>
                Posts
              </Text>
            </VStack>
            <Box w={0.5} h={30} bg={isDark ? '$backgroundDark200' : '$backgroundLight200'} />
            <VStack alignItems="center" space="xs">
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={14}
                fontWeight="$bold"
              >
                {userProfile.trust}
              </Text>
              <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize={11}>
                Trust
              </Text>
            </VStack>
            <Box w={0.5} h={30} bg={isDark ? '$backgroundDark200' : '$backgroundLight200'} />
            <VStack alignItems="center" space="xs">
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={14}
                fontWeight="$bold"
              >
                {userProfile.truster}
              </Text>
              <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize={11}>
                Truster
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Premium Banner */}
        <Box
          mx="-$3"
          mb="$3"
        >
          <Box
            w="100%"
            h={0.5}
            bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
          />
          <Box
            w="100%"
            h={57}
            bg={isDark ? '$backgroundDark800' : '$backgroundLight50'}
            justifyContent="center"
            px="$6"
          >
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize={12}
              fontWeight="$semibold"
            >
              Premium Selling Design Small Banner
            </Text>
          </Box>
        </Box>

        {/* Menu Items */}
        <VStack px="$6">
          {MENU_ITEMS.map((item: MenuItem) => (
            <Pressable
              key={item.id}
              onPress={item.onPress}
              h={40}
              justifyContent="center"
              bg="transparent"
              $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
            >
              <HStack space="md" alignItems="center">
                <Box w={24} h={24} justifyContent="center" alignItems="center">
                  <FeatherIcon name={item.icon} size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
                <Text 
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={12}
                  fontWeight="$semibold"
                  w={110}
                >
                  {item.label}
                </Text>
              </HStack>
            </Pressable>
          ))}
        </VStack>

        {/* Bottom Line */}
        <Box
          h={0.5}
          w={314}
          bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
          mt={20}
          mx="-$3"
        />

        {/* Settings and Help */}
        <VStack px="$6">
          <Pressable
            onPress={() => {}}
            h={40}
            justifyContent="center"
            bg="transparent"
            $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
          >
            <HStack space="md" alignItems="center">
              <Box w={20} h={20} justifyContent="center" alignItems="center">
                <FeatherIcon name="star" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={10}
                fontWeight="$semibold"
                w={110}
              >
                Vote New Features
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            onPress={() => {}}
            h={40}
            justifyContent="center"
            bg="transparent"
            $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
          >
            <HStack space="md" alignItems="center">
              <Box w={20} h={20} justifyContent="center" alignItems="center">
                <FeatherIcon name="help-circle" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={10}
                fontWeight="$semibold"
                w={110}
              >
                Help Center
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            onPress={() => {}}
            h={40}
            justifyContent="center"
            bg="transparent"
            $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
          >
            <HStack space="md" alignItems="center">
              <Box w={20} h={20} justifyContent="center" alignItems="center">
                <FeatherIcon name="clock" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={10}
                fontWeight="$semibold"
                w={110}
              >
                Purchase History
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            onPress={async () => {
              await logout();
              onClose();
              navigation.reset({
                index: 0,
                routes: [{ 
                  name: 'Auth',
                  state: {
                    routes: [{ name: 'Welcome' }]
                  }
                }],
              });
            }}
            h={40}
            justifyContent="center"
            bg="transparent"
            $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
          >
            <HStack space="md" alignItems="center">
              <Box w={20} h={20} justifyContent="center" alignItems="center">
                <FeatherIcon name="log-out" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={10}
                fontWeight="$semibold"
                w={110}
              >
                Log out
              </Text>
            </HStack>
          </Pressable>
        </VStack>
      </ScrollView>
    </Box>
    </>
  );
};