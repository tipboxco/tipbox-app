import React, { useCallback } from 'react';
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
import { Header } from '@/src/components/Header';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { LadderScreenProps } from '../types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ladderCards } from '@/src/mock/ladder/ladderCard';
import { timeLadderData } from '@/src/mock/ladder/timeLadder';
import { LadderCard } from '../components/LadderCard';
import { TimeLadder } from '../components/TimeLadder';


export const LadderScreen: React.FC<LadderScreenProps> = ({ navigation }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [searchQuery, setSearchQuery] = React.useState('');
  const handlePresentModalPress = useCallback((item: typeof ladderCards[0]) => {
    navigation.navigate('LadderDetail', { item });
  }, [navigation]);

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
          <TimeLadder
            {...timeLadderData}
            onDetailPress={() => navigation.navigate('TimeLadderDetail', { item: timeLadderData.item })}
            onPress={() => navigation.navigate('TimeLadderDetail', { item: timeLadderData.item })}
          />
          {ladderCards.map((item) => (
            <LadderCard
              key={item.id}
              item={item}
              onPress={() => handlePresentModalPress(item)}
            />
          ))}
        </VStack>
      </ScrollView>


    </Box>
  );
};