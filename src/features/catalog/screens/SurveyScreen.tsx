import React, { useState } from 'react';
import { ScrollView, VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { mock_survey_tabs, mock_surveys } from '@/src/mock/catalog/brandSurveys';
import SurveyCard from '../components/SurveyCard';

type SurveyScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'SurveyScreen'>;

const SurveyScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SurveyScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('Anketler');


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
          {/* Top Cards */}
          <HStack space="md" mb="$2">
            {/* Product Info Card */}
            <Box
              flex={1}
              bg={isDark ? '#1A1A1A' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={10}
              p="$3"
            >
              <HStack alignItems="center">
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
                    source={require('@/assets/events/card-icon.png')}
                    alt="Apple Logo"
                    style={{ width: 52, height: 52 }}
                    resizeMode="cover"
                  />
                </Box>

                <VStack flex={1} ml="$3">
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={12}
                    fontWeight="$bold"
                  >
                    Apple
                  </Text>
                  <Text
                    color="#9B9B9B"
                    fontSize={12}
                    fontWeight="$semibold"
                  >
                    Technology
                  </Text>
                </VStack>

                <Pressable
                  onPress={() => console.log('Notification pressed')}
                  p="$2"
                >
                  <Feather name="bell" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                </Pressable>
              </HStack>
            </Box>

            {/* Brand History Card */}
            <Box
              width={78}
              bg={isDark ? '#1A1A1A' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={10}
              p="$3"
              alignItems="center"
            >
              <VStack alignItems="center" space="xs">
                <Box
                  width={26}
                  height={26}
                  borderRadius={13}
                  bg="#DDDDDD"
                  borderWidth={2}
                  borderColor="#FFFFFF"
                  alignItems="center"
                  justifyContent="center"
                  overflow="hidden"
                >
                  <Image
                    source={require('@/assets/avatar/ozan.png')}
                    alt="User Avatar"
                    style={{ width: 26, height: 26 }}
                    resizeMode="cover"
                  />
                </Box>

                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={10}
                  fontWeight="$bold"
                  textAlign="center"
                  numberOfLines={2}
                >
                  Marka{'\n'}Geçmişim
                </Text>
              </VStack>
            </Box>
          </HStack>

          {/* Tabs */}
          <HStack justifyContent="space-around">
            {mock_survey_tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.name)}
                flex={1}
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    color={activeTab === tab.name ? (isDark ? '#FFFFFF' : '#000000') : '#8C8C8C'}
                    fontSize={14}
                    fontWeight="$bold"
                  >
                    {tab.name}
                  </Text>
                  {activeTab === tab.name && (
                    <Box
                      width="100%"
                      height={2}
                      bg="#000000"
                      borderRadius={1}
                    />
                  )}
                </VStack>
              </Pressable>
            ))}
          </HStack>


          {/* Survey Cards */}
          <VStack>
            {mock_surveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onPress={() => console.log('Survey action:', survey.status)}
              />
            ))}
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
};

export default SurveyScreen;
