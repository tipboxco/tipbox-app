import React, { useState, useCallback } from 'react';
import {
  VStack,
  HStack,
  Text,
  Pressable,
  Box,
  Input,
  InputField,
  Image,
} from '@gluestack-ui/themed';
import { ActivityIndicator, Keyboard, StyleSheet, useWindowDimensions, View, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useTrustList } from '@/src/features/profile/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { useSharePostToDm } from '@/src/features/interactions/api/hooks';
import { showCustomToast } from '@/src/components/CustomToast';
import type { TrustUser } from '@/src/features/profile/types';

const GRID_COLUMNS = 3;
const AVATAR_SIZE = 60;
const SEARCH_DEBOUNCE_MS = 300;

interface TrustUserGridItemProps {
  trustUser: TrustUser;
  selected: boolean;
  onToggle: (userId: string) => void;
  itemWidth: number;
  isDark: boolean;
}

const TrustUserGridItem = React.memo<TrustUserGridItemProps>(
  ({ trustUser, selected, onToggle, itemWidth, isDark }) => (
    <Pressable
      onPress={() => onToggle(trustUser.id)}
      style={[styles.gridItem, { width: itemWidth }]}
    >
      <Box
        w={AVATAR_SIZE}
        h={AVATAR_SIZE}
        rounded="$full"
        overflow="hidden"
        borderWidth={2}
        borderColor={selected ? '#E11D48' : 'transparent'}
        bg={isDark ? '$backgroundDark700' : '#E5E7EB'}
        position="relative"
      >
        <Image
          source={toImageSource(trustUser.avatar) || DEFAULT_USER_AVATAR}
          alt={trustUser.name}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </Box>
      <Text
        mt="$1.5"
        fontSize={12}
        fontWeight="$medium"
        color={isDark ? '$textDark50' : '#111827'}
        numberOfLines={1}
        textAlign="center"
        maxWidth={itemWidth}
      >
        {trustUser.name}
      </Text>
    </Pressable>
  )
);

TrustUserGridItem.displayName = 'TrustUserGridItem';

export interface ShareToTrustedBottomSheetProps {
  postId: string;
  postContent?: string;
  postAuthorName?: string;
  onShareSuccess?: () => void;
  onClose?: () => void;
}

