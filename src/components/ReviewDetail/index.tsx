import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Pressable,
  ScrollView,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ChevronLeft, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react-native';

interface ReviewDetailProps {
  navigation: any;
}

export const ReviewDetail: React.FC<ReviewDetailProps> = ({ navigation }) => {
  const mockReview = {
    title: "This Robot Vacuum Made My Life So Much Easier!",
    summary: "I don't worry about vacuuming anymore. This robot cleans on its own, avoids furniture, and switches between carpets and floors easily. Coming home to a clean house every day feels great! 😌",
    rating: 5,
    priceExperience: "I bought the Xiaomi Robot Vacuum S20 Plus for $499.99 from an online retailer. Shipping was quick, and the packaging was solid. Setup was super easy—I downloaded the Xiaomi Home app and had it running in about 5 minutes. It mapped my house instantly and started cleaning on its own.",
    usageExperience: "The first time I used it, I was genuinely impressed. It quietly cleaned the house, handled carpets and hard floors effortlessly, and barely bumped into furniture. Now, when I come home from work, the living room is spotless. When the battery runs low, it automatically returns to charge—sometimes I don't even realize it. I empty the dustbin just once a week. That's it.\nHonestly, this little robot has made my life way easier. I've completely forgotten what manual vacuuming feels like!",
    images: [
      require('@/assets/product/product_01.png'),
      require('@/assets/product/product_02.png')
    ],
    user: {
      name: "Luther Marshall",
      avatar: require('@/assets/avatar/ozan.png'),
      badge: {
        text: "Smart Home Expert",
        color: "#8BE735",
        borderColor: "#529A0E"
      }
    },
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32
    },
    contexts: {
      usage: "Günlük Kullanım",
      duration: "4-7 Gün",
      recommendation: "Daha İyisi Olabilir"
    },
    product: {
      name: "Xiaomi Robot Vacuum S20 Plus",
      image: require('@/assets/product/product_01.png')
    }
  };
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}>
      {/* Header */}
      <HStack
        h="$12"
        alignItems="center"
        px="$4"
        borderBottomWidth={1}
        borderBottomColor={isDark ? '$backgroundDark200' : '$backgroundLight200'}
      >
        <Pressable onPress={() => navigation.goBack()} p="$2">
          <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text
          flex={1}
          textAlign="center"
          fontWeight="$bold"
          color={isDark ? '$textDark50' : '$textLight900'}
        >
          Post
        </Text>
      </HStack>

      <ScrollView>
        {/* User Info */}
        <HStack space="md" p="$4" alignItems="center">
          <Image
                          source={mockReview.user.avatar}
            alt={mockReview.user.name}
            size="md"
            rounded="$full"
          />
          <VStack>
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontWeight="$bold"
              fontSize="$sm"
            >
              {mockReview.user.name}
            </Text>
            {mockReview.user.badge && (
              <Box
                px="$2"
                py="$1"
                rounded="$lg"
                borderWidth={1}
                borderColor={mockReview.user.badge.borderColor}
                bg={mockReview.user.badge.color}
              >
                <Text fontSize="$2xs" color="#FFFFFF">
                  {mockReview.user.badge.text}
                </Text>
              </Box>
            )}
          </VStack>
        </HStack>

        {/* Review Content */}
        <VStack space="md" p="$4">
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$bold"
            fontSize="$lg"
          >
            {mockReview.title}
          </Text>
          <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$sm">
            {mockReview.summary}
          </Text>

          {/* Rating */}
          <HStack space="sm">
            {Array.from({ length: 5 }).map((_, index) => (
              <Box
                              key={index}
              w="$3"
              h="$3"
              rounded="$full"
              bg={index < mockReview.rating ? '#C2E607' : isDark ? '$backgroundDark400' : '$backgroundLight400'}
              />
            ))}
          </HStack>

          {/* Experience Sections */}
          <VStack space="md" mt="$4">
            <Box
              p="$4"
              rounded="$lg"
              bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
              borderWidth={1}
              borderColor={isDark ? '$backgroundDark700' : '$backgroundLight200'}
            >
              <HStack space="sm" alignItems="center" mb="$2">
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontWeight="$semibold"
                  fontSize="$sm"
                >
                  Price and Shopping Experience
                </Text>
              </HStack>
              <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$sm">
                {mockReview.priceExperience}
              </Text>
            </Box>

            <Box
              p="$4"
              rounded="$lg"
              bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
              borderWidth={1}
              borderColor={isDark ? '$backgroundDark700' : '$backgroundLight200'}
            >
              <HStack space="sm" alignItems="center" mb="$2">
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontWeight="$semibold"
                  fontSize="$sm"
                >
                  Product and Usage Experience
                </Text>
              </HStack>
              <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$sm">
                {mockReview.usageExperience}
              </Text>
            </Box>
          </VStack>

          {/* Images */}
          {mockReview.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HStack space="sm" p="$2">
                {mockReview.images.map((image, index) => (
                  <Image
                    key={index}
                    source={image}
                    alt={`Review image ${index + 1}`}
                    w={176}
                    h={176}
                    rounded="$lg"
                  />
                ))}
              </HStack>
            </ScrollView>
          )}

          {/* Product Card */}
          <Box
            p="$4"
            rounded="$lg"
            bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
            borderWidth={1}
            borderColor={isDark ? '$backgroundDark700' : '$backgroundLight200'}
          >
            <HStack space="md" alignItems="center">
              <Image
                source={mockReview.product.image}
                alt={mockReview.product.name}
                size="md"
                rounded="$md"
              />
              <Text
                flex={1}
                color={isDark ? '$textDark50' : '$textLight900'}
                fontWeight="$bold"
                fontSize="$sm"
              >
                {mockReview.product.name}
              </Text>
            </HStack>
          </Box>

          {/* Contexts */}
          <VStack space="sm" mt="$4">
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontWeight="$semibold"
              fontSize="$sm"
            >
              Bağlamlar
            </Text>
            <HStack space="md">
              <HStack space="xs" alignItems="center">
                <Box
                  p="$2"
                  rounded="$md"
                  bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                >
                  <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$xs">
                    {mockReview.contexts.usage}
                  </Text>
                </Box>
              </HStack>
              <HStack space="xs" alignItems="center">
                <Box
                  p="$2"
                  rounded="$md"
                  bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                >
                  <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$xs">
                    {mockReview.contexts.duration}
                  </Text>
                </Box>
              </HStack>
              <HStack space="xs" alignItems="center">
                <Box
                  p="$2"
                  rounded="$md"
                  bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                >
                  <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$xs">
                    {mockReview.contexts.recommendation}
                  </Text>
                </Box>
              </HStack>
            </HStack>
          </VStack>
        </VStack>

        {/* Interaction Bar */}
        <HStack
          p="$4"
          justifyContent="space-between"
          borderTopWidth={1}
          borderTopColor={isDark ? '$backgroundDark200' : '$backgroundLight200'}
        >
          <HStack space="xl">
            <HStack space="xs" alignItems="center">
              <Heart size={20} color={isDark ? '#DCDCDC' : '#666666'} />
              <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$sm">
                {mockReview.stats.likes}
              </Text>
            </HStack>
            <HStack space="xs" alignItems="center">
              <MessageCircle size={20} color={isDark ? '#DCDCDC' : '#666666'} />
              <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$sm">
                {mockReview.stats.comments}
              </Text>
            </HStack>
            <HStack space="xs" alignItems="center">
              <Share2 size={20} color={isDark ? '#DCDCDC' : '#666666'} />
              <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$sm">
                {mockReview.stats.shares}
              </Text>
            </HStack>
          </HStack>
          <HStack space="xs" alignItems="center">
            <Bookmark size={20} color={isDark ? '#DCDCDC' : '#666666'} />
            <Text color={isDark ? '$textDark200' : '$textLight700'} fontSize="$sm">
              {mockReview.stats.bookmarks}
            </Text>
          </HStack>
        </HStack>
      </ScrollView>
    </Box>
  );
};
