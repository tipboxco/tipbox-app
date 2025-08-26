import React, { useEffect, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Progress,
  Image,
  Pressable,
} from '@gluestack-ui/themed';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { LadderItem } from '../../types';
import { useColorMode } from '@/src/hooks/useColorMode';

interface LadderCardProps {
  item: LadderItem;
  onPress: () => void;
}

export const LadderCard: React.FC<LadderCardProps> = ({ item, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={onPress}>
      <Box
        bg={isDark ? '$backgroundDark900' : '$white'}
        borderRadius="$lg"
        p="$4"
        shadowColor="$shadowLight200"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.25}
        shadowRadius={3}
        mb="$1"
      >
        <VStack space="sm">
          <HStack alignItems="center" space="md">
            <Image
              source={require('@/assets/bridge/card-icon.png')}
              alt="Card Icon"
              width={60}
              height={60}
            />
            <VStack flex={1}>
              <Text
                fontSize="$xs"
                fontWeight="$bold"
                color={isDark ? '$textLight0' : '$textDark0'}
              >
                {item.title}
              </Text>
              <Text
                fontSize="$2xs"
                color={isDark ? '$textLight0' : '$textDark0'}
                opacity={0.8}
              >
                {item.description}
              </Text>
            </VStack>
                         <Box alignItems="center" justifyContent="center">
               <AnimatedCircularProgress
                 size={80}
                 width={8}
                 backgroundWidth={8}
                 fill={item.progress}
                 tintColor={isDark ? '#60A5FA' : '#2563EB'}
                 backgroundColor={isDark ? '#374151' : '#E5E7EB'}
                 arcSweepAngle={360}
                 rotation={0}
                 lineCap="round"
                 duration={2000}
               >
                 {() => (
                   <VStack alignItems="center">
                     <Text
                       fontSize="$sm"
                       fontWeight="$bold"
                       color={isDark ? '$textLight0' : '$textDark0'}
                     >
                       %{item.progress}
                     </Text>
                     <Text
                       fontSize="$2xs"
                       color={isDark ? '$textLight0' : '$textDark0'}
                     >
                       Complete
                     </Text>
                   </VStack>
                 )}
               </AnimatedCircularProgress>
             </Box>
          </HStack>
        </VStack>
      </Box>
    </Pressable>
  );
};
