import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

interface Device {
  id: string;
  name: string;
  location: string;
  date: string;
  isActive: boolean;
}

interface YourDevicesBottomSheetProps {
  onClose: () => void;
}

export const YourDevicesBottomSheet = ({ onClose }: YourDevicesBottomSheetProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const devices: Device[] = [
    {
      id: '1',
      name: 'Iphone 15 Pro',
      location: 'Istanbul, Turkiye',
      date: '19.03.2025',
      isActive: true,
    },
    {
      id: '2',
      name: 'Huawei Mate 20 Pro',
      location: 'Istanbul, Turkiye',
      date: '19.03.2025',
      isActive: false,
    },
    {
      id: '3',
      name: 'IPhone 14',
      location: 'Konya, Turkiye',
      date: '19.03.2025',
      isActive: false,
    },
  ];

  const renderDeviceCard = (device: Device) => (
    <Box
      key={device.id}
      borderWidth={1}
      borderColor="#C0C0C0"
      borderStyle="dashed"
      borderRadius={10}
      height={70}
      px="$4"
      py="$3"
      flexDirection="row"
      alignItems="center"
    >
      {/* Device Icon */}
      <Box
        width={30}
        height={30}
        borderRadius={15}
        bg="#D9D9D9"
        alignItems="center"
        justifyContent="center"
        mr="$3"
      >
        <Feather
          name="smartphone"
          size={16}
          color={isDark ? '#FFFFFF' : '#000000'}
        />
      </Box>

      {/* Device Info */}
      <VStack flex={1} space="xs">
        <Text
          fontSize={12}
          fontWeight="$medium"
          color="#313131"
        >
          {device.name}
        </Text>
        <Text
          fontSize={10}
          fontWeight="$medium"
          color="#C1BEBF"
        >
          {device.location}
        </Text>
        <Text
          fontSize={10}
          fontWeight="$medium"
          color="#C1BEBF"
        >
          {device.date}
        </Text>
      </VStack>

      {/* Active Badge or More Options */}
      {device.isActive ? (
        <HStack alignItems="center" space="sm">
          <Box
            bg="#EFEFEF"
            borderRadius={5}
            px="$5"
            py="$1"
          >
            <Text
              fontSize={9}
              fontWeight="$medium"
              color="#000000"
            >
              Active
            </Text>
          </Box>
          <Box
            width={24}
            height={24}
            borderRadius={12}
            bg="#D9D9D9"
            alignItems="center"
            justifyContent="center"
          >
            <Feather
              name="more-horizontal"
              size={16}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Box>
        </HStack>
      ) : (
        <Pressable
          onPress={() => {
            // Handle device options (remove, etc.)
            console.log('Device options for:', device.name);
          }}
        >
          <Box
            width={24}
            height={24}
            borderRadius={12}
            bg="#D9D9D9"
            alignItems="center"
            justifyContent="center"
          >
            <Feather
              name="more-horizontal"
              size={16}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Box>
        </Pressable>
      )}
    </Box>
  );

  return (
    <VStack flex={1} px="$4" py="$4">
      {/* Header */}
      <HStack justifyContent="center" alignItems="center" mb="$4">
        <Text
          fontSize={16}
          fontWeight="$bold"
          color={isDark ? '#FFFFFF' : '#000000'}
          textAlign="center"
          flex={1}
        >
          Linked Devices
        </Text>
      </HStack>

      {/* Device List */}
      <VStack space="sm" mb="$6">
        {devices.map((device) => renderDeviceCard(device))}
      </VStack>

      {/* Log Out Text */}
      <Pressable
        onPress={() => {
          console.log('Log out from all devices except this one');
          onClose();
        }}
        py="$2"
      >
        <Text
          color={isDark ? '#FFFFFF' : '#000000'}
          fontSize={9}
          fontWeight="$medium"
          textAlign="center"
        >
          Log Out from All Devices Except This One
        </Text>
      </Pressable>
    </VStack>
  );
};

export default YourDevicesBottomSheet;
