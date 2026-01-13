import React, { useRef, useCallback, useEffect } from 'react';
import { VStack, HStack, Text, Box, Pressable } from '@gluestack-ui/themed';
import { Dimensions, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useColorMode } from '@/src/hooks/useColorMode';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useBottomOffset } from '@/src/utils';

const { width: screenWidth } = Dimensions.get('window');

interface NFTPurchaseSuccessData {
  nftId: string;
  nftTitle?: string;
  nftImage?: string;
  buyerTransaction: {
    id: string;
    amount: number;
    status: string;
  };
  sellerTransaction: {
    id: string;
    amount: number;
    status: string;
  };
  newOwner: {
    id: string;
    name: string;
  };
}

interface NFTPurchaseSuccessBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  data: NFTPurchaseSuccessData;
}

export const NFTPurchaseSuccessBottomSheet: React.FC<NFTPurchaseSuccessBottomSheetProps> = ({
  isVisible,
  onClose,
  data,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomSheetRef = useRef<BottomSheet>(null);
  const bottomOffset = useBottomOffset({ includeTabBar: true, extraPadding: 0 });

  const snapPoints = React.useMemo(() => ['60%'], []);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? '#404040' : '#E0E0E0',
      }}
      bottomInset={bottomOffset}
    >
      <BottomSheetView style={styles.contentContainer}>
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
                Purchase Successful!
              </Text>
              <Text
                fontSize="$sm"
                color={isDark ? '$textDark400' : '$textLight600'}
                textAlign="center"
              >
                {data.nftTitle ? `You successfully purchased "${data.nftTitle}"` : 'Your NFT purchase was successful'}
              </Text>
            </VStack>

            {/* Transaction Details */}
            <Box
              bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
              borderRadius="$lg"
              borderWidth={1}
              borderColor={isDark ? '$borderDark700' : '$borderLight200'}
              p="$3"
            >
              <VStack space="sm">
                {/* Transaction ID */}
                <VStack space="xs">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '$textLight600'}
                  >
                    Transaction ID
                  </Text>
                  <Text
                    fontSize={11}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                    numberOfLines={1}
                  >
                    {data.buyerTransaction.id}
                  </Text>
                </VStack>

                <Box
                  height={1}
                  bg={isDark ? '$borderDark700' : '$borderLight200'}
                />

                {/* Amount Paid */}
                <HStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '$textLight600'}
                  >
                    Amount Paid
                  </Text>
                  <Text
                    fontSize={11}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {data.buyerTransaction.amount.toFixed(2)} TIPS
                  </Text>
                </HStack>

                <Box
                  height={1}
                  bg={isDark ? '$borderDark700' : '$borderLight200'}
                />

                {/* Status */}
                <HStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '$textLight600'}
                  >
                    Status
                  </Text>
                  <Box
                    bg="#C2E607"
                    borderRadius="$full"
                    px="$3"
                    py="$1"
                  >
                    <Text
                      fontSize={10}
                      fontWeight="$bold"
                      color="#596B00"
                    >
                      {data.buyerTransaction.status.toUpperCase()}
                    </Text>
                  </Box>
                </HStack>

                <Box
                  height={1}
                  bg={isDark ? '$borderDark700' : '$borderLight200'}
                />

                {/* New Owner */}
                <HStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '$textLight600'}
                  >
                    New Owner
                  </Text>
                  <Text
                    fontSize={11}
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {data.newOwner.name}
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
                The NFT has been transferred to your wallet. You can view it in your NFT collection.
              </Text>
            </Box>

            {/* Done Button */}
            <Pressable
              onPress={handleClose}
              bg="#C2E607"
              borderRadius="$lg"
              py="$3"
              px="$4"
              mt="$2"
            >
              <Text
                fontSize={12}
                fontWeight="$bold"
                color="#596B00"
                textAlign="center"
              >
                Done
              </Text>
            </Pressable>
          </VStack>
        </Animated.View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
});
