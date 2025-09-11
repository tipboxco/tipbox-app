import React, { useCallback, useMemo } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  InputField,
  Pressable,
  Button,
  ButtonText,
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
  const [selectedFilter, setSelectedFilter] = React.useState<'all' | 'in_progress' | 'completed'>('all');

  const handlePresentModalPress = useCallback((item: typeof ladderCards[0]) => {
    navigation.navigate('LadderDetail', { item });
  }, [navigation]);

  const filteredLadderCards = useMemo(() => {
    let filtered = ladderCards;
    
    // Önce arama filtresini uygula
    if (searchQuery) {
      filtered = filtered.filter(card => 
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sonra durum filtresini uygula
    switch (selectedFilter) {
      case 'in_progress':
        return filtered.filter(card => card.progress < 100);
      case 'completed':
        return filtered.filter(card => card.progress === 100);
      default:
        return filtered;
    }
  }, [searchQuery, selectedFilter]);

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

      <VStack px="$4" mt="$4" space="md">
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

        <HStack space="sm" justifyContent="flex-start" w="100%">
          <Button
            variant="outline"
            size="sm"
            borderRadius={10}
            borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
            bg={selectedFilter === 'all' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
            onPress={() => setSelectedFilter('all')}
            px="$3"
            py="$1.5"
          >
            <ButtonText
              fontSize="$xs"
              fontWeight="$semibold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              All
            </ButtonText>
          </Button>

          <Button
            variant="outline"
            size="sm"
            borderRadius={10}
            borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
            bg={selectedFilter === 'in_progress' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
            onPress={() => setSelectedFilter('in_progress')}
            px="$3"
            py="$1.5"
          >
            <ButtonText
              fontSize="$xs"
              fontWeight="$semibold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              In Progress
            </ButtonText>
          </Button>

          <Button
            variant="outline"
            size="sm"
            borderRadius={10}
            borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
            bg={selectedFilter === 'completed' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
            onPress={() => setSelectedFilter('completed')}
            px="$3"
            py="$1.5"
          >
            <ButtonText
              fontSize="$xs"
              fontWeight="$semibold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              Completed
            </ButtonText>
          </Button>
        </HStack>
      </VStack>

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
          {filteredLadderCards.map((item) => (
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