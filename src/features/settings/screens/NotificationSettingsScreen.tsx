import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    ScrollView,
    Pressable,
    Switch,
    Input,
    InputField,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';

interface NotificationSetting {
    id: string;
    title: string;
    subtitle?: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const NotificationSettingsScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation();

    // Notification settings state
    const [allNotifications, setAllNotifications] = useState(true);
    const [trustNotifications, setTrustNotifications] = useState(true);
    const [supportNotifications, setSupportNotifications] = useState(true);
    const [messageNotifications, setMessageNotifications] = useState(true);
    const [collectionNotifications, setCollectionNotifications] = useState(true);
    const [postNotifications, setPostNotifications] = useState(true);

    const notificationSettings: NotificationSetting[] = [
        {
            id: 'trust',
            title: 'Trust - Truster Notifications',
            enabled: trustNotifications,
            onToggle: setTrustNotifications,
        },
        {
            id: 'support',
            title: '1-on-1 Support Notifications',
            enabled: supportNotifications,
            onToggle: setSupportNotifications,
        },
        {
            id: 'message',
            title: 'Message Notifications',
            enabled: messageNotifications,
            onToggle: setMessageNotifications,
        },
        {
            id: 'collection',
            title: 'Collection Notifications',
            enabled: collectionNotifications,
            onToggle: setCollectionNotifications,
        },
        {
            id: 'post',
            title: 'Post Notifications',
            enabled: postNotifications,
            onToggle: setPostNotifications,
        },
    ];

    const handleAllNotificationsToggle = (enabled: boolean) => {
        setAllNotifications(enabled);
        // Tüm alt kategorileri de aynı duruma getir
        setTrustNotifications(enabled);
        setSupportNotifications(enabled);
        setMessageNotifications(enabled);
        setCollectionNotifications(enabled);
        setPostNotifications(enabled);
    };

    return (
        <Box
            flex={1}
            bg={isDark ? '$backgroundDark950' : '#FFF'}
        >
            <Header
                title="Notification Settings"
                showBackButton
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView flex={1} px="$4" py="$6">
                <VStack space="lg">
                    {/* Search Bar */}
                    <Box
                        bg="#F2F2F2"
                        borderRadius={20}
                        px="$4"
                        py="$1"
                        flexDirection="row"
                        alignItems="center"
                    >
                        <Feather
                            name="search"
                            size={20}
                            color="#8C8C8C"
                        />
                        <Input
                            flex={1}
                            borderWidth={0}
                            bg="transparent"
                            ml="$2"
                        >
                            <InputField
                                placeholder="Ürün Grubu seçin veya ürün adı arayın"
                                placeholderTextColor="#B9B9B9"
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={9}
                            />
                        </Input>
                    </Box>

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
                                    trackColor={{
                                        false: isDark ? '#333333' : '#E5E5E5',
                                        true: '#34C759',
                                    }}
                                    thumbColor={allNotifications ? '#FFFFFF' : '#FFFFFF'}
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
                        {notificationSettings.map((setting, index) => (
                            <Box
                                key={setting.id}
                                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                                borderRadius={10}
                                px="$2"
                                py="$1"
                            >
                                <HStack justifyContent="space-between" alignItems="center">
                                    <Text
                                        fontSize={11}
                                        fontWeight="$semibold"
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                    >
                                        {setting.title}
                                    </Text>

                                    <Switch
                                        value={setting.enabled}
                                        onValueChange={setting.onToggle}
                                        trackColor={{
                                            false: isDark ? '#333333' : '#E5E5E5',
                                            true: '#34C759',
                                        }}
                                        thumbColor={setting.enabled ? '#FFFFFF' : '#FFFFFF'}
                                    />
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                </VStack>
            </ScrollView>
        </Box>
    );
};

export default NotificationSettingsScreen;
