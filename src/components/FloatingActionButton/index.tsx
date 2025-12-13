import React from 'react';
import { Box, Pressable, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useBottomOffset } from '@/src/utils';

interface ExpertButtonProps {
  onPress: () => void;
  /**
   * Tab bar'ın üstünde ekstra boşluk (default: 16)
   */
  extraPadding?: number;
}

export const ExpertButton: React.FC<ExpertButtonProps> = ({ onPress, extraPadding = 32 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding });

  return (
    <Pressable
      position="absolute"
      bottom={bottomOffset}
      right={16}
      width={68}
      height={68}
      borderRadius={34}
      bg="rgba(232, 255, 107, 0.5)"
      borderWidth={1}
      borderColor="rgba(178, 199, 66, 0.5)"
      justifyContent="center"
      alignItems="center"
      onPress={onPress}
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.25}
      shadowRadius={4}
      elevation={5}
    >
      {/* Inner Circle */}
      <Box
        width={58}
        height={58}
        borderRadius={29}
        bg="#E8FF6B"
        borderWidth={1}
        borderColor="#B2C742"
        justifyContent="center"
        alignItems="center"
      >
        {/* Expert Image */}
        <Box
          width={42}
          height={42}
          justifyContent="center"
          alignItems="center"
        >
          <Image
            source={require('@/assets/expert.png')}
            alt="Expert"
            width={36}
            height={36}
            resizeMode="contain"
          />
        </Box>
      </Box>
    </Pressable>
  );
};

export default ExpertButton;
