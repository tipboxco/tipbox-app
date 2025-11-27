import React from 'react';
import { VStack, Text } from '@gluestack-ui/themed';
import PostCard from '@/src/components/PostCards/PostCard';
import { useUserPosts } from '../../api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { useColorMode } from '@/src/hooks/useColorMode';

export const FeedTab = () => {
  const { user } = useAppStore();
  const userId = user?.id;
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const {
    data: posts,
    isLoading,
    error,
  } = useUserPosts(userId);

  if (!userId) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Kullanıcı bilgisi bulunamadı.
        </Text>
      </VStack>
    );
  }

  return (
    <VStack px={16} py={16}>
      {isLoading && (
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mb="$2">
          Feed yükleniyor...
        </Text>
      )}

      {error && (
        <Text color="#CE4A4A" fontSize="$sm" mb="$2">
          Feed yüklenirken bir hata oluştu: {error.message}
        </Text>
      )}

      {posts?.map((post) => (
        <PostCard key={post.id} data={post} />
      ))}
    </VStack>
  );
};
export default FeedTab;