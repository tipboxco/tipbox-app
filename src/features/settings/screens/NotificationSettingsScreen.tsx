import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
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
    Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { useNotificationSettings, useUpdateNotificationSettings } from '../api/hooks';
import { NotificationCode } from '../types';
import { useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';

interface NotificationItem {
    id: string;
    code: NotificationCode;
    title: string;
}

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
    const [searchQuery, setSearchQuery] = useState('');

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

    // Notification items based on the design
    // FIX: Move notificationItems before useMemo to prevent "Cannot read property 'every' of undefined" error
    const notificationItems: NotificationItem[] = [
        {
            id: 'trust',
            code: NotificationCode.PUSH, // Using PUSH as placeholder - adjust based on actual API codes
            title: 'Trust - Truster Notifications',
        },
        {
            id: 'support',
            code: NotificationCode.IN_APP, // Using IN_APP as placeholder
            title: '1-on-1 Support Notifications',
        },
        {
            id: 'message',
            code: NotificationCode.EMAIL, // Using EMAIL as placeholder
            title: 'Message Notifications',
        },
        {
            id: 'collection',
            code: NotificationCode.PUSH, // Using PUSH as placeholder
            title: 'Collection Notifications',
        },
        {
            id: 'post',
            code: NotificationCode.IN_APP, // Using IN_APP as placeholder
            title: 'Post Notifications',
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

    // Filter notification items based on search query
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return notificationItems;
        const query = searchQuery.toLowerCase();
        return notificationItems.filter((item) =>
            item.title.toLowerCase().includes(query)
        );
    }, [searchQuery, notificationItems]);

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <Box
                flex={1}
                bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
            >
                <Header
                    title="Notification Settings"
                    showBackButton
                    onBackPress={() => navigation.goBack()}
                />

                {/* Search Bar */}
                <Box px="$4" pt="$4" pb="$2">
                    <Box
                        borderWidth={1}
                        borderColor="#B9B9B9"
                        borderRadius={10}
                        px="$4"
                        py="$2"
                        bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                    >
                        <HStack alignItems="center" space="sm">
                            <Feather 
                                name="search" 
                                size={18} 
                                color={isDark ? '#CCCCCC' : '#666666'} 
                            />
                            <Input borderWidth={0} bg="transparent" flex={1}>
                                <InputField
                                    placeholder="Select product group or search product name"
                                    placeholderTextColor="#B9B9B9"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={11}
                                />
                            </Input>
                        </HStack>
                    </Box>
                </Box>

                <ScrollView flex={1} px="$4" py="$2">
                    {isLoading ? (
                        <Box flex={1} justifyContent="center" alignItems="center" py="$10">
                            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        </Box>
                    ) : error ? (
                        <Box flex={1} justifyContent="center" alignItems="center" py="$10" px="$4">
                            <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                                {error.message || 'Bildirim ayarları yüklenirken bir hata oluştu'}
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
                                Push Notifications
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
                                            fontSize={11}
                                            fontWeight="$bold"
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                        >
                                            All Notifications
                                        </Text>
                                        <Text
                                            fontSize={10}
                                            fontWeight="$normal"
                                            color="#B9B9B9"
                                        >
                                            Pause Notifications Temporarily
                                        </Text>
                                    </VStack>

                                    <Switch
                                        value={allNotifications}
                                        onValueChange={handleAllNotificationsToggle}
                                        disabled={updateMutation.isPending}
                                        trackColor={{
                                            false: isDark ? '#333333' : '#E5E5E5',
                                            true: '#34C759',
                                        }}
                                        thumbColor="#FFFFFF"
                                    />
                                </HStack>
                            </Box>

                            {/* Individual Notification Items */}
                            {filteredItems.map((item) => (
                                <Box
                                    key={item.id}
                                    bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                                    borderRadius={10}
                                    px="$4"
                                    py="$3"
                                >
                                    <HStack justifyContent="space-between" alignItems="center">
                                        <Text
                                            fontSize={11}
                                            fontWeight="$semibold"
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                        >
                                            {item.title}
                                        </Text>

                                        <Switch
                                            value={getSettingValue(item.code)}
                                            onValueChange={(value) => updateSetting(item.code, value)}
                                            disabled={updateMutation.isPending}
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
    );
};

export default NotificationSettingsScreen;
