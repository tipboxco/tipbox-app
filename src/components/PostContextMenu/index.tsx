import React, { useCallback } from 'react';
import { Alert, Share } from 'react-native';
import { VStack, HStack, Text, Pressable, Divider, Box } from '@gluestack-ui/themed';
import {
  UserIcon,
  UserPlusIcon,
  UserMinusIcon,
  FlagIcon,
  NoSymbolIcon,
  ArrowTopRightOnSquareIcon,
} from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useSharePost } from '@/src/features/interactions/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';

interface PostContextMenuProps {
  postId: string;
  postContent?: string;
  postAuthorName?: string;
  children: React.ReactNode;
  // User profile related props
  userId?: string;
  isOwnProfile?: boolean;
  isTrusted?: boolean | null;
  isTrusting?: boolean;
  isUntrusting?: boolean;
  isReporting?: boolean;
  // Callbacks
  onViewProfile?: () => void;
  onTrust?: () => void;
  onUntrust?: () => void;
  onReportUser?: () => void;
  onBlock?: () => void;
}

export const PostContextMenu: React.FC<PostContextMenuProps> = ({
  postId,
  postContent,
  postAuthorName,
  children,
  userId,
  isOwnProfile = false,
  isTrusted = false,
  isTrusting = false,
  isUntrusting = false,
  isReporting = false,
  onViewProfile,
  onTrust,
  onUntrust,
  onReportUser,
  onBlock,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const sharePostMutation = useSharePost();

  const handleExternalShare = useCallback(async () => {
    try {
      const shareMessage = postContent 
        ? `${postAuthorName ? `${postAuthorName}: ` : ''}${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}`
        : `Check out this post on Tipbox!`;
      
      await Share.share({
        message: shareMessage,
        url: `tipboxapp://post/${postId}`,
      });
    } catch (error) {
      console.error('[PostContextMenu] Share error:', error);
    }
  }, [postId, postContent, postAuthorName]);

  const handleReportPost = useCallback(() => {
    Alert.alert(
      'Post\'u Raporla',
      'Bu post\'u raporlamak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Raporla',
          style: 'destructive',
          onPress: () => {
            // TODO: Post report API endpoint eklendiğinde buraya entegre edilecek
            console.log('[PostContextMenu] Report post:', postId);
            Alert.alert('Success', 'Post reported. Thank you for your review.');
          },
        },
      ]
    );
  }, [postId]);

  const handleMenuPress = useCallback(() => {
    // CRITICAL DEBUG: Check which menu items will be rendered
    const willShowViewProfile = !!onViewProfile;
    const willShowTrustSection = !isOwnProfile && (!!onTrust || !!onUntrust);
    const willShowShare = true; // Always shown
    const willShowReportUser = !isOwnProfile && !!onReportUser;
    const willShowReportPost = true; // Always shown
    const willShowBlock = !isOwnProfile && !!onBlock;
    const willShowOwnProfileOptions = isOwnProfile;
    
    const menuItemsCount = 
      (willShowViewProfile ? 1 : 0) +
      (willShowTrustSection ? 1 : 0) +
      (willShowShare ? 1 : 0) +
      (willShowReportUser ? 1 : 0) +
      (willShowReportPost ? 1 : 0) +
      (willShowBlock ? 1 : 0) +
      (willShowOwnProfileOptions ? 2 : 0); // Share + Report for own profile
    
    // Opening bottom sheet log removed for performance
    
    const menuContent = (
      <Box 
        bg={isDark ? '$backgroundDark900' : '$white'} 
        width="100%"
        style={{ 
          width: '100%',
          minHeight: 200, // CRITICAL DEBUG: Minimum height to ensure Box is visible
        }}
      >
        <VStack 
          pb={20}
          pt={10}
          width="100%"
          space="sm"
        >
        {/* Profili Görüntüle */}
        {onViewProfile && (
          <Pressable
            onPress={() => {
              closeBottomSheet();
              onViewProfile();
            }}
            px={20}
            py={16}
          >
            <HStack alignItems="center" space="md">
              <UserIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize="$md"
                fontWeight="$medium"
              >
                Profili Görüntüle
              </Text>
            </HStack>
          </Pressable>
        )}

        {/* Kendi profili değilse diğer seçenekleri göster */}
        {!isOwnProfile && (
          <>
            {(onViewProfile || onTrust || onUntrust) && (
              <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
            )}
            
            {/* Trust/UnTrust */}
            {(onTrust || onUntrust) && (
              <Pressable
                onPress={() => {
                  closeBottomSheet();
                  if (isTrusted && onUntrust) {
                    onUntrust();
                  } else if (!isTrusted && onTrust) {
                    onTrust();
                  }
                }}
                px={20}
                py={16}
                disabled={isTrusting || isUntrusting}
                opacity={(isTrusting || isUntrusting) ? 0.6 : 1}
              >
                <HStack alignItems="center" space="md">
                  {isTrusted ? (
                    <UserMinusIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
                  ) : (
                    <UserPlusIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
                  )}
                  <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize="$md"
                    fontWeight="$medium"
                  >
                    {isTrusting ? 'Ekleniyor...' : isUntrusting ? 'Kaldırılıyor...' : (isTrusted ? 'Un Trust' : 'Trust')}
                  </Text>
                </HStack>
              </Pressable>
            )}

            {/* Dışarıda Paylaş */}
            {/* CRITICAL FIX: Always show divider before Share - conditional divider removed */}
            <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
            <Pressable
              onPress={() => {
                closeBottomSheet();
                handleExternalShare();
              }}
              px={20}
              py={16}
            >
              <HStack alignItems="center" space="md">
                <ArrowTopRightOnSquareIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
                <Text
                  color={isDark ? '$textDark50' : '#000'}
                  fontSize="$md"
                  fontWeight="$medium"
                >
                  Dışarıda Paylaş
                </Text>
              </HStack>
            </Pressable>

            {/* Kullanıcıyı Raporla */}
            {onReportUser && (
              <>
                <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
                <Pressable
                  onPress={() => {
                    closeBottomSheet();
                    onReportUser();
                  }}
                  px={20}
                  py={16}
                  disabled={isReporting}
                  opacity={isReporting ? 0.6 : 1}
                >
                  <HStack alignItems="center" space="md">
                    <FlagIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
                    <Text
                      color={isDark ? '$textDark50' : '#000'}
                      fontSize="$md"
                      fontWeight="$medium"
                    >
                      {isReporting ? 'Raporlanıyor...' : 'Kullanıcıyı Raporla'}
                    </Text>
                  </HStack>
                </Pressable>
              </>
            )}

            {/* Post'u Raporla */}
            <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
            <Pressable
              onPress={() => {
                closeBottomSheet();
                handleReportPost();
              }}
              px={20}
              py={16}
            >
              <HStack alignItems="center" space="md">
                <FlagIcon width={20} height={20} color="#FF3040" />
                <Text
                  color="#FF3040"
                  fontSize="$md"
                  fontWeight="$medium"
                >
                  Post'u Raporla
                </Text>
              </HStack>
            </Pressable>

            {/* Engelle */}
            {onBlock && (
              <>
                <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
                <Pressable
                  onPress={() => {
                    closeBottomSheet();
                    onBlock();
                  }}
                  px={20}
                  py={16}
                >
                  <HStack alignItems="center" space="md">
                    <NoSymbolIcon width={20} height={20} color="#FF3040" />
                    <Text
                      color="#FF3040"
                      fontSize="$md"
                      fontWeight="$medium"
                    >
                      Engelle
                    </Text>
                  </HStack>
                </Pressable>
              </>
            )}
          </>
        )}

        {/* Kendi profili ise sadece paylaş ve raporla göster */}
        {isOwnProfile && (
          <>
            <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
            <Pressable
              onPress={() => {
                closeBottomSheet();
                handleExternalShare();
              }}
              px={20}
              py={16}
            >
              <HStack alignItems="center" space="md">
                <ArrowTopRightOnSquareIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
                <Text
                  color={isDark ? '$textDark50' : '#000'}
                  fontSize="$md"
                  fontWeight="$medium"
                >
                  Dışarıda Paylaş
                </Text>
              </HStack>
            </Pressable>
            <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
            <Pressable
              onPress={() => {
                closeBottomSheet();
                handleReportPost();
              }}
              px={20}
              py={16}
            >
              <HStack alignItems="center" space="md">
                <FlagIcon width={20} height={20} color="#FF3040" />
                <Text
                  color="#FF3040"
                  fontSize="$md"
                  fontWeight="$medium"
                >
                  Post'u Raporla
                </Text>
              </HStack>
            </Pressable>
          </>
        )}
        </VStack>
      </Box>
    );

    // menuContent created log removed for performance

    openBottomSheet(menuContent, {
      enablePanDownToClose: true,
      enableDynamicSizing: true,
    });
  }, [
    isDark,
    isOwnProfile,
    isTrusted,
    isTrusting,
    isUntrusting,
    isReporting,
    onViewProfile,
    onTrust,
    onUntrust,
    onReportUser,
    onBlock,
    closeBottomSheet,
    openBottomSheet,
    handleExternalShare,
    handleReportPost,
  ]);

  return (
    <Pressable onPress={handleMenuPress}>
      {children}
    </Pressable>
  );
};
