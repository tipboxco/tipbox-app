import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Pressable,
  ActivityIndicator,
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
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { useDevices, useDeleteDevice } from '../../api/hooks';
import type { Device } from '../../types';

interface YourDevicesBottomSheetProps {
  onClose: () => void;
}

export const YourDevicesBottomSheet = ({ onClose }: YourDevicesBottomSheetProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
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
              <ToastTitle>Başarılı</ToastTitle>
              <ToastDescription>Cihaz başarıyla kaldırıldı</ToastDescription>
            </Toast>
          </Box>
        ),
      });
      refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Cihaz kaldırılırken bir hata oluştu';
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Hata</ToastTitle>
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
          color={isDark ? '#FFFFFF' : '#313131'}
        >
          {device.name}
        </Text>
        {device.location && (
          <Text
            fontSize={10}
            fontWeight="$medium"
            color="#C1BEBF"
          >
            {device.location}
          </Text>
        )}
        <Text
          fontSize={10}
          fontWeight="$medium"
          color="#C1BEBF"
        >
          {formatDate(device.date)}
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
        </HStack>
      ) : (
        <Pressable
          onPress={() => openDeleteDialog(device)}
          disabled={deleteMutation.isPending}
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
      {isLoading ? (
        <Box py="$10" alignItems="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
      ) : error ? (
        <Box py="$10" px="$4" alignItems="center">
          <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
            {error.message || 'Cihazlar yüklenirken bir hata oluştu'}
          </Text>
        </Box>
      ) : !devices || devices.length === 0 ? (
        <Box py="$10" px="$4" alignItems="center">
          <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$sm" textAlign="center">
            Bağlı cihaz bulunmuyor
          </Text>
        </Box>
      ) : (
        <VStack space="sm" mb="$6">
          {devices.map((device) => renderDeviceCard(device))}
        </VStack>
      )}

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
              Cihazı Kaldır
            </Text>
            <AlertDialogCloseButton>
              <Feather name="x" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </AlertDialogCloseButton>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text
              fontSize={12}
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              {deviceToDelete?.name} cihazını listeden kaldırmak istediğinizden emin misiniz?
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onPress={() => setShowDeleteDialog(false)}
              mr="$3"
              borderColor={isDark ? '#333333' : '#E5E5E5'}
            >
              <ButtonText color={isDark ? '#FFFFFF' : '#000000'}>İptal</ButtonText>
            </Button>
            <Button
              bg="#CE4A4A"
              onPress={handleDeleteDevice}
              disabled={deleteMutation.isPending}
              opacity={deleteMutation.isPending ? 0.5 : 1}
            >
              <ButtonText color="#FFFFFF">
                {deleteMutation.isPending ? 'Kaldırılıyor...' : 'Kaldır'}
              </ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VStack>
  );
};

export default YourDevicesBottomSheet;
