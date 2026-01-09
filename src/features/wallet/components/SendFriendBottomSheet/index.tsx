import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Pressable,
  Box,
  Image,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface Friend {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatar: any;
}

interface SendFriendBottomSheetProps {
  friends: Friend[];
  onFriendSelect: (friend: Friend) => void;
  onBack?: () => void;
}

export const SendFriendBottomSheet: React.FC<SendFriendBottomSheetProps> = ({
  friends,
  onFriendSelect,
  onBack,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.title && friend.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (friend.bio && friend.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <VStack px="$4" py="$4" space="md" flex={1}>
      {/* Header with back button */}
      <HStack alignItems="center" space="md" mb="$2">
        <Pressable onPress={onBack}>
          <Feather name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <HStack flex={1} justifyContent="center" alignItems="center">
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" ml="$2">
            Send TIPS
          </Text>
        </HStack>
        <Box w={24} />
      </HStack>

      {/* Search Bar - copied from Trust_TrusterListScreen */}
      <HStack
        alignItems="center"
        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
        borderWidth={1}
        borderColor="#E9E9E9"
        borderRadius={23}
        px={12}
        space="sm"
      >
        <Feather 
          name="search" 
          size={24} 
          color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'} 
        />
        <Input flex={1} borderWidth={0} bg="transparent">
          <InputField
            placeholder="Search friend"
            placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
            color={isDark ? '#fff' : '#000'}
            fontSize={11}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>
      </HStack>

      {/* Friends List */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <VStack space="xs">
          {filteredFriends.map((friend) => (
            <Pressable
              key={friend.id}
              onPress={() => onFriendSelect(friend)}
            >
              {/* UserCard - adapted from TrustUserCard */}
              <HStack
                alignItems="center"
                justifyContent="space-between"
                py={12}
                px={16}
                borderBottomWidth={1}
                borderBottomColor={isDark ? '#333' : '#E9E9E9'}
              >
                <HStack alignItems="center" space="md" flex={1}>
                  {/* Avatar with Trust Level Ring */}
                  <Box position="relative">
                    <Box
                      width={54}
                      height={54}
                      borderRadius={100}
                      bg="#CE4A4A"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Box
                        width={50}
                        height={50}
                        borderRadius={23}
                        overflow="hidden"
                      >
                        <Image
                          source={friend.avatar}
                          alt={friend.name}
                          width={50}
                          height={50}
                          resizeMode="cover"
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* User Info */}
                  <VStack space="xs" maxWidth={180} flex={1}>
                    <Text
                      color={isDark ? '#fff' : '#000'}
                      fontSize={11}
                      fontWeight="$semibold"
                      numberOfLines={1}
                    >
                      {friend.name}
                    </Text>
                    {(friend.title || friend.bio) && (
                      <Text
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        fontSize={9}
                        numberOfLines={1}
                        lineHeight={11}
                      >
                        {friend.title || friend.bio}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </HStack>
            </Pressable>
          ))}
        </VStack>
      </ScrollView>
    </VStack>
  );
};

