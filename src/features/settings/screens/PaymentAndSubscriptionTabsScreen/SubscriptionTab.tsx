import React from 'react';
import { ActivityIndicator } from 'react-native';
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
import { useCurrentSubscription, useSubscriptionPlans } from '../../api/hooks';

export const SubscriptionTab: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // API hooks
  const { data: subscription, isLoading: isLoadingSubscription, error: subscriptionError } = useCurrentSubscription();
  const { data: subscriptionPlans, isLoading: isLoadingPlans, error: plansError } = useSubscriptionPlans();

  const isLoading = isLoadingSubscription || isLoadingPlans;

  // Use subscription data from API or fallback to default
  const subscriptionData = subscription ? {
    planName: subscription.planName,
    renewalDate: subscription.renewalDate,
  } : {
    planName: 'No Active Subscription',
    renewalDate: '',
  };

  // Use benefits from subscription or fallback to default
  const benefits = subscription?.benefits || [
    'Unlimited access to premium features',
    'Priority customer support',
    'Advanced analytics and insights',
    'Exclusive content and early access',
    'Ad-free experience',
  ];

  const handleManage = () => {
    // TODO: Implement manage subscription functionality
    console.log('Manage subscription');
  };

  const handleViewOtherPlans = () => {
    // TODO: Navigate to subscription plans screen or show plans modal
    console.log('View other premium plans', subscriptionPlans);
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" py="$10">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0 }}>
      <VStack space="lg" pt="$4">
        {/* My Subscriptions Section */}
        <VStack space="md">
          <Text
            fontSize="$sm"
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
                  fontSize="$sm"
                  fontWeight="$bold"
                  color={isDark ? '#FFFFFF' : '#000000'}
                >
                  {subscriptionData.planName}
                </Text>
                {subscriptionData.renewalDate && (
                  <Text
                    fontSize="$xs"
                    fontWeight="$normal"
                    color="#B9B9B9"
                  >
                    Will renew on {subscriptionData.renewalDate}.
                  </Text>
                )}
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
                  fontSize="$xs"
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
            fontSize="$sm"
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
                fontSize="$sm"
                fontWeight="$bold"
                color={isDark ? '#FFFFFF' : '#000000'}
                mb="$2"
              >
                Benefits include:
              </Text>
              {benefits.map((benefit, index) => (
                <HStack key={index} alignItems="flex-start" space="sm">
                  <Text
                    fontSize="$xs"
                    fontWeight="$normal"
                    color={isDark ? '#FFFFFF' : '#000000'}
                    mt="$1"
                  >
                    •
                  </Text>
                  <Text
                    fontSize="$xs"
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
              fontSize="$sm"
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
