import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Pressable,
} from '@gluestack-ui/themed';
import { Header } from '@/src/components/Header';
import { useColorMode } from '@/src/hooks/useColorMode';
import { TimeLadderDetailScreenProps } from '../types';
import { Trophy, ArrowLeft, Timer, Zap } from 'lucide-react-native';
import { rankingData } from '@/src/mock/ladder/rankingData';
import { friendsData } from '@/src/mock/ladder/friendsData';

type TabType = 'tasks' | 'ranking' | 'friends';

export const TimeLadderDetailScreen: React.FC<TimeLadderDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const { item } = route.params;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderTab = (title: string, type: TabType) => (
    <Pressable onPress={() => setActiveTab(type)}>
      <Box
        borderBottomWidth={2}
        borderBottomColor={activeTab === type ? '$lime500' : 'transparent'}
        py={12}
      >
        <Text
          color={
            activeTab === type
              ? isDark
                ? '$textDark50'
                : '$textLight900'
              : isDark
              ? '$textDark400'
              : '$textLight500'
          }
          fontWeight="$700"
          fontSize={11}
        >
          {title}
        </Text>
      </Box>
    </Pressable>
  );

  const renderTaskItem = (
    title: string,
    description: string,
    points: number,
    isCompleted: boolean = false
  ) => (
    <Box
      bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
      p={12}
      borderRadius={4}
      mb={12}
    >
      <HStack space="md" alignItems="flex-start">
        <Box
          width={36}
          height={36}
          borderRadius={4}
          bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
          justifyContent="center"
          alignItems="center"
        >
          <Trophy size={16} color={isDark ? '#686868' : '#B9B9B9'} />
        </Box>
        <VStack flex={1}>
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$600"
            fontSize={10}
          >
            {title}
          </Text>
          <Text
            color={isDark ? '$textDark400' : '$textLight500'}
            fontWeight="$600"
            fontSize={9}
            mt={4}
          >
            {description}
          </Text>
        </VStack>
        <Text
          color={isDark ? '$textDark400' : '$textLight500'}
          fontWeight="$700"
          fontSize={11}
        >
          +{points}{'\n'}Points
        </Text>
      </HStack>
    </Box>
  );

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight50'}
    >
      <Header
        title={item.title}
        showBackButton
        onBackPress={handleBackPress}
      />

      {/* Description Card */}
      <Box
        mx={16}
        mt={16}
        p={12}
        borderWidth={1}
        borderColor="$lime500"
        borderRadius={10}
      >
        {/* Limited Time Badge */}
        <HStack
          bg="$lime500"
          borderRadius={8}
          px={5}
          py={4}
          alignItems="center"
          alignSelf="flex-start"
          space="sm"
          mb={12}
        >
          <Zap 
            size={14}
            color={isDark ? '#ffffff' : '#000000'}
            strokeWidth={2}
          />
          <Text 
            color={isDark ? '$textDark50' : '$textLight900'} 
            fontWeight="$600" 
            fontSize={9}
          >
            Limited Time
          </Text>
        </HStack>

        <HStack space="md">
          <Image
            source={{ uri: item.image }}
            alt="task image"
            width={60}
            height={60}
            borderRadius={5}
          />
          <VStack flex={1}>
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontWeight="$700"
              fontSize={11}
              mb={4}
            >
              Açıklama
            </Text>
            <Text
              color={isDark ? '$textDark200' : '$textLight800'}
              fontSize={9}
            >
              {item.description}
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Countdown Card */}
      <Box
        mx={16}
        mt={16}
        p={12}
        borderWidth={1}
        borderColor={isDark ? '$borderDark800' : '$borderLight200'}
        borderRadius={10}
      >
        <HStack alignItems="center" justifyContent="space-between">
          <HStack alignItems="center" space="sm">
            <Timer size={20} color={isDark ? '#686868' : '#686868'} />
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontWeight="$600"
              fontSize={11}
            >
              Countdown
            </Text>
          </HStack>
          <Text
            color={isDark ? '$textDark400' : '$textLight500'}
            fontWeight="$600"
            fontSize={12}
          >
            11:42:03
          </Text>
        </HStack>
      </Box>

      {/* Rewards Card */}
      <Box
        mx={16}
        mt={16}
        p={12}
        borderWidth={1}
        borderColor={isDark ? '$borderDark800' : '$borderLight200'}
        borderRadius={10}
      >
        <HStack alignItems="center" space="sm">
          <Trophy size={20} color={isDark ? '#686868' : '#686868'} />
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$600"
            fontSize={11}
          >
            Rewards
          </Text>
        </HStack>
        <HStack mt={12} space="md" alignItems="center">
          <Image
            source={require('../../../../assets/badges/rozet_01.png')}
            alt="badge"
            width={26}
            height={20}
          />
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$600"
            fontSize={10}
          >
            Rozet Adı
          </Text>
        </HStack>
      </Box>

      {/* Tabs and Content */}
      <Box flex={1} mt={16}>
        <Box px={16}>
          <HStack justifyContent="space-around" borderBottomWidth={1} borderBottomColor={isDark ? '$borderDark800' : '$borderLight200'}>
            {renderTab('Görev Listesi', 'tasks')}
            {renderTab('Sıralama', 'ranking')}
            {renderTab('Arkadaşlarım', 'friends')}
          </HStack>
        </Box>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
        >
          {activeTab === 'tasks' && (
            <VStack>
              {renderTaskItem(
                'Yorum Yap',
                'X Kategorisindeki karşılaştırma gönderilerine yorum yap',
                50
              )}
              {renderTaskItem(
                'Yorum Yap',
                'X Kategorisindeki karşılaştırma gönderilerine yorum yap',
                50
              )}
              {renderTaskItem(
                'Başka Görev',
                'X Kategorisindeki karşılaştırma gönderilerine yorum yap',
                150
              )}
              {renderTaskItem(
                'Başka Görev',
                'X Kategorisindeki karşılaştırma gönderilerine yorum yap',
                50
              )}
            </VStack>
          )}

          {activeTab === 'ranking' && (
            <VStack>
              {/* Current User Score */}
              <Box
                bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                p={12}
                mb={12}
              >
                <HStack space="md" alignItems="center">
                  <Image
                    source={{ uri: rankingData.currentUser.avatar }}
                    alt="user avatar"
                    width={36}
                    height={36}
                    borderRadius={18}
                  />
                  <VStack>
                    <Text
                      color={isDark ? '$textDark50' : '$textLight900'}
                      fontWeight="$600"
                      fontSize={11}
                    >
                      {rankingData.currentUser.name}
                    </Text>
                    <Text
                      color={isDark ? '$textDark400' : '$textLight500'}
                      fontWeight="$700"
                      fontSize={11}
                    >
                      {rankingData.currentUser.points} Points
                    </Text>
                  </VStack>
                  <Text
                    position="absolute"
                    right={12}
                    color={isDark ? '$textDark400' : '$textLight500'}
                    fontWeight="$600"
                    fontSize={12}
                  >
                    #{rankingData.currentUser.rank}
                  </Text>
                </HStack>
              </Box>

              {/* Top Users */}
              {rankingData.topUsers.map((user) => (
                <HStack
                  key={user.id}
                  bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                  p={12}
                  mb={12}
                  alignItems="center"
                  space="md"
                >
                  <Box
                    width={20}
                    height={20}
                    borderRadius={20}
                    bg={
                      user.rank === 1
                        ? '#D3BE00'
                        : user.rank === 2
                        ? '#BEBEBE'
                        : '#AB7A49'
                    }
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Text color="$white" fontSize={12} fontWeight="$600">
                      {user.rank}
                    </Text>
                  </Box>
                  <Image
                    source={{ uri: user.avatar }}
                    alt="user avatar"
                    width={36}
                    height={36}
                    borderRadius={18}
                  />
                  <VStack flex={1}>
                    <Text
                      color={isDark ? '$textDark50' : '$textLight900'}
                      fontWeight="$600"
                      fontSize={11}
                    >
                      {user.name}
                    </Text>
                    <Text
                      color={isDark ? '$textDark400' : '$textLight500'}
                      fontWeight="$500"
                      fontSize={9}
                    >
                      Last Activity {user.lastActivity}
                    </Text>
                  </VStack>
                  <Text
                    color={isDark ? '$textDark400' : '$textLight500'}
                    fontWeight="$700"
                    fontSize={11}
                  >
                    {user.points}{'\n'}Points
                  </Text>
                </HStack>
              ))}

              {/* Other Users */}
              {rankingData.otherUsers.map((user) => (
                <HStack
                  key={user.id}
                  bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                  p={12}
                  mb={12}
                  alignItems="center"
                  space="md"
                >
                  <Box
                    width={20}
                    height={20}
                    borderRadius={20}
                    bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Text
                      color={isDark ? '$textDark400' : '$textLight500'}
                      fontSize={12}
                      fontWeight="$600"
                    >
                      {user.rank}
                    </Text>
                  </Box>
                  <Image
                    source={{ uri: user.avatar }}
                    alt="user avatar"
                    width={36}
                    height={36}
                    borderRadius={18}
                  />
                  <VStack flex={1}>
                    <Text
                      color={isDark ? '$textDark50' : '$textLight900'}
                      fontWeight="$600"
                      fontSize={11}
                    >
                      {user.name}
                    </Text>
                    <Text
                      color={isDark ? '$textDark400' : '$textLight500'}
                      fontWeight="$500"
                      fontSize={9}
                    >
                      Last Activity {user.lastActivity}
                    </Text>
                  </VStack>
                  <Text
                    color={isDark ? '$textDark400' : '$textLight500'}
                    fontWeight="$700"
                    fontSize={11}
                  >
                    {user.points}{'\n'}Points
                  </Text>
                </HStack>
              ))}
            </VStack>
          )}

          {activeTab === 'friends' && (
            <VStack>
              {friendsData.map((friend) => (
                <HStack
                  key={friend.id}
                  bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                  p={12}
                  mb={12}
                  alignItems="center"
                  space="md"
                >
                  <Box
                    width={20}
                    height={20}
                    borderRadius={20}
                    bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Text
                      color={isDark ? '$textDark400' : '$textLight500'}
                      fontSize={12}
                      fontWeight="$600"
                    >
                      {friend.rank}
                    </Text>
                  </Box>
                  <Image
                    source={{ uri: friend.avatar }}
                    alt="user avatar"
                    width={36}
                    height={36}
                    borderRadius={18}
                  />
                  <VStack flex={1}>
                    <Text
                      color={isDark ? '$textDark50' : '$textLight900'}
                      fontWeight="$600"
                      fontSize={11}
                    >
                      {friend.name}
                    </Text>
                    <Text
                      color={isDark ? '$textDark400' : '$textLight500'}
                      fontWeight="$500"
                      fontSize={9}
                    >
                      Last Activity 1h ago
                    </Text>
                  </VStack>
                  <Text
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontWeight="$600"
                    fontSize={11}
                  >
                    {friend.points}{'\n'}Points
                  </Text>
                </HStack>
              ))}
            </VStack>
          )}
        </ScrollView>
      </Box>
    </Box>
  );
};
