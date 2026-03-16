import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Box,
    VStack,
    HStack,
    Text,
    ScrollView,
    Switch,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { useNotificationSettings, useUpdateNotificationSettings } from '../api/hooks';
import { NotificationCode } from '../types';
import { useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useTranslation } from '@/src/hooks/useTranslation';

interface NotificationItem {
    id: string;
    code: NotificationCode;
    title: string;
}

export const NotificationSettingsScreen = () => {
    const { t } = useTranslation('settings');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation();
    const toast = useToast();
    const insets = useSafeAreaInsets();
    const backgroundColor = '#FFFFFF';

    // API hooks
    const { data: notificationSettings, isLoading, error } = useNotificationSettings();
    const updateMutation = useUpdateNotificationSettings();

    // Local state for UI
    const [localSettings, setLocalSettings] = useState<Record<number, boolean>>({});

    // Initialize local state from API data
    useEffect(() => {
        if (notificationSettings && Array.isArray(notificationSettings)) {
            const settingsMap: Record<number, boolean> = {};
            notificationSettings.forEach((setting) => {
                settingsMap[setting.notificationCode] = setting.value;
            });
            setLocalSettings(settingsMap);
        }
    }, [notificationSettings]);

    // Get setting value by code - API'den veri gelmeden önce default açık
    const getSettingValue = (code: NotificationCode): boolean => {
        return localSettings[code] ?? true;
    };

    // Update setting value
    const updateSetting = async (code: NotificationCode, value: boolean) => {
        // Yeni settings map'ini ÖNCE oluştur (stale closure sorununu önler)
        const newLocalSettings = { ...localSettings, [code]: value };

        // Optimistic update
        setLocalSettings(newLocalSettings);

        // Prepare all settings for API - güncel değerlerden oluştur
        const allSettings = [
            { notificationCode: NotificationCode.EMAIL, value: newLocalSettings[NotificationCode.EMAIL] ?? true },
            { notificationCode: NotificationCode.PUSH, value: newLocalSettings[NotificationCode.PUSH] ?? true },
            { notificationCode: NotificationCode.IN_APP, value: newLocalSettings[NotificationCode.IN_APP] ?? true },
            { notificationCode: NotificationCode.DEPOSIT, value: newLocalSettings[NotificationCode.DEPOSIT] ?? true },
            { notificationCode: NotificationCode.COLLECTION, value: newLocalSettings[NotificationCode.COLLECTION] ?? true },
            { notificationCode: NotificationCode.POST, value: newLocalSettings[NotificationCode.POST] ?? true },
        ];

        try {
            await updateMutation.mutateAsync({ settings: allSettings });
        } catch (error: any) {
            // Revert optimistic update on error
            setLocalSettings((prev) => ({ ...prev, [code]: !value }));
            const errorMessage = error?.response?.data?.message || error?.message || t('notificationSettings.updateError');
            toast.show({
                placement: 'top',
                render: ({ id }) => (
                    <Box maxWidth="90%" alignSelf="center" px="$4">
                        <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                            <ToastTitle>{t('common:labels.error')}</ToastTitle>
                            <ToastDescription>{errorMessage}</ToastDescription>
                        </Toast>
                    </Box>
                ),
            });
        }
    };

    // Notification items - her biri benzersiz notification code ile izole çalışır
    const notificationItems: NotificationItem[] = [
        {
            id: 'trust',
            code: NotificationCode.PUSH,
            title: t('notificationSettings.trustTrusterNotifications'),
        },
        {
            id: 'support',
            code: NotificationCode.IN_APP,
            title: t('notificationSettings.oneononeNotifications'),
        },
        {
            id: 'message',
            code: NotificationCode.EMAIL,
            title: t('notificationSettings.messageNotifications'),
        },
        {
            id: 'collection',
            code: NotificationCode.COLLECTION,
            title: t('notificationSettings.collectionNotifications'),
        },
        {
            id: 'post',
            code: NotificationCode.POST,
            title: t('notificationSettings.postNotifications'),
        },
        {
            id: 'deposit',
            code: NotificationCode.DEPOSIT,
            title: t('notificationSettings.depositNotifications'),
        },
    ];

    // Calculate "All Notifications" state - All individual notifications should be enabled
    // FIX: Use notificationItems after it's defined, and add safety check
    const allNotifications = useMemo(() => {
        if (!Array.isArray(notificationItems) || notificationItems.length === 0) {
            return false;
        }
        return notificationItems.every((item) => getSettingValue(item.code));
    }, [localSettings, notificationItems]);

    // Toggle all notifications
    const handleAllNotificationsToggle = async (enabled: boolean) => {
        if (!Array.isArray(notificationItems) || notificationItems.length === 0) {
            return;
        }
        await Promise.all(
            notificationItems.map((item) => updateSetting(item.code, enabled))
        );
    };


    return (
        <View style={{ flex: 1, backgroundColor }}>
            {/* Top safe area */}
            <View 
                style={{ 
                    height: insets.top, 
                    backgroundColor,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1,
                }} 
            />
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <Box
                    flex={1}
                    bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
                >
                <Header
                    title={t('notificationSettings.title')}
                    maxTitleLength={25}
                    showBackButton
                    onBackPress={() => navigation.goBack()}
                />

                <ScrollView flex={1} px="$4" pt="$4" pb="$2">
                    {isLoading ? (
                        <Box flex={1} justifyContent="center" alignItems="center" py="$10">
                            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        </Box>
                    ) : error ? (
                        <Box flex={1} justifyContent="center" alignItems="center" py="$10" px="$4">
                            <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                                {error.message || t('notificationSettings.loadError')}
                            </Text>
                        </Box>
                    ) : (
                        <VStack space="md">
                            {/* Push Notifications Section Header */}
                            <Text
                                fontSize={11}
                                fontWeight="$medium"
                                color="#B9B9B9"
                                px="$2"
                                pt="$2"
                            >
                                {t('notificationSettings.pushNotifications')}
                            </Text>

                            {/* All Notifications */}
                            <Box
                                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                                borderRadius={10}
                                px="$4"
                                py="$3"
                            >
                                <HStack justifyContent="space-between" alignItems="center">
                                    <VStack space="xs" flex={1}>
                                        <Text
                                            fontSize="$sm"
                                            fontWeight="$bold"
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                        >
                                            {t('notificationSettings.allNotifications')}
                                        </Text>
                                        <Text
                                            fontSize="$xs"
                                            fontWeight="$normal"
                                            color="#B9B9B9"
                                        >
                                            {t('notificationSettings.pauseNotifications')}
                                        </Text>
                                    </VStack>

                                    <Switch
                                        value={allNotifications}
                                        onValueChange={handleAllNotificationsToggle}
                                        trackColor={{
                                            false: isDark ? '#333333' : '#E5E5E5',
                                            true: '#34C759',
                                        }}
                                        thumbColor="#FFFFFF"
                                    />
                                </HStack>
                            </Box>

                            {/* Individual Notification Items */}
                            {notificationItems.map((item) => (
                                <Box
                                    key={item.id}
                                    bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                                    borderRadius={10}
                                    px="$4"
                                    py="$3"
                                >
                                    <HStack justifyContent="space-between" alignItems="center">
                                        <Text
                                            fontSize="$sm"
                                            fontWeight="$semibold"
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                        >
                                            {item.title}
                                        </Text>

                                        <Switch
                                            value={getSettingValue(item.code)}
                                            onValueChange={(value) => updateSetting(item.code, value)}
                                            trackColor={{
                                                false: isDark ? '#333333' : '#E5E5E5',
                                                true: '#34C759',
                                            }}
                                            thumbColor="#FFFFFF"
                                        />
                                    </HStack>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </ScrollView>
            </Box>
            </SafeAreaView>
            {/* Bottom safe area */}
            <View 
                style={{ 
                    height: insets.bottom, 
                    backgroundColor,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1,
                }} 
            />
        </View>
    );
};

export default NotificationSettingsScreen;
