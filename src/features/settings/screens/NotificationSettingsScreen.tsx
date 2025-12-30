import React, { useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Box,
    VStack,
    HStack,
    Text,
    ScrollView,
    Switch,
    Input,
    InputField,
    Spinner,
    useToast,
    Toast,
    ToastTitle,
    ToastDescription,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { useNotificationSettings, useUpdateNotificationSettings } from '../api/hooks';
import { NotificationCode } from '../types';

export const NotificationSettingsScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation();
    const toast = useToast();

    // API hooks
    const { data: notificationSettings, isLoading, error } = useNotificationSettings();
    const updateMutation = useUpdateNotificationSettings();

    // Local state for UI
    const [localSettings, setLocalSettings] = useState<Record<number, boolean>>({});

    // Initialize local state from API data
    useEffect(() => {
        if (notificationSettings) {
            const settingsMap: Record<number, boolean> = {};
            notificationSettings.forEach((setting) => {
                settingsMap[setting.notificationCode] = setting.value;
            });
            setLocalSettings(settingsMap);
        }
    }, [notificationSettings]);

    // Get setting value by code
    const getSettingValue = (code: NotificationCode): boolean => {
        return localSettings[code] ?? false;
    };

    // Update setting value
    const updateSetting = async (code: NotificationCode, value: boolean) => {
        // Optimistic update
        setLocalSettings((prev) => ({ ...prev, [code]: value }));

        // Prepare all settings for API
        const allSettings = [
            { notificationCode: NotificationCode.EMAIL, value: localSettings[NotificationCode.EMAIL] ?? false },
            { notificationCode: NotificationCode.PUSH, value: localSettings[NotificationCode.PUSH] ?? false },
            { notificationCode: NotificationCode.IN_APP, value: localSettings[NotificationCode.IN_APP] ?? false },
        ];
        
        // Update the changed setting
        const settingIndex = allSettings.findIndex((s) => s.notificationCode === code);
        if (settingIndex !== -1) {
            allSettings[settingIndex].value = value;
        }

        try {
            await updateMutation.mutateAsync({ settings: allSettings });
            toast.show({
                placement: 'top',
                render: ({ id }) => (
                    <Box maxWidth="90%" alignSelf="center" px="$4">
                        <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                            <ToastTitle>Başarılı</ToastTitle>
                            <ToastDescription>Bildirim ayarları güncellendi</ToastDescription>
                        </Toast>
                    </Box>
                ),
            });
        } catch (error: any) {
            // Revert optimistic update on error
            setLocalSettings((prev) => ({ ...prev, [code]: !value }));
            const errorMessage = error?.response?.data?.message || error?.message || 'Bildirim ayarları güncellenirken bir hata oluştu';
            toast.show({
                placement: 'top',
                render: ({ id }) => (
                    <Box maxWidth="90%" alignSelf="center" px="$4">
                        <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                            <ToastTitle>Hata</ToastTitle>
                            <ToastDescription>{errorMessage}</ToastDescription>
                        </Toast>
                    </Box>
                ),
            });
        }
    };

    // Calculate "All Notifications" state
    const allNotifications = useMemo(() => {
        return (
            getSettingValue(NotificationCode.EMAIL) &&
            getSettingValue(NotificationCode.PUSH) &&
            getSettingValue(NotificationCode.IN_APP)
        );
    }, [localSettings]);

    // Toggle all notifications
    const handleAllNotificationsToggle = async (enabled: boolean) => {
        await Promise.all([
            updateSetting(NotificationCode.EMAIL, enabled),
            updateSetting(NotificationCode.PUSH, enabled),
            updateSetting(NotificationCode.IN_APP, enabled),
        ]);
    };

    // Notification setting items for display
    const notificationItems = [
        {
            id: 'email',
            code: NotificationCode.EMAIL,
            title: 'Email Notifications',
            subtitle: 'Receive notifications via email',
        },
        {
            id: 'push',
            code: NotificationCode.PUSH,
            title: 'Push Notifications',
            subtitle: 'Receive push notifications on your device',
        },
        {
            id: 'in-app',
            code: NotificationCode.IN_APP,
            title: 'In-App Notifications',
            subtitle: 'Receive notifications within the app',
        },
    ];

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <Box
                flex={1}
                bg={isDark ? '$backgroundDark950' : '#FFF'}
        >
            <Header
                title="Notification Settings"
                showBackButton
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView flex={1} px="$4" py="$2">
                {isLoading ? (
                    <Box flex={1} justifyContent="center" alignItems="center" py="$10">
                        <Spinner size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                    </Box>
                ) : error ? (
                    <Box flex={1} justifyContent="center" alignItems="center" py="$10" px="$4">
                        <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                            {error.message || 'Bildirim ayarları yüklenirken bir hata oluştu'}
                        </Text>
                    </Box>
                ) : (
                <VStack space="lg">

                    {/* Push Notifications Section */}
                    <VStack space="sm">
                        <Text
                            fontSize={11}
                            fontWeight="$medium"
                            color="#B9B9B9"
                            px="$2"
                        >
                            Push Notifications
                        </Text>

                        <Box
                            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                            borderRadius={10}
                            px="$2"
                        >
                            <HStack justifyContent="space-between" alignItems="center">
                                <VStack space="xs">
                                    <Text
                                        fontSize={11}
                                        fontWeight="$bold"
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                    >
                                        All Notifications
                                    </Text>
                                    <Text
                                        fontSize={10}
                                        fontWeight="$medium"
                                        color="#B9B9B9"
                                    >
                                        Pause Notifications Temporarily
                                    </Text>
                                </VStack>

                                <Switch
                                    value={allNotifications}
                                    onValueChange={handleAllNotificationsToggle}
                                    size="sm"
                                    trackColor={{ false: '#d4d4d4', true: '#525252' }}
                                    thumbColor="#fafafa"
                                    ios_backgroundColor="#d4d4d4"
                                />
                            </HStack>
                        </Box>
                    </VStack>

                    {/* Divider */}
                    <Box
                        height={1}
                        bg="#D9D9D9"
                    />

                    {/* Individual Notification Settings */}
                    <VStack space="xs">
                        {notificationItems.map((item) => (
                            <Box
                                key={item.id}
                                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                                borderRadius={10}
                                px="$2"
                                py="$1"
                            >
                                <HStack justifyContent="space-between" alignItems="center">
                                    <VStack flex={1} space="xs">
                                        <Text
                                            fontSize={11}
                                            fontWeight="$semibold"
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                        >
                                            {item.title}
                                        </Text>
                                        {item.subtitle && (
                                            <Text
                                                fontSize={9}
                                                fontWeight="$normal"
                                                color="#B9B9B9"
                                            >
                                                {item.subtitle}
                                            </Text>
                                        )}
                                    </VStack>

                                    <Switch
                                        value={getSettingValue(item.code)}
                                        onValueChange={(value) => updateSetting(item.code, value)}
                                        disabled={updateMutation.isPending}
                                        trackColor={{
                                            false: isDark ? '#333333' : '#E5E5E5',
                                            true: '#34C759',
                                        }}
                                        thumbColor={getSettingValue(item.code) ? '#FFFFFF' : '#FFFFFF'}
                                        style={{
                                            transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
                                        }}
                                    />
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                </VStack>
                )}
            </ScrollView>
            </Box>
        </SafeAreaView>
    );
};

export default NotificationSettingsScreen;
