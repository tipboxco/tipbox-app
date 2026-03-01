import React, { useRef, useCallback, useEffect } from 'react';
import { VStack, HStack, Text, Box, Pressable, Image } from '@gluestack-ui/themed';
import { Dimensions, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useColorMode } from '@/src/hooks/useColorMode';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toImageSource } from '@/src/utils';

const { width: screenWidth } = Dimensions.get('window');

interface NFTListingSuccessData {
  id: string;
  title: string;
  description?: string;
  username: string;
  price: string;
  image: string;
  userAvatar?: string;
  rarity: string;
  type: string;
  listedAt: string;
  sellerId: string;
  nftId: string;
}

interface NFTListingSuccessBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onViewListing: (nftId: string) => void;
  data: NFTListingSuccessData;
}

export const NFTListingSuccessBottomSheet: React.FC<NFTListingSuccessBottomSheetProps> = ({
  isVisible,
  onClose,
  onViewListing,
  data,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = React.useMemo(() => ['95%'], []);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleSheetClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
        style={[props.style, { top: 0 }]}
      />
    ),
    []
  );

  if (!isVisible) return null;

  const nftImageSource = toImageSource(data.image) || require('@/assets/marketplace/badge.png');

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleSheetClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? '#404040' : '#E0E0E0',
      }}
      bottomInset={0}
      topInset={0}
    >
      <BottomSheetScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
          <VStack space="lg" px="$4" py="$2">
            {/* Success Icon */}
            <Box alignItems="center" mt="$2">
              <Box
                width={80}
                height={80}
                borderRadius="$full"
                bg="#C2E607"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={40}>✓</Text>
              </Box>
            </Box>

            {/* Title */}
            <VStack space="xs" alignItems="center">
              <Text
                fontSize="$xl"
                fontWeight="$bold"
                color={isDark ? '$textDark50' : '$textLight900'}
                textAlign="center"
              >
                Listed Successfully!
              </Text>
              <Text
                fontSize="$sm"
                color={isDark ? '$textDark400' : '$textLight600'}
                textAlign="center"
              >
                "{data.title}" is now live on the marketplace
              </Text>
            </VStack>

            {/* NFT Preview Card */}
            <Box
              bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
              borderRadius="$lg"
              borderWidth={1}
              borderColor={isDark ? '$borderDark700' : '$borderLight200'}
              p="$3"
            >
              <HStack space="md" alignItems="center">
                <Image
                  source={nftImageSource}
                  alt={data.title}
                  width={70}
                  height={70}
                  borderRadius="$md"
                  resizeMode="cover"
                />
                <VStack flex={1} space="xs">
                  <Text
                    fontSize={12}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                    numberOfLines={1}
                  >
                    {data.title}
                  </Text>
                  {data.description && (
                    <Text
                      fontSize={10}
                      color={isDark ? '$textDark400' : '$textLight600'}
                      numberOfLines={2}
                    >
                      {data.description}
                    </Text>
                  )}
                  <HStack space="xs" alignItems="center">
                    <Box
                      bg="#C2E607"
                      borderRadius="$full"
                      px="$2"
                      py="$1"
                    >
                      <Text fontSize={8} fontWeight="$bold" color="#596B00">
                        {data.rarity}
                      </Text>
                    </Box>
                    <Box
                      bg={isDark ? '$backgroundDark900' : '$backgroundLight200'}
                      borderRadius="$full"
                      px="$2"
                      py="$1"
                    >
                      <Text
                        fontSize={8}
                        fontWeight="$medium"
                        color={isDark ? '$textDark300' : '$textLight700'}
                      >
                        {data.type}
                      </Text>
                    </Box>
                  </HStack>
                </VStack>
              </HStack>
            </Box>

            {/* Listing Details */}
            <Box
              bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
              borderRadius="$lg"
              borderWidth={1}
              borderColor={isDark ? '$borderDark700' : '$borderLight200'}
              p="$3"
            >
              <VStack space="sm">
                {/* Listing ID */}
                <VStack space="xs">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '$textLight600'}
                  >
                    Listing ID
                  </Text>
                  <Text
                    fontSize={11}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                    numberOfLines={1}
                  >
                    {data.id}
                  </Text>
                </VStack>

                <Box
                  height={1}
                  bg={isDark ? '$borderDark700' : '$borderLight200'}
                />

                {/* Listed Price */}
                <HStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '$textLight600'}
                  >
                    Listed Price
                  </Text>
                  <Text
                    fontSize={11}
                    fontWeight="$bold"
                    color="#C2E607"
                  >
                    {data.price} TIPS
                  </Text>
                </HStack>

                <Box
                  height={1}
                  bg={isDark ? '$borderDark700' : '$borderLight200'}
                />

                {/* Seller */}
                <HStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '$textLight600'}
                  >
                    Seller
                  </Text>
                  <Text
                    fontSize={11}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    @{data.username}
                  </Text>
                </HStack>

                <Box
                  height={1}
                  bg={isDark ? '$borderDark700' : '$borderLight200'}
                />

                {/* Listed At */}
                <HStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '$textLight600'}
                  >
                    Listed At
                  </Text>
                  <Text
                    fontSize={11}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {new Date(data.listedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Info Message */}
            <Box
              bg={isDark ? 'rgba(194, 230, 7, 0.1)' : 'rgba(194, 230, 7, 0.15)'}
              borderRadius="$lg"
              p="$3"
            >
              <Text
                fontSize={10}
                color={isDark ? '$textDark300' : '$textLight600'}
                textAlign="center"
              >
                Your NFT is now visible to all marketplace users. You can manage your listings in the marketplace section.
              </Text>
            </Box>

            {/* Action Buttons */}
            <HStack space="sm">
              <Pressable
                onPress={handleClose}
                flex={1}
                bg={isDark ? '$backgroundDark800' : '$backgroundLight200'}
                borderRadius="$lg"
                py="$3"
                px="$4"
                borderWidth={1}
                borderColor={isDark ? '$borderDark700' : '$borderLight300'}
              >
                <Text
                  fontSize={12}
                  fontWeight="$bold"
                  color={isDark ? '$textDark200' : '$textLight800'}
                  textAlign="center"
                >
                  Close
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  handleClose();
                  onViewListing(data.nftId);
                }}
                flex={1}
                bg="#C2E607"
                borderRadius="$lg"
                py="$3"
                px="$4"
              >
                <Text
                  fontSize={12}
                  fontWeight="$bold"
                  color="#596B00"
                  textAlign="center"
                >
                  View Listing
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </Animated.View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
