import React from 'react';
import {
  Box,
  VStack,
  Text,
  Pressable,
  HStack,
  Image,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/store';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { mock_user_profile } from '@/src/mock/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MenuItem {
  id: string;
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
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

export const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { colorMode } = useColorMode();
  const navigation = useNavigation<any>();
  const isDark = colorMode === 'dark';
  const logout = useAuthStore(state => state.logout);
  const userProfile = mock_user_profile;
  const insets = useSafeAreaInsets();

  const MENU_ITEMS: MenuItem[] = [
    {
      id: 'account',
      icon: 'user',
      label: 'Account',
      onPress: () => {
        props.navigation.closeDrawer();
        navigation.navigate('Profile');
      },
    },
    {
      id: 'wallet',
      icon: 'credit-card',
      label: 'Wallet',
      onPress: () => {
        props.navigation.closeDrawer();
        navigation.navigate('Wallet');
      },
    },
    {
      id: 'bookmarks',
      icon: 'bookmark',
      label: 'Bookmarks',
      onPress: () => {
        props.navigation.closeDrawer();
        navigation.navigate('Bookmarks');
      },
    },
    {
      id: 'marketplace',
      icon: 'shopping-bag',
      label: 'Marketplace',
      onPress: () => {
        props.navigation.closeDrawer();
        navigation.navigate('Marketplace');
      },
    },
    {
      id: 'prime-pass',
      icon: 'award',
      label: 'Prime Pass',
      onPress: () => {
        props.navigation.closeDrawer();
      },
    },
    {
      id: 'settings',
      icon: 'settings',
      label: 'Settings',
      onPress: () => {
        props.navigation.closeDrawer();
        navigation.navigate('Settings');
      },
    },
    {
      id: 'more-schoise',
      icon: 'more-horizontal',
      label: 'MoreSchoise',
      onPress: () => {
        props.navigation.closeDrawer();
        navigation.navigate('MoreSchoise');
      },
    },
  ];

  return (
    <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'} w="100%" m={0} p={0}>
      <ScrollView
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          margin: 0,
          width: '100%',
        }}
        contentInsetAdjustmentBehavior="never"
        scrollEnabled
        showsVerticalScrollIndicator={false}
        style={{
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          margin: 0,
          padding: 0,
          flex: 1,
          width: '100%',
        }}
      >
        <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'} w="100%" m={0} p={0}>
          {/* Banner Section – FULL BLEED */}
          <Box h={280} w="100%" position="relative" bg={isDark ? '#000000' : '#FFFFFF'}>
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
                borderColor={isDark ? '#000000' : '#FFFFFF'}
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

          {/* Stats Section – FULL BLEED, içte hizalama */}
          <Box mt={-20} mb="$4">
            <HStack justifyContent="space-between" px="$6">
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

          {/* Premium Banner – FULL BLEED, içte padding */}
          <Box w="100%" mb="$3">
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

          {/* Menu Items – DIŞTA px yok, SATIRDA px var */}
          <VStack px="$0">
            {MENU_ITEMS.map((item: MenuItem) => (
              <Pressable
                key={item.id}
                onPress={item.onPress}
                h={48}
                justifyContent="center"
                bg="transparent"
                px="$6"
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

          {/* Bottom Line – FULL BLEED */}
          <Box h={0.5} w="100%" bg={isDark ? '$backgroundDark200' : '$backgroundLight200'} mt={20} />

          {/* Settings and Help – DIŞTA px yok, SATIRDA px var */}
          <VStack px="$0">
            <Pressable
              onPress={() => props.navigation.closeDrawer()}
              h={48}
              justifyContent="center"
              bg="transparent"
              px="$6"
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
            onPress={() => props.navigation.closeDrawer()}
            h={48}
            justifyContent="center"
            bg="transparent"
            px="$6"
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
            onPress={() => props.navigation.closeDrawer()}
            h={48}
            justifyContent="center"
            bg="transparent"
            px="$6"
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
              props.navigation.closeDrawer();
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
            h={48}
            justifyContent="center"
            bg="transparent"
            px="$6"
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
        </Box>
      </ScrollView>
    </Box>
  );
};

