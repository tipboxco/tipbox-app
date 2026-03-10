import React, { useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, Progress } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useSettingsStore } from '../../slice/settingsStore';
import { ArrowDownCircle, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useTranslation } from '@/src/hooks/useTranslation';

export const OTAUpdateCard = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('settings');

  const {
    isChecking,
    hasUpdate,
    updateInfo,
    error,
    downloadProgress,
    isInstalling,
    checkForUpdate,
    downloadUpdate,
    installUpdate,
  } = useSettingsStore();

  useEffect(() => {
    checkForUpdate();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const renderContent = () => {
    if (error) {
      return (
        <VStack space="md">
          <HStack space="sm" alignItems="center">
            <AlertCircle 
              size={20} 
              color={isDark ? '#ef4444' : '#dc2626'}
            />
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$md"
            >
              {t('settings:ota.errorOccurred')}
            </Text>
          </HStack>
          <Text
            color={isDark ? '$textDark200' : '$textLight700'}
            fontSize="$sm"
          >
            {error}
          </Text>
          <Button
            variant="outline"
            onPress={checkForUpdate}
            isDisabled={isChecking}
          >
            <Text>{t('settings:ota.retry')}</Text>
          </Button>
        </VStack>
      );
    }

    if (isChecking) {
      return (
        <HStack space="sm" alignItems="center">
          <RefreshCw 
            size={20}
            color={isDark ? '#A1A1AA' : '#71717A'}
          />
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize="$md"
          >
            {t('settings:ota.checkingUpdates')}
          </Text>
        </HStack>
      );
    }

    if (!hasUpdate) {
      return (
        <HStack space="sm" alignItems="center">
          <CheckCircle2 
            size={20}
            color={isDark ? '#22c55e' : '#16a34a'}
          />
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize="$md"
          >
            {t('settings:ota.appUpToDate')}
          </Text>
        </HStack>
      );
    }

    return (
      <VStack space="md">
        <HStack space="sm" alignItems="center">
          <ArrowDownCircle 
            size={20}
            color={isDark ? '#3b82f6' : '#2563eb'}
          />
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize="$md"
            fontWeight="$semibold"
          >
            {t('settings:ota.newUpdateAvailable')}
          </Text>
        </HStack>

        {updateInfo && (
          <VStack space="xs">
            <Text
              color={isDark ? '$textDark200' : '$textLight700'}
              fontSize="$sm"
            >
              Versiyon: {updateInfo.version} ({updateInfo.buildNumber})
            </Text>
            <Text
              color={isDark ? '$textDark200' : '$textLight700'}
              fontSize="$sm"
            >
              Boyut: {formatBytes(updateInfo.size)}
            </Text>
            {updateInfo.changelog && (
              <Text
                color={isDark ? '$textDark200' : '$textLight700'}
                fontSize="$sm"
              >
                {t('settings:ota.changelog', { changelog: updateInfo.changelog })}
              </Text>
            )}
          </VStack>
        )}

        {downloadProgress > 0 && downloadProgress < 100 && (
          <Progress
            value={downloadProgress}
            w="100%"
            size="sm"
            bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
          >
            <Progress.FilledTrack />
          </Progress>
        )}

        <Button
          onPress={downloadProgress === 100 ? installUpdate : downloadUpdate}
          isDisabled={isInstalling}
        >
          <Text color="$white">
            {downloadProgress === 100
              ? t('settings:ota.installUpdate')
              : downloadProgress > 0
                ? t('settings:ota.downloading')
                : t('settings:ota.downloadUpdate')}
          </Text>
        </Button>

        {updateInfo?.isRequired && (
          <Text
            color={isDark ? '#ef4444' : '#dc2626'}
            fontSize="$xs"
            textAlign="center"
          >
            {t('settings:ota.requiredUpdate')}
          </Text>
        )}
      </VStack>
    );
  };

  return (
    <Box
      bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
      borderRadius="$lg"
      p="$4"
      borderWidth={1}
      borderColor={isDark ? '$borderDark100' : '$borderLight200'}
    >
      {renderContent()}
    </Box>
  );
};
