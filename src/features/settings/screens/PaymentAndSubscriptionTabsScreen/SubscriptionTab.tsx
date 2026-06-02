import React, { useMemo } from 'react';
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
import { usePaymentDashboard, useSubscriptionPlans } from '../../api/hooks';
import { useTranslation } from 'react-i18next';

const formatBillingDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const SubscriptionTab: React.FC = () => {
  const { t } = useTranslation('settings');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const { data: dashboard, isLoading: isLoadingDashboard } = usePaymentDashboard();
  const { data: subscriptionPlans, isLoading: isLoadingPlans } = useSubscriptionPlans();

  const activeSubscription = dashboard?.active_subscription ?? null;
  const isLoading = isLoadingDashboard || isLoadingPlans;

  const subscriptionData = useMemo(() => {
    if (!activeSubscription)
      return { planName: t('tabs.subscriptionTab.noActiveSubscription'), renewalDate: '', status: null as string | null };
    return {
      planName: activeSubscription.plan_name,
      renewalDate: formatBillingDate(activeSubscription.next_billing_date),
      status: activeSubscription.status,
    };
  }, [activeSubscription, t]);

  const benefits = useMemo(
    () =>
      activeSubscription?.benefits?.length
        ? activeSubscription.benefits
        :         [
            t('tabs.subscriptionTab.defaultBenefits.unlimitedAccess'),
            t('tabs.subscriptionTab.defaultBenefits.prioritySupport'),
            t('tabs.subscriptionTab.defaultBenefits.advancedAnalytics'),
            t('tabs.subscriptionTab.defaultBenefits.adFree'),
          ],
    [activeSubscription, t]
  );

  const handleManage = () => {
    // Abonelik yönetimi (gelecekte plan değiştirme / iptal eklenebilir)
  };

  const handleViewOtherPlans = () => {
    // Plan listesi modal veya ekran (subscriptionPlans kullanılabilir)
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" py="$10">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }

  return (
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 0 }}
    >
      <VStack space="lg" pt="$4">
        {/* My Subscriptions Section */}
        <VStack space="md">
          <Text
            fontSize="$sm"
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
            px="$2"
          >
            {t('tabs.subscriptionTab.mySubscriptions')}
          </Text>

          <Box
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            borderWidth={1}
            borderColor={isDark ? '#555555' : '#B9B9B9'}
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
                  <Text fontSize="$xs" fontWeight="$normal" color="#B9B9B9">
                    {t('tabs.subscriptionTab.nextBilling', { date: subscriptionData.renewalDate })}
                  </Text>
                )}
                {subscriptionData.status && (
                  <Text fontSize="$xs" fontWeight="$normal" color="#B9B9B9">
                    {t('tabs.subscriptionTab.status', { status: subscriptionData.status })}
                  </Text>
                )}
              </VStack>
              {activeSubscription && (
                <Button
                  px="$4"
                  py="$2"
                  variant="outline"
                  onPress={handleManage}
                  borderColor={isDark ? '#555555' : '#B9B9B9'}
                  bg="transparent"
                  ml="$3"
                >
                  <ButtonText
                    fontSize="$xs"
                    fontWeight="$medium"
                    color={isDark ? '#FFFFFF' : '#000000'}
                  >
                    {t('tabs.subscriptionTab.manage')}
                  </ButtonText>
                </Button>
              )}
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
            {t('tabs.subscriptionTab.planBenefits')}
          </Text>

          <Box
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            borderWidth={1}
            borderColor={isDark ? '#555555' : '#B9B9B9'}
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
                {t('tabs.subscriptionTab.benefits')}
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
            borderColor={isDark ? '#555555' : '#B9B9B9'}
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
              {t('tabs.subscriptionTab.otherPremiumPlans', { count: subscriptionPlans?.length ?? 0 })}
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
