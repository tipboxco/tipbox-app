import React from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { Box, Text, Image, HStack, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileCardProps } from '../../types';

const ProfileCard: React.FC<ProfileCardProps> = ({
  userData,
  onPress
}) => {
  const { username, handle, badge, stats } = userData;
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={onPress}>
      <Box bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Profile Background with Gradient */}
      <Box position="relative" height={150}>
        <LinearGradient
          colors={['#4A1D96', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />

        {/* Profile Image with Border */}
        <Box 
          position="absolute" 
          top={90} 
          left="50%"
          style={{ transform: [{ translateX: -57 }] }}
          width={114} 
          height={114}
          borderRadius={57}
          overflow="hidden"
        >
          <Image
            source={require('@/assets/avatar/ozan.png')}
            alt="Profile"
            width={114}
            height={114}
            borderRadius={57}
          />
        </Box>

        {/* Gift Icon */}
        <Box
          position="absolute"
          bottom={15}
          right={15}
          bg="rgba(0,0,0,0.4)"
          p="$2"
          borderRadius="$full"
          zIndex={1}
        >
          <Feather name="gift" size={24} color="#FFFFFF" />
        </Box>
      </Box>

      {/* Profile Info */}
      <Box mt={70} alignItems="center">
        <Text
          color={isDark ? '$textDark50' : '$textLight900'}
          fontSize="$xl"
          fontWeight="$bold"
          textAlign="center"
        >
          {username}
        </Text>
        <Text
          color={isDark ? '$textDark400' : '$textLight500'}
          fontSize="$sm"
          mt="$1"
        >
          {handle}
        </Text>

        {/* Badge */}
        <Box
          mt="$2"
          px="$3"
          py="$1"
          bg="#8962E7"
          borderWidth={1}
          borderColor="#6835E0"
          borderRadius="$lg"
        >
          <Text
            color="#260080"
            fontSize="$xs"
            fontWeight="$semibold"
          >
            {badge.name}
          </Text>
        </Box>

        {/* Stats */}
        <HStack space="md" mt="$6" alignItems="center">
          <VStack alignItems="center">
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$lg"
              fontWeight="$bold"
            >
              {stats.trust}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize="$sm"
            >
              Trust
            </Text>
          </VStack>
          <Box width={1} height={38} bg={isDark ? '#515151' : '#E5E5E5'} mx="$4" />
          <VStack alignItems="center">
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$lg"
              fontWeight="$bold"
            >
              {stats.truster}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize="$sm"
            >
              Truster
            </Text>
          </VStack>
          <Box width={1} height={38} bg={isDark ? '#515151' : '#E5E5E5'} mx="$4" />
          <VStack alignItems="center">
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$lg"
              fontWeight="$bold"
            >
              {stats.supporter}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize="$sm"
            >
              Supporter
            </Text>
          </VStack>
        </HStack>

        {/* Action Buttons */}
        <HStack space="sm" mt="$4">
          <Pressable>
            <Box
              bg="#D8FF08"
              px="$6"
              py="$2"
              borderRadius="$lg"
            >
              <Text
                color="#181C00"
                fontSize="$sm"
                fontWeight="$semibold"
              >
                Trust
              </Text>
            </Box>
          </Pressable>
          <Pressable>
            <Box
              bg={isDark ? '#353535' : '#F5F5F5'}
              px="$6"
              py="$2"
              borderRadius="$lg"
            >
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize="$sm"
                fontWeight="$semibold"
              >
                Request 1-on-1
              </Text>
            </Box>
          </Pressable>
          <Pressable>
            <Box
              bg={isDark ? '#353535' : '#F5F5F5'}
              p="$2"
              borderRadius="$lg"
            >
              <Feather 
                name="message-circle" 
                size={20} 
                color={isDark ? '#FFFFFF' : '#000000'} 
              />
            </Box>
          </Pressable>
        </HStack>
      </Box>
    </Box>
    </Pressable>
  );
};

ProfileCard.displayName = 'ProfileCard';

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 150,
  },
});

export default ProfileCard;
