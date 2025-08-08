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
    friends: number;
    badge?: {
      text: string;
      color: string;
      borderColor: string;
    };
  };
  menuItems: MenuItem[];
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
  menuItems,
}: SideMenuProps) => {
  const { colorMode } = useColorMode();
  const navigation = useNavigation();
  const isDark = colorMode === 'dark';

  if (!visible) return null;

  return (
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
        <Box h={80} w="100%" overflow="hidden">
          <LinearGradient
            colors={['#4A1D96', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        </Box>

        {/* Profile Section */}
        <Box px="$6" mt={-40}>
          <Box alignItems="center">
            <Box
              borderWidth={4}
              borderColor={isDark ? '$backgroundDark950' : '$backgroundLight0'}
              rounded="$full"
              overflow="hidden"
            >
              <Image
                source={userProfile.avatar}
                alt={userProfile.name}
                size="xl"
                rounded="$full"
              />
            </Box>
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$md"
              fontWeight="$bold"
              mt="$2"
            >
              {userProfile.name}
            </Text>
            {userProfile.badge && (
              <Box
                mt="$1"
                px="$2"
                py="$1"
                rounded="$lg"
                borderWidth={1}
                borderColor={userProfile.badge.borderColor}
                bg={userProfile.badge.color}
              >
                <Text fontSize="$2xs" color="#FFFFFF">
                  {userProfile.badge.text}
                </Text>
              </Box>
            )}
          </Box>

          {/* Stats Section */}
          <HStack justifyContent="space-between" mt="$4" mb="$6">
            <VStack alignItems="center">
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {userProfile.trust}
              </Text>
              <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize="$2xs">
                Trust
              </Text>
            </VStack>
            <Box w={0.5} h="$8" bg={isDark ? '$backgroundDark200' : '$backgroundLight200'} />
            <VStack alignItems="center">
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {userProfile.truster}
              </Text>
              <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize="$2xs">
                Truster
              </Text>
            </VStack>
            <Box w={0.5} h="$8" bg={isDark ? '$backgroundDark200' : '$backgroundLight200'} />
            <VStack alignItems="center">
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {userProfile.friends}
              </Text>
              <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize="$2xs">
                Friends
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Premium Banner */}
        <Box
          mx="$4"
          p="$4"
          bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
          rounded="$lg"
          mb="$4"
        >
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize="$xs"
            fontWeight="$semibold"
          >
            Premium Satma Tasarımı Küçük Banner
          </Text>
        </Box>

        {/* Menu Items */}
        <VStack space="sm" px="$4">
          {menuItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={item.onPress}
              py="$2"
              px="$3"
              rounded="$lg"
              bg="transparent"
              $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
            >
              <HStack space="md" alignItems="center">
                <FeatherIcon name={item.icon} size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                <Text 
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize="$xs"
                  fontWeight="$semibold"
                >
                  {item.label}
                </Text>
              </HStack>
            </Pressable>
          ))}
        </VStack>

        {/* Bottom Line */}
        <Box
          h={1}
          w="100%"
          bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
          mt="$6"
        />

        {/* Settings and Help */}
        <VStack space="sm" px="$4" py="$4">
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            py="$2"
            px="$3"
            rounded="$lg"
            bg="transparent"
            $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
          >
            <HStack space="md" alignItems="center">
              <FeatherIcon name="settings" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize="$2xs"
                fontWeight="$semibold"
              >
                Ayarlar
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            onPress={() => {}}
            py="$2"
            px="$3"
            rounded="$lg"
            bg="transparent"
            $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
          >
            <HStack space="md" alignItems="center">
              <FeatherIcon name="help-circle" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize="$2xs"
                fontWeight="$semibold"
              >
                Yardım Merkezi
              </Text>
            </HStack>
          </Pressable>
        </VStack>
      </ScrollView>
    </Box>
  );
};