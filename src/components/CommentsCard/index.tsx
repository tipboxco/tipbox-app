import React, { useMemo, useState, useCallback } from 'react';
import { ImageSourcePropType } from 'react-native';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CachedImage } from '@/src/components/CachedImage';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için

// Default user avatar
const DEFAULT_USER_AVATAR = require('@/assets/avatar/default-useravatar.png');

export interface CommentsCardProps {
  id?: string;
  userName: string;
  userTitle: string;
  avatar: ImageSourcePropType;
  timeAgo: string;
  content: string;
}

export const CommentsCard: React.FC<CommentsCardProps> = ({
  userName,
  userTitle,
  avatar,
  timeAgo,
  content,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Avatar source state - görsel yüklenemezse default avatar'a geçiş için
  const [avatarSource, setAvatarSource] = useState(avatar || DEFAULT_USER_AVATAR);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const avatarLoadTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Avatar değiştiğinde state'i güncelle
  React.useEffect(() => {
    // Önceki timeout'u temizle
    if (avatarLoadTimeoutRef.current) {
      clearTimeout(avatarLoadTimeoutRef.current);
      avatarLoadTimeoutRef.current = null;
    }
    
    const newSource = avatar || DEFAULT_USER_AVATAR;
    
    // Eğer yeni source default avatar değilse, load kontrolü yap
    if (newSource !== DEFAULT_USER_AVATAR) {
      setAvatarSource(newSource);
      setIsImageLoaded(false);
      
      // 5 saniye içinde görsel yüklenmezse default avatar'a geç
      avatarLoadTimeoutRef.current = setTimeout(() => {
        setAvatarSource((currentSource: any) => {
          // Eğer hala yüklenmediyse ve source değişmediyse default avatar'a geç
          if (currentSource === newSource) {
            console.log('[CommentsCard] Avatar load timeout, using default avatar:', {
              userName,
              attemptedSource: newSource,
            });
            return DEFAULT_USER_AVATAR;
          }
          return currentSource;
        });
        setIsImageLoaded(true);
      }, 5000); // 5 saniye timeout
    } else {
      // Zaten default avatar ise direkt set et
      setAvatarSource(DEFAULT_USER_AVATAR);
      setIsImageLoaded(true);
    }
    
    return () => {
      if (avatarLoadTimeoutRef.current) {
        clearTimeout(avatarLoadTimeoutRef.current);
        avatarLoadTimeoutRef.current = null;
      }
    };
  }, [avatar, userName]);
  
  // Avatar başarıyla yüklendiğinde
  const handleAvatarLoad = useCallback(() => {
    setIsImageLoaded(true);
    // Timeout'u temizle
    if (avatarLoadTimeoutRef.current) {
      clearTimeout(avatarLoadTimeoutRef.current);
      avatarLoadTimeoutRef.current = null;
    }
  }, []);
  
  // Avatar yüklenme hatası durumunda default avatar'a geçiş
  const handleAvatarError = useCallback((error: Error) => {
    console.log('[CommentsCard] Avatar load error, using default avatar:', {
      userName,
      attemptedSource: avatarSource,
      error: error.message,
    });
    setAvatarSource(DEFAULT_USER_AVATAR);
    setIsImageLoaded(true); // Default avatar zaten yüklü sayılır
    // Timeout'u temizle
    if (avatarLoadTimeoutRef.current) {
      clearTimeout(avatarLoadTimeoutRef.current);
      avatarLoadTimeoutRef.current = null;
    }
  }, [userName, avatarSource]);

  // Metin uzunluğuna göre basit truncation kontrolü
  const shouldTruncate = useMemo(() => content.length > 160, [content]);

  return (
    <Box
      position="relative"
      borderBottomWidth={1}
      borderBottomColor="#E9E9E9"
      px={12}
      py={8}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      <HStack alignItems="flex-start" space="sm">
        {/* Avatar */}
        <CachedImage
          source={avatarSource}
          placeholder={DEFAULT_USER_AVATAR}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          onLoadEnd={handleAvatarLoad}
          onError={handleAvatarError}
        />

        {/* Comment Content */}
        <VStack flex={1} space="xs">
          {/* Name & Title */}
          <VStack space="xs">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$sm"
              fontWeight="$bold"
            >
              {userName}
            </Text>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$sm"
              fontWeight="$medium"
              numberOfLines={1}
            >
              {userTitle}
            </Text>
          </VStack>

          {/* Comment Text */}
          <VStack space="xs">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$sm"
              lineHeight={14}
              numberOfLines={isExpanded || !shouldTruncate ? undefined : 3}
            >
              {content}
            </Text>

            {/* Expand / Collapse - sadece metin yeterince uzunsa göster */}
            {shouldTruncate && (
              <Pressable
                alignSelf="flex-start"
                onPress={() => setIsExpanded((prev) => !prev)}
              >
                <Text
                  color="#829905"
                  fontSize="$sm"
                  fontWeight="$medium"
                  textDecorationLine="underline"
                >
                  {isExpanded ? 'Daha az göster' : 'Daha fazla göster'}
                </Text>
              </Pressable>
            )}
          </VStack>
        </VStack>
      </HStack>

      {/* Time */}
      <Text
        position="absolute"
        top={8}
        right={12}
        color={isDark ? '#8C8C8C' : '#8C8C8C'}
        fontSize="$sm"
        fontWeight="$medium"
      >
        {timeAgo}
      </Text>
    </Box>
  );
};

export default CommentsCard;


