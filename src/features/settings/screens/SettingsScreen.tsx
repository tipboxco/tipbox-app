import React from 'react';
import { Switch } from 'react-native';
import { 
  SafeArea, 
  ScrollContainer, 
  VStack, 
  HStack,
  Box, 
  Text, 
  Card,
  Button as PressableButton,
  colors 
} from '../../../components/ui';
import { useAppStore } from '../../../store';

export const SettingsScreen = () => {
  const { theme, language, setTheme, setLanguage } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };

  return (
    <SafeArea bg={colors.background}>
      {/* Header */}
      <Box bg={colors.primary[500]} px={5} py={6} pt={16}>
        <Text variant="heading" size="3xl" color={colors.white}>
          Ayarlar
        </Text>
        <Text variant="body" color={colors.primary[100]} style={{ marginTop: 4 }}>
          Uygulama tercihlerinizi düzenleyin
        </Text>
      </Box>

      <ScrollContainer>
        <VStack spacing={6}>
          {/* Appearance Section */}
          <Box>
            <Text variant="subheading" color={colors.gray[700]} style={{ marginBottom: 12 }}>
              🎨 Görünüm
            </Text>
            
            <Card variant="elevated">
              <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Box style={{ flex: 1 }}>
                  <Text variant="label" weight="medium" color={colors.gray[700]}>
                    Koyu Tema
                  </Text>
                  <Text variant="caption" color={colors.gray[600]} style={{ marginTop: 2 }}>
                    {theme === 'dark' ? 'Aktif' : 'Pasif'}
                  </Text>
                </Box>
                <Switch
                  value={theme === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.gray[200], true: colors.primary[500] }}
                  thumbColor={theme === 'dark' ? colors.white : colors.gray[50]}
                />
              </HStack>
            </Card>
          </Box>

          {/* Language Section */}
          <Box>
            <Text variant="subheading" color={colors.gray[700]} style={{ marginBottom: 12 }}>
              🌍 Dil
            </Text>
            
            <PressableButton
              variant="ghost"
              colorScheme="gray"
              onPress={toggleLanguage}
              style={{ padding: 0 }}
            >
              <Card variant="elevated" style={{ width: '100%' }}>
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box style={{ flex: 1 }}>
                    <Text variant="label" weight="medium" color={colors.gray[700]}>
                      Uygulama Dili
                    </Text>
                    <Text variant="caption" color={colors.gray[600]} style={{ marginTop: 2 }}>
                      {language === 'tr' ? 'Türkçe' : 'English'}
                    </Text>
                  </Box>
                  <Text size="xl" color={colors.gray[400]}>›</Text>
                </HStack>
              </Card>
            </PressableButton>
          </Box>

          {/* Notifications Section */}
          <Box>
            <Text variant="subheading" color={colors.gray[700]} style={{ marginBottom: 12 }}>
              🔔 Bildirimler
            </Text>
            
            <VStack spacing={2}>
              <Card variant="elevated">
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box style={{ flex: 1 }}>
                    <Text variant="label" weight="medium" color={colors.gray[700]}>
                      Push Bildirimleri
                    </Text>
                    <Text variant="caption" color={colors.gray[600]} style={{ marginTop: 2 }}>
                      Anlık bildirimler alın
                    </Text>
                  </Box>
                  <Switch
                    value={true}
                    trackColor={{ false: colors.gray[200], true: colors.primary[500] }}
                    thumbColor={colors.white}
                  />
                </HStack>
              </Card>

              <Card variant="elevated">
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box style={{ flex: 1 }}>
                    <Text variant="label" weight="medium" color={colors.gray[700]}>
                      Email Bildirimleri
                    </Text>
                    <Text variant="caption" color={colors.gray[600]} style={{ marginTop: 2 }}>
                      Email ile bildirim alın
                    </Text>
                  </Box>
                  <Switch
                    value={false}
                    trackColor={{ false: colors.gray[200], true: colors.primary[500] }}
                    thumbColor={colors.gray[50]}
                  />
                </HStack>
              </Card>
            </VStack>
          </Box>

          {/* App Info Section */}
          <Box>
            <Text variant="subheading" color={colors.gray[700]} style={{ marginBottom: 12 }}>
              ℹ️ Uygulama
            </Text>
            
            <VStack spacing={2}>
              <Card variant="elevated">
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box style={{ flex: 1 }}>
                    <Text variant="label" weight="medium" color={colors.gray[700]}>
                      Sürüm
                    </Text>
                    <Text variant="caption" color={colors.gray[600]} style={{ marginTop: 2 }}>
                      1.0.0
                    </Text>
                  </Box>
                </HStack>
              </Card>

              <Card variant="elevated">
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box style={{ flex: 1 }}>
                    <Text variant="label" weight="medium" color={colors.gray[700]}>
                      Gizlilik Politikası
                    </Text>
                    <Text variant="caption" color={colors.gray[600]} style={{ marginTop: 2 }}>
                      Veri kullanım politikamız
                    </Text>
                  </Box>
                  <Text size="xl" color={colors.gray[400]}>›</Text>
                </HStack>
              </Card>
            </VStack>
          </Box>
        </VStack>
      </ScrollContainer>
    </SafeArea>
  );
};

// Styles are now handled by GlueStack components 