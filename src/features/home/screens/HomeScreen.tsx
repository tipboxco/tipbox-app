import React from 'react';
import {
  SafeArea,
  ScrollContainer,
  VStack,
  HStack,
  Box,
  Text,
  Card,
  colors
} from '../../../components/ui';
import { useAuthStore } from '../../../store';

export const HomeScreen = () => {
  const { user } = useAuthStore();

  return (
    <SafeArea bg={colors.background}>
      {/* Header */}
      <Box bg={colors.primary[500]} px={5} py={6} pt={16}>
        <Text variant="heading" size="3xl" color={colors.white}>
          TipBox
        </Text>
        <Text variant="body" color={colors.primary[100]} style={{ marginTop: 4 }}>
          Merhaba, {user?.name || 'Misafir'}! 👋
        </Text>
      </Box>

      <ScrollContainer>
        <VStack spacing={6}>
          {/* Welcome Card */}
          <Card variant="elevated" size="lg">
            <VStack spacing={3}>
              <Text variant="subheading" color={colors.gray[700]}>
                Hoş Geldiniz!
              </Text>
              <Text variant="body" color={colors.gray[600]} style={{ lineHeight: 20 }}>
                TipBox uygulamasına hoş geldiniz. Alt menüden diğer sayfalara geçiş yapabilirsiniz.
              </Text>
            </VStack>
          </Card>

          {/* Quick Actions */}
          <Box>
            <Text variant="subheading" color={colors.gray[700]} style={{ marginBottom: 16 }}>
              Hızlı Erişim
            </Text>

            <VStack spacing={3}>
              <HStack spacing={3}>
                <Card variant="elevated" style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>🔍</Text>
                  <Text variant="label" color={colors.gray[700]}>Keşfet</Text>
                </Card>

                <Card variant="elevated" style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>👤</Text>
                  <Text variant="label" color={colors.gray[700]}>Profil</Text>
                </Card>
              </HStack>

              <HStack spacing={3}>
                <Card variant="elevated" style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>⚙️</Text>
                  <Text variant="label" color={colors.gray[700]}>Ayarlar</Text>
                </Card>

                <Card variant="elevated" style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>❓</Text>
                  <Text variant="label" color={colors.gray[700]}>Yardım</Text>
                </Card>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </ScrollContainer>
    </SafeArea>
  );
};

// Styles are now handled by GlueStack components 