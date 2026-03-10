import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  ScrollView,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { XMarkIcon, DevicePhoneMobileIcon, EllipsisHorizontalIcon, ChevronLeftIcon } from 'react-native-heroicons/outline';
import { useDevices, useDeleteDevice } from '../../api/hooks';
import type { Device } from '../../types';
import { useTranslation } from 'react-i18next';

interface YourDevicesBottomSheetProps {
  onClose: () => void;
}

export const YourDevicesBottomSheet = ({ onClose }: YourDevicesBottomSheetProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('settings');
  const toast = useToast();

  // API hooks
  const { data: devices, isLoading, error, refetch } = useDevices();
  const deleteMutation = useDeleteDevice();

  // Delete confirmation state
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateString;
    }
  };

  // Handle device delete
  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;

    try {
      await deleteMutation.mutateAsync(deviceToDelete.id);
      setShowDeleteDialog(false);
      setDeviceToDelete(null);
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Success</ToastTitle>
              <ToastDescription>Device has been successfully removed</ToastDescription>
            </Toast>
          </Box>
        ),
      });
      refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          t('yourDevices.removeError');
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>{errorMessage}</ToastDescription>
            </Toast>
          </Box>
        ),
      });
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (device: Device) => {
    setDeviceToDelete(device);
    setShowDeleteDialog(true);
  };

  const renderDeviceCard = (device: Device) => (
    <Box
      key={device.id}
      borderWidth={1}
      borderColor="#C0C0C0"
      borderStyle="dashed"
      borderRadius={10}
      px="$4"
      py="$3"
      mb="$3"
      flexDirection="row"
      alignItems="center"
      bg={isDark ? '#1A1A1A' : '#FFFFFF'}
    >
      {/* Device Icon - Left side */}
      <Box
        width={40}
        height={40}
        borderRadius={20}
        bg="#D9D9D9"
        alignItems="center"
        justifyContent="center"
        mr="$3"
      >
        <DevicePhoneMobileIcon 
          width={20} 
          height={20} 
          color={isDark ? '#666666' : '#999999'} 
        />
      </Box>

      {/* Device Info - Center */}
      <VStack flex={1} space="xs">
        <Text
          fontSize={11}
          fontWeight="$bold"
          color={isDark ? '#FFFFFF' : '#000000'}
        >
          {device.name}
        </Text>
        <HStack alignItems="center" space="xs">
          {device.location && (
            <>
              <Text
                fontSize={10}
                fontWeight="$normal"
                color="#B9B9B9"
              >
                {device.location}
              </Text>
              <Text
                fontSize={10}
                fontWeight="$normal"
                color="#B9B9B9"
              >
                ,
              </Text>
            </>
          )}
          <Text
            fontSize={10}
            fontWeight="$normal"
            color="#B9B9B9"
          >
            {formatDate(device.date)}
          </Text>
        </HStack>
      </VStack>

      {/* Active Badge or More Options - Right side */}
      {device.isActive ? (
        <Box
          bg="#EFEFEF"
          borderRadius={5}
          px="$3"
          py="$1"
          ml="$2"
        >
          <Text
            fontSize={9}
            fontWeight="$medium"
            color="#000000"
          >
            Active
          </Text>
        </Box>
      ) : (
        <Pressable
          onPress={() => openDeleteDialog(device)}
          disabled={deleteMutation.isPending}
          ml="$2"
        >
          <Box
            width={24}
            height={24}
            borderRadius={12}
            bg="#D9D9D9"
            alignItems="center"
            justifyContent="center"
            opacity={deleteMutation.isPending ? 0.5 : 1}
          >
            <EllipsisHorizontalIcon 
              width={16} 
              height={16} 
              color={isDark ? '#666666' : '#999999'} 
            />
          </Box>
        </Pressable>
      )}
    </Box>
  );

  return (
    <VStack flex={1} px="$4" py="$4">
      {/* Header */}
      <HStack justifyContent="space-between" alignItems="center" mb="$4">
        <Pressable onPress={onClose}>
          <ChevronLeftIcon 
            width={24} 
            height={24} 
            color={isDark ? '#FFFFFF' : '#000000'} 
          />
        </Pressable>
        <Text
          fontSize={16}
          fontWeight="$bold"
          color={isDark ? '#FFFFFF' : '#000000'}
          textAlign="center"
          flex={1}
        >
          Linked Devices
        </Text>
        <Box width={24} />
      </HStack>

      {/* Device List */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <Box py="$10" alignItems="center">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
          </Box>
        ) : error ? (
          <Box py="$10" px="$4" alignItems="center">
            <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
              {error.message || t('yourDevices.loadError')}
            </Text>
          </Box>
        ) : !devices || devices.length === 0 ? (
          <Box py="$10" px="$4" alignItems="center">
            <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$sm" textAlign="center">
              No linked devices found
            </Text>
          </Box>
        ) : (
          <VStack space="xs" mb="$4">
            {devices.map((device) => renderDeviceCard(device))}
          </VStack>
        )}
      </ScrollView>

      {/* Log Out Text */}
      <Pressable
        onPress={() => {
          console.log('Log out from all devices except this one');
          // TODO: Implement log out from all devices except current
        }}
        py="$2"
        mt="auto"
      >
        <Text
          color={isDark ? '#FFFFFF' : '#000000'}
          fontSize={9}
          fontWeight="$medium"
          textAlign="center"
          underline
        >
          Log Out from All Devices Except This One
        </Text>
      </Pressable>

      {/* Delete Device Confirmation Dialog */}
      <AlertDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
          <AlertDialogHeader>
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Remove Device
            </Text>
            <AlertDialogCloseButton>
              <XMarkIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </AlertDialogCloseButton>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text
              fontSize={12}
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Are you sure you want to remove {deviceToDelete?.name} from the list?
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onPress={() => setShowDeleteDialog(false)}
              mr="$3"
              borderColor={isDark ? '#333333' : '#E5E5E5'}
            >
              <ButtonText color={isDark ? '#FFFFFF' : '#000000'}>Cancel</ButtonText>
            </Button>
            <Button
              bg="#CE4A4A"
              onPress={handleDeleteDevice}
              disabled={deleteMutation.isPending}
              opacity={deleteMutation.isPending ? 0.5 : 1}
            >
              <ButtonText color="#FFFFFF">
                {deleteMutation.isPending ? 'Removing...' : 'Remove'}
              </ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VStack>
  );
};

export default YourDevicesBottomSheet;