export const ShareToTrustedBottomSheet: React.FC<ShareToTrustedBottomSheetProps> = ({
  postId,
  postContent,
  postAuthorName,
  onShareSuccess,
  onClose,
}) => {
  const { t } = useTranslation('post');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const toast = useToast();
  const user = useAppStore((state) => state.user);
  const insets = useSafeAreaInsets();
  const { snapToIndex } = useGlobalBottomSheet();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Track keyboard visibility and auto-snap bottom sheet
  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardWillShow',
      () => {
        setIsKeyboardVisible(true);
        snapToIndex(1); // Snap to 90%
      }
    );
    const hideSubscription = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setIsKeyboardVisible(false);
        snapToIndex(0); // Snap back to 65%
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [snapToIndex]);

  // Component unmount olduğunda keyboard'u anında kapat
  React.useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: trustList = [], isLoading: isLoadingTrustList } = useTrustList(
    user?.id,
    debouncedSearch || undefined
  );

  const sendSharedPostMutation = useSharePostToDm();
  const { width: windowWidth } = useWindowDimensions();
  const gap = 16;
  const paddingH = 20;
  const itemWidth = (windowWidth - paddingH * 2 - gap * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  const toggleUser = useCallback((userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const handleSend = useCallback(async () => {
    Keyboard.dismiss();
    if (isSending || selectedUserIds.size === 0) return;

    const recipients = Array.from(selectedUserIds);
    setIsSending(true);
    try {
      await Promise.all(
        recipients.map((toUserId) =>
          sendSharedPostMutation.mutateAsync({
            postId,
            toUserId,
            message: message.trim() || undefined,
          })
        )
      );
      onClose?.();
      showCustomToast(toast, {
        title: t('share.success.title'),
        description: t('share.success.message'),
        action: 'success',
      });
      onShareSuccess?.();
    } catch (err: any) {
      console.error('[ShareToTrustedBottomSheet] ❌ Share Error Details:', {
        message: err?.message,
        isAxiosError: err?.isAxiosError,
        code: err?.code,
        config: {
          baseURL: err?.config?.baseURL,
          url: err?.config?.url,
          method: err?.config?.method,
          fullURL: err?.config?.baseURL ? `${err?.config?.baseURL}${err?.config?.url}` : undefined,
          headers: err?.config?.headers,
          data: err?.config?.data,
        },
        request: {
          url: err?.request?._url || err?.request?.responseURL,
          method: err?.request?._method,
        },
        response: {
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          headers: err?.response?.headers,
          data: typeof err?.response?.data === 'string'
            ? err?.response?.data.substring(0, 500)
            : err?.response?.data,
        },
        postId,
        recipientCount: recipients.length,
        recipients: recipients.map(id => id.substring(0, 10)),
      });
    } finally {
      setIsSending(false);
    }
  }, [
    postId,
    postAuthorName,
    message,
    selectedUserIds,
    isSending,
    sendSharedPostMutation,
    onClose,
    onShareSuccess,
    toast,
    t,
  ]);

  const canSend = selectedUserIds.size > 0;

  const searchBarBg = isDark ? '#2A2A2A' : '#F2F2F2';
  const searchPlaceholderColor = isDark ? '#B9B9B9' : '#B9B9B9';
  const searchIconColor = isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)';
  const messagePlaceholderColor = isDark ? '#9CA3AF' : '#6B7280';
  const sendButtonBg = isDark ? '#374151' : '#E5E7EB';
  const sendButtonActiveBg = '#C2E607'; // Figma 6390-61042: lime green
  const sendTextColor = canSend && !isSending ? '#111827' : (isDark ? '#9CA3AF' : '#6B7280');

  const gridTotalWidth = GRID_COLUMNS * itemWidth + gap * (GRID_COLUMNS - 1);

  return (
    <VStack bg={isDark ? '$backgroundDark900' : '#FFFFFF'} space="sm">
      {/* Search - ExploreScreen ile aynı yapı: HStack + icon + Input */}
      <Box px={paddingH} pb="$2" pt="$1">
        <HStack
          alignItems="center"
          bg={searchBarBg}
          borderWidth={1}
          borderColor="#E9E9E9"
          borderRadius={20}
          px={14}
          space="sm"
        >
          <Feather name="search" size={24} color={searchIconColor} />
          <Input flex={1} borderWidth={0} bg="transparent">
            <InputField
              placeholder={t('share.placeholders.search')}
              placeholderTextColor={searchPlaceholderColor}
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$xs"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>
        </HStack>
      </Box>

      {/* Trust list */}
      <ScrollView
        style={{ maxHeight: 250 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {isLoadingTrustList ? (
          <VStack alignItems="center" justifyContent="center" py="$12">
            <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
            <Text mt="$3" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
              {t('share.loading')}
            </Text>
          </VStack>
        ) : trustList.length === 0 ? (
          <VStack alignItems="center" py="$12">
            <Text fontSize="$md" fontWeight="$semibold" color="$textLight500" $dark-color="$textDark400">
              {debouncedSearch ? t('share.noResults') : t('share.emptyList')}
            </Text>
            <Text fontSize="$sm" color="$textLight400" $dark-color="$textDark500" mt="$1" textAlign="center" px="$4">
              {debouncedSearch ? t('share.tryDifferentSearch') : t('share.addPeopleToTrustList')}
            </Text>
          </VStack>
        ) : (
          <View style={{ width: gridTotalWidth, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {trustList.map((item: TrustUser) => (
              <TrustUserGridItem
                key={item.id}
                trustUser={item}
                selected={selectedUserIds.has(item.id)}
                onToggle={toggleUser}
                itemWidth={itemWidth}
                isDark={isDark}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Message input + Send */}
      <Box
        bg={isDark ? '$backgroundDark900' : '#FFFFFF'}
        px={paddingH}
        pt="$3"
        pb="$3"
        borderTopWidth={1}
        borderColor={isDark ? '$borderDark600' : '#E5E7EB'}
      >
        <TextInput
          placeholder={t('share.placeholders.writeMessage')}
          placeholderTextColor={messagePlaceholderColor}
          value={message}
          onChangeText={setMessage}
          multiline
          scrollEnabled={true}
          textAlignVertical="top"
          style={{
            color: isDark ? '#F5F5F5' : '#111827',
            fontSize: 14,
            paddingHorizontal: 16,
            paddingVertical: 8,
            maxHeight: 80,
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={isSending || !canSend}
          opacity={isSending ? 0.6 : 1}
          mt="$2"
          py="$3"
          px="$4"
          borderRadius={12}
          bg={canSend && !isSending ? sendButtonActiveBg : sendButtonBg}
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          <Text
            fontSize="$md"
            fontWeight="$bold"
            color={sendTextColor}
          >
            {isSending ? t('share.buttons.sending') : t('share.buttons.send')}
          </Text>
        </Pressable>
      </Box>
    </VStack>
  );
};

const styles = StyleSheet.create({
  avatarImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  scrollContent: {
    paddingBottom: 10,
    paddingTop: 4,
  },
  gridItem: {
    marginBottom: 6,
    alignItems: 'center',
  },
});

ShareToTrustedBottomSheet.displayName = 'ShareToTrustedBottomSheet';

export default ShareToTrustedBottomSheet;
