import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Pressable,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

export const SubscriptionTab: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Mock subscription data
  const subscriptionData = {
    planName: 'Premium Plan Name',
    renewalDate: '12.11.2025',
  };

  const benefits = [
    'Avantajları şöyle böyle şu kadar',
    'Avantajları şöyle böyle şu kadar',
    'Avantajları şöyle böyle şu kadar',
    'Avantajları şöyle böyle şu kadar',
    'Avantajları şöyle böyle şu kadar',
  ];

  const handleManage = () => {
    console.log('Manage subscription');
  };

  const handleViewOtherPlans = () => {
    console.log('View other premium plans');
  };

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0 }}>
      <VStack space="lg" pt="$4">
        {/* My Subscriptions Section */}
        <VStack space="md">
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
            px="$2"
          >
            My Subscriptions
          </Text>

          <Box
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            borderWidth={1}
            borderColor="#B9B9B9"
            borderRadius={10}
            p="$4"
          >
            <HStack alignItems="center" justifyContent="space-between">
              <VStack flex={1} space="xs">
                <Text
                  fontSize={11}
                  fontWeight="$bold"
                  color={isDark ? '#FFFFFF' : '#000000'}
                >
                  {subscriptionData.planName}
                </Text>
                <Text
                  fontSize={10}
                  fontWeight="$normal"
                  color="#B9B9B9"
                >
                  Will renew on {subscriptionData.renewalDate}.
                </Text>
              </VStack>
              <Button
                px="$4"
                py="$2"
                variant="outline"
                onPress={handleManage}
                borderColor="#B9B9B9"
                bg="transparent"
                ml="$3"
              >
                <ButtonText
                  fontSize={10}
                  fontWeight="$medium"
                  color={isDark ? '#FFFFFF' : '#000000'}
                >
                  Manage
                </ButtonText>
              </Button>
            </HStack>
          </Box>
        </VStack>

        {/* My Plan Benefits Section */}
        <VStack space="md">
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
            px="$2"
          >
            My Plan Benefits
          </Text>

          <Box
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            borderWidth={1}
            borderColor="#B9B9B9"
            borderRadius={10}
            p="$4"
          >
            <VStack space="sm">
              <Text
                fontSize={11}
                fontWeight="$bold"
                color={isDark ? '#FFFFFF' : '#000000'}
                mb="$2"
              >
                Benefits include:
              </Text>
              {benefits.map((benefit, index) => (
                <HStack key={index} alignItems="flex-start" space="sm">
                  <Text
                    fontSize={10}
                    fontWeight="$normal"
                    color={isDark ? '#FFFFFF' : '#000000'}
                    mt="$1"
                  >
                    •
                  </Text>
                  <Text
                    fontSize={10}
                    fontWeight="$normal"
                    color={isDark ? '#FFFFFF' : '#000000'}
                    flex={1}
                  >
                    {benefit}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </VStack>

        {/* View Other Premium Plans Section */}
        <Pressable onPress={handleViewOtherPlans}>
          <Box
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            borderWidth={1}
            borderColor="#B9B9B9"
            borderRadius={10}
            p="$4"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text
              fontSize={11}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              View Other Premium Plans
            </Text>
            <Feather
              name="chevron-right"
              size={18}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Box>
        </Pressable>
      </VStack>
    </ScrollView>
  );
};

export default SubscriptionTab;
