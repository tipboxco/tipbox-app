import React from 'react';
import { ScrollView, VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { mockEventDetail } from '@/src/mock/catalog/brandSurveys';

type BrandEventsDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandEventsDetailScreen'>;

const BrandEventsDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandEventsDetailScreenNavigationProp>();

  const getButtonStyle = (status: string) => {
    if (status === 'joined') {
      return {
        bg: 'rgba(215, 215, 215, 0.8)',
        borderColor: '#ADADAD',
        textColor: '#000000',
        text: 'Joined',
        icon: 'check' as const,
      };
    }
    return {
      bg: '#E8FF6B',
      borderColor: '#D8FF08',
      textColor: '#000000',
      text: 'Join',
      icon: null,
    };
  };

  const buttonStyle = getButtonStyle(mockEventDetail.status);

  const renderRequirementItem = (requirement: any) => {
    const progressPercentage = (requirement.progress / requirement.total) * 100;
    
    return (
      <Box
        key={requirement.id}
        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
        borderWidth={1}
        borderColor="#FDFDFD"
        borderRadius={0}
        p="$3"
        mb="$1"
      >
        <HStack alignItems="center" space="md">
          {/* Icon */}
          <Box
            width={36}
            height={36}
            bg="#B9B9B9"
            borderRadius={4}
            alignItems="center"
            justifyContent="center"
          >
            <Feather name={requirement.icon as any} size={16} color="#FFFFFF" />
          </Box>

          {/* Content */}
          <VStack flex={1} space="xs">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={10}
              fontWeight="$semibold"
            >
              {requirement.title}
            </Text>
            
            {/* Progress Bar */}
            <Box
              width="100%"
              height={6}
              bg="#EBEBEB"
              borderRadius={10}
              overflow="hidden"
            >
              <Box
                width={`${progressPercentage}%`}
                height="100%"
                bg="#686868"
                borderRadius={10}
              />
            </Box>
          </VStack>

          {/* Progress Circle */}
          <Box
            width={14}
            height={14}
            bg="#686868"
            borderRadius={7}
          />
        </HStack>
      </Box>
    );
  };

  return (
    <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <Header
        title="Anketler & Oyunlaştırmalar"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView flex={1}>
        <VStack space="md" p="$4">
          {/* Event Header Card */}
          <Box
            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
            borderWidth={1}
            borderColor="#E9E9E9"
            borderRadius={10}
            overflow="hidden"
          >
            {/* Event Info */}
            <HStack p="$3" alignItems="center" space="md">
              {/* Event Image */}
              <Box
                width={52}
                height={52}
                borderRadius={5}
                bg="rgba(0, 0, 0, 0.2)"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
              >
                <Image
                  source={mockEventDetail.image}
                  alt={mockEventDetail.title}
                  style={{ width: 52, height: 52 }}
                  resizeMode="cover"
                />
              </Box>

              {/* Event Title */}
              <VStack flex={1}>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={12}
                  fontWeight="$bold"
                >
                  {mockEventDetail.title}
                </Text>
              </VStack>

              {/* Action Button */}
              <Pressable
                onPress={() => console.log('Event action:', mockEventDetail.status)}
                bg={buttonStyle.bg}
                borderWidth={1}
                borderColor={buttonStyle.borderColor}
                borderRadius={5}
                px="$5"
                py="$1.5"
                alignItems="center"
                justifyContent="center"
                minWidth={74}
                height={24}
              >
                <HStack alignItems="center" space="xs">
                  {buttonStyle.icon && (
                    <Feather name={buttonStyle.icon} size={12} color={buttonStyle.textColor} />
                  )}
                  <Text
                    color={buttonStyle.textColor}
                    fontSize={10}
                    fontWeight="$bold"
                  >
                    {buttonStyle.text}
                  </Text>
                </HStack>
              </Pressable>
            </HStack>

            {/* Description */}
            <Box
              bg={isDark ? '#1A1A1A' : '#FDFDFD'}
              borderTopWidth={1}
              borderColor="#E9E9E9"
              p="$3"
            >
              <Text
                color="#838383"
                fontSize={10}
                fontWeight="$bold"
                mb="$1"
              >
                Description
              </Text>
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={9}
                lineHeight={11}
              >
                {mockEventDetail.fullDescription}
              </Text>
            </Box>
          </Box>

          {/* Statistics and Rewards Row */}
          <HStack space="md">
            {/* Statistics Card */}
            <Box
              flex={1}
              bg={isDark ? '#1A1A1A' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={10}
              p="$3"
            >
              <HStack alignItems="center" space="sm" mb="$2">
                <Box
                  width={28}
                  height={28}
                  bg="#FFFFFF"
                  borderWidth={1}
                  borderColor="#B9B9B9"
                  borderRadius={20}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Feather name="bar-chart-2" size={16} color="#B9B9B9" />
                </Box>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={11}
                  fontWeight="$bold"
                >
                  {mockEventDetail.statistics.title}
                </Text>
              </HStack>

              <Box
                width="100%"
                height={1}
                bg="#E9E9E9"
                mb="$2"
              />

              <VStack space="xs">
                <HStack alignItems="center" space="sm">
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={16}
                    fontWeight="$bold"
                  >
                    %{mockEventDetail.statistics.percentage}
                  </Text>
                  <Text
                    color="#B9B9B9"
                    fontSize={10}
                    fontWeight="$medium"
                  >
                    {mockEventDetail.statistics.description}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Rewards Card */}
            <Box
              flex={1}
              bg={isDark ? '#1A1A1A' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={10}
              p="$3"
            >
              <HStack alignItems="center" space="sm" mb="$2">
                <Box
                  width={28}
                  height={28}
                  bg="#FFFFFF"
                  borderWidth={1}
                  borderColor="#B9B9B9"
                  borderRadius={20}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Feather name="gift" size={16} color="#B9B9B9" />
                </Box>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={11}
                  fontWeight="$bold"
                >
                  {mockEventDetail.rewards.title}
                </Text>
              </HStack>

              <Box
                width="100%"
                height={1}
                bg="#E9E9E9"
                mb="$2"
              />

              <HStack space="xs" alignItems="center">
                <Image
                  source={mockEventDetail.rewards.badgeImage}
                  alt="Badge"
                  style={{ width: 26, height: 20 }}
                  resizeMode="cover"
                />
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={10}
                  fontWeight="$bold"
                >
                  {mockEventDetail.rewards.badgeName}
                </Text>
              </HStack>
            </Box>
          </HStack>

          {/* Requirements Section */}
          <VStack space="sm">
            {mockEventDetail.requirements.map(renderRequirementItem)}
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
};

export default BrandEventsDetailScreen;
