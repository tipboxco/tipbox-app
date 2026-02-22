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
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useTrustList } from '@/src/features/profile/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { useSharePostToDm } from '@/src/features/interactions/api/hooks';
import { showCustomToast } from '@/src/components/CustomToast';
import type { TrustUser } from '@/src/features/profile/types';

const GRID_COLUMNS = 3;
const AVATAR_SIZE = 72;
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
}

export const ShareToTrustedBottomSheet: React.FC<ShareToTrustedBottomSheetProps> = ({
  postId,
  postContent,
  postAuthorName,
  onShareSuccess,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { closeBottomSheet } = useGlobalBottomSheet();
  const toast = useToast();
  const user = useAppStore((state) => state.user);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Track keyboard visibility - keyboardWill* events are faster than keyboardDid*
  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardWillShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      'keyboardWillHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
      closeBottomSheet();
      showCustomToast(toast, {
        title: 'Post Shared',
        description: 'Your post has been shared successfully!',
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
    closeBottomSheet,
    onShareSuccess,
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
    <VStack flex={1} bg={isDark ? '$backgroundDark900' : '#FFFFFF'} minHeight={320} pt="$2" pb="$5" position="relative">
      {/* Search - ExploreScreen ile aynı yapı: HStack + icon + Input */}
      <Box px={paddingH} pb="$3" alignSelf="stretch">
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
              placeholder="Search"
              placeholderTextColor={searchPlaceholderColor}
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$xs"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>
        </HStack>
      </Box>

      {/* Trust list - Virtualized grid */}
      {isLoadingTrustList ? (
        <VStack alignItems="center" justifyContent="center" py="$12">
          <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
          <Text mt="$3" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
            Loading...
          </Text>
        </VStack>
      ) : trustList.length === 0 ? (
        <VStack alignItems="center" py="$12">
          <Text fontSize="$md" fontWeight="$semibold" color="$textLight500" $dark-color="$textDark400">
            {debouncedSearch ? 'No results found' : 'Trust list is empty'}
          </Text>
          <Text fontSize="$sm" color="$textLight400" $dark-color="$textDark500" mt="$1" textAlign="center" px="$4">
            {debouncedSearch ? 'Try a different search.' : 'Add people to your trust list to share with them.'}
          </Text>
        </VStack>
      ) : (
        <FlatList
          data={trustList}
          keyExtractor={(item: TrustUser) => item.id}
          numColumns={GRID_COLUMNS}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          columnWrapperStyle={{ width: gridTotalWidth, justifyContent: 'space-between', alignSelf: 'center' }}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }: { item: TrustUser }) => (
            <TrustUserGridItem
              trustUser={item}
              selected={selectedUserIds.has(item.id)}
              onToggle={toggleUser}
              itemWidth={itemWidth}
              isDark={isDark}
            />
          )}
        />
      )}

      {/* Message input + Send - Absolute positioned, user listesinin üzerinde */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg={isDark ? '$backgroundDark900' : '#FFFFFF'}
        px={paddingH}
        pt="$2"
        pb={isKeyboardVisible ? 8 : (insets.bottom || 8)}
        borderTopWidth={1}
        borderColor={isDark ? '$borderDark600' : '#E5E7EB'}
      >
        <Input
          size="md"
          variant="outline"
          bg="transparent"
          borderWidth={0}
          borderRadius={8}
          alignItems="flex-start"
          py="$2"
          px="$4"
          width="100%"
          minHeight={32}
          maxHeight={120}
        >
          <InputField
            placeholder="Write a message..."
            placeholderTextColor={messagePlaceholderColor}
            color={isDark ? '$textDark50' : '#111827'}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />
        </Input>
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
            {isSending ? 'Sending...' : 'Send'}
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
  scroll: {
    flex: 1,
    maxHeight: 320, // 2.5 satır için yükseltildi: (72 avatar + 6 margin + 30 text + 10 marginBottom) * 2.5 ≈ 295px + padding
  },
  scrollContent: {
    paddingBottom: 16,
    flexGrow: 1,
    alignItems: 'center',
  },
  gridItem: {
    marginBottom: 10,
    alignItems: 'center',
  },
});

ShareToTrustedBottomSheet.displayName = 'ShareToTrustedBottomSheet';

export default ShareToTrustedBottomSheet;
