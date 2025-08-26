import React, { useCallback, useMemo, useRef } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  InputField,
  Pressable,
} from '@gluestack-ui/themed';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Header } from '@/src/components/Header';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { LadderScreenProps } from '../types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ladderCards } from '@/src/mock/ladder/ladderCard';
import { LadderCard } from '../components/LadderCard';
import { LadderDetailBottomSheet } from '../components/LadderDetailBottomSheet';

export const LadderScreen: React.FC<LadderScreenProps> = ({ navigation }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [searchQuery, setSearchQuery] = React.useState('');
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [selectedItem, setSelectedItem] = React.useState<typeof ladderCards[0] | null>(null);

  const snapPoints = useMemo(() => {
    return ['50%', '90%'];
  }, []);

  const handlePresentModalPress = useCallback((item: typeof ladderCards[0]) => {
    console.log('Modal açılıyor...', item);
    setSelectedItem(item);
    try {
      bottomSheetModalRef.current?.present();
    } catch (error) {
      console.error('Modal açılırken hata:', error);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight50'}
    >
      <Header
        title="Başarım Merdiveni"
        showBackButton
        onBackPress={handleBackPress}
      />

      <Box px="$4" mt="$4">
        <Input
          variant="outline"
          size="md"
          borderRadius={10}
          borderColor={isDark ? '$borderDark800' : '$borderLight200'}
          backgroundColor={isDark ? '$backgroundDark800' : '$backgroundLight50'}
        >
          <HStack alignItems="center" px="$3" flex={1}>
            <Box mr="$2">
              <FeatherIcon name="search" size={16} color={isDark ? '#666' : '#999'} />
            </Box>
            <InputField
              flex={1}
              placeholder="Search"
              placeholderTextColor={isDark ? '$textDark400' : '$textLight400'}
              color={isDark ? '$textDark50' : '$textLight900'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </HStack>
        </Input>
      </Box>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        <VStack space="md">
          {ladderCards.map((item) => (
            <LadderCard
              key={item.id}
              item={item}
              onPress={() => handlePresentModalPress(item)}
            />
          ))}
        </VStack>
      </ScrollView>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        index={1}
        enablePanDownToClose
        onChange={(index) => {
          console.log('bottomSheet index changed:', index);
        }}
        onDismiss={handleDismiss}
        style={{
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        backdropComponent={({ style }) => (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.5)"
            style={style}
          />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#666666' : '#999999',
          width: 40,
        }}
      >
        {selectedItem && (
          <LadderDetailBottomSheet
            item={selectedItem}
            onClose={() => bottomSheetModalRef.current?.dismiss()}
          />
        )}
      </BottomSheetModal>
    </Box>
  );
};