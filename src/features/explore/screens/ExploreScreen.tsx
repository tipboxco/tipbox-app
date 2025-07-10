import React from 'react';
import { 
  SafeArea, 
  ScrollContainer, 
  VStack, 
  HStack,
  Box, 
  Text, 
  Card,
  Input,
  colors 
} from '../../../components/ui';

export const ExploreScreen = () => {
  return (
    <SafeArea bg={colors.background}>
      {/* Header */}
      <Box bg={colors.primary[500]} px={5} py={6} pt={16}>
        <Text variant="heading" size="3xl" color={colors.white}>
          Keşfet
        </Text>
        <Text variant="body" color={colors.primary[100]} style={{ marginTop: 4 }}>
          Yeni içerikleri keşfedin
        </Text>
      </Box>

      <ScrollContainer>
        <VStack spacing={6}>
          {/* Search Section */}
          <Input
            placeholder="Ne aramak istiyorsunuz?"
            variant="filled"
            size="lg"
          />

          {/* Categories Section */}
          <Box>
            <Text variant="subheading" color={colors.gray[700]} style={{ marginBottom: 16 }}>
              📂 Kategoriler
            </Text>
            
            <VStack spacing={3}>
              <HStack spacing={3}>
                <Card variant="elevated" style={{ flex: 1 }}>
                  <VStack spacing={2} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>🎯</Text>
                    <Text variant="label" color={colors.gray[700]} style={{ textAlign: 'center' }}>
                      Hedefler
                    </Text>
                  </VStack>
                </Card>
                
                <Card variant="elevated" style={{ flex: 1 }}>
                  <VStack spacing={2} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>💡</Text>
                    <Text variant="label" color={colors.gray[700]} style={{ textAlign: 'center' }}>
                      İpuçları
                    </Text>
                  </VStack>
                </Card>
              </HStack>
              
              <HStack spacing={3}>
                <Card variant="elevated" style={{ flex: 1 }}>
                  <VStack spacing={2} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>📚</Text>
                    <Text variant="label" color={colors.gray[700]} style={{ textAlign: 'center' }}>
                      Eğitim
                    </Text>
                  </VStack>
                </Card>
                
                <Card variant="elevated" style={{ flex: 1 }}>
                  <VStack spacing={2} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>🚀</Text>
                    <Text variant="label" color={colors.gray[700]} style={{ textAlign: 'center' }}>
                      Motivasyon
                    </Text>
                  </VStack>
                </Card>
              </HStack>
            </VStack>
          </Box>

          {/* Popular Content */}
          <Box>
            <Text variant="subheading" color={colors.gray[700]} style={{ marginBottom: 16 }}>
              🔥 Popüler İçerikler
            </Text>
            
            <VStack spacing={3}>
              <Card variant="elevated">
                <VStack spacing={3}>
                  <HStack style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box style={{ flex: 1 }}>
                      <Text variant="subheading" size="lg" color={colors.gray[800]}>
                        Günlük Hedefler Nasıl Belirlenir?
                      </Text>
                      <Text variant="caption" color={colors.gray[500]} style={{ marginTop: 4 }}>
                        2 gün önce • 5 dakika okuma
                      </Text>
                    </Box>
                    <Text style={{ fontSize: 20 }}>🎯</Text>
                  </HStack>
                  <Text variant="body" color={colors.gray[600]}>
                    Etkili günlük hedef belirleme teknikleri ve sürdürülebilir başarı ipuçları...
                  </Text>
                </VStack>
              </Card>

              <Card variant="elevated">
                <VStack spacing={3}>
                  <HStack style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box style={{ flex: 1 }}>
                      <Text variant="subheading" size="lg" color={colors.gray[800]}>
                        Motivasyon Kaybı ile Başa Çıkma
                      </Text>
                      <Text variant="caption" color={colors.gray[500]} style={{ marginTop: 4 }}>
                        1 hafta önce • 3 dakika okuma
                      </Text>
                    </Box>
                    <Text style={{ fontSize: 20 }}>💪</Text>
                  </HStack>
                  <Text variant="body" color={colors.gray[600]}>
                    Zorlu zamanlarda motivasyonunuzu korumak için pratik stratejiler...
                  </Text>
                </VStack>
              </Card>

              <Card variant="elevated">
                <VStack spacing={3}>
                  <HStack style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box style={{ flex: 1 }}>
                      <Text variant="subheading" size="lg" color={colors.gray[800]}>
                        Zaman Yönetimi Teknikleri
                      </Text>
                      <Text variant="caption" color={colors.gray[500]} style={{ marginTop: 4 }}>
                        3 gün önce • 7 dakika okuma
                      </Text>
                    </Box>
                    <Text style={{ fontSize: 20 }}>⏰</Text>
                  </HStack>
                  <Text variant="body" color={colors.gray[600]}>
                    Verimliliğinizi artıracak kanıtlanmış zaman yönetimi yöntemleri...
                  </Text>
                </VStack>
              </Card>
            </VStack>
          </Box>
        </VStack>
      </ScrollContainer>
    </SafeArea>
  );
};

// Styles are now handled by GlueStack components 