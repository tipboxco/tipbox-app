import React from 'react';
import {
    Box,
    Text,
    VStack,
    HStack,
    Progress,
    Image,
    Pressable,
} from '@gluestack-ui/themed';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { LadderItem } from '../../types';
import { ScrollView } from 'react-native';

interface LadderDetailBottomSheetProps {
    item: LadderItem;
    onClose: () => void;
}

export const LadderDetailBottomSheet: React.FC<LadderDetailBottomSheetProps> = ({
    item,
    onClose,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
              <Box
        bg="transparent"
        flex={1}
      >

            {/* Header */}
            <HStack px="$4" mt="$6" alignItems="center" justifyContent="space-between">
                <Pressable onPress={onClose}>
                    <FeatherIcon name="chevron-left" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                </Pressable>
                <Text
                    fontSize="$lg"
                    fontWeight="$bold"
                    color={isDark ? '$textLight0' : '$textDark0'}
                >
                    {item.title}
                </Text>
                <Box width={24} />
            </HStack>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Box px="$4" mt="$6">
                    {/* Description Section */}
                    <Box
                        bg={isDark ? '$backgroundDark800' : '$white'}
                        borderRadius="$lg"
                        p="$2"
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark800' : '$borderLight200'}
                    >
                        <HStack alignItems="center" p="$2">
                            <Image
                                source={require('@/assets/bridge/card-icon.png')}
                                alt="Card Icon"
                                width={50}
                                height={50}
                            />
                            <VStack space="md" ml="$3">
                                <Text
                                    fontSize="$sm"
                                    fontWeight="$semibold"
                                    color={isDark ? '$textLight0' : '$textDark0'}
                                >
                                    Açıklama
                                </Text>
                                <Text
                                    fontSize="$xs"
                                    color={isDark ? '$textLight0' : '$textDark0'}
                                    opacity={0.7}
                                >
                                    {item.description}
                                </Text>
                            </VStack>
                        </HStack>
                    </Box>

                    {/* Stats Section */}
                    <HStack space="md" mt="$3">
                        <Box
                            flex={1}
                            bg={isDark ? '$backgroundDark800' : '$white'}
                            borderRadius="$lg"
                            p="$4"
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark800' : '$borderLight200'}
                        >
                            <HStack alignItems="center" space="sm">
                                <Box
                                    p="$2"
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight100'}
                                    borderRadius="$lg"
                                >
                                    <FeatherIcon name="users" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
                                </Box>
                                <Text
                                    fontSize="$sm"
                                    fontWeight="$semibold"
                                    color={isDark ? '$textLight0' : '$textDark0'}
                                >
                                    Statistic
                                </Text>
                            </HStack>
                            <Box
                                height={1}
                                bg={isDark ? '$borderDark800' : '$borderLight200'}
                                my="$3"
                            />
                            <VStack>
                                <Text
                                    fontSize="$xl"
                                    fontWeight="$semibold"
                                    color={isDark ? '$textLight0' : '$textDark0'}
                                >
                                    %87
                                </Text>
                                <Text
                                    fontSize="$xs"
                                    color={isDark ? '$textLight0' : '$textDark0'}
                                    opacity={0.7}
                                >
                                    Complete of 1M+ User
                                </Text>
                            </VStack>
                        </Box>

                        <Box
                            flex={1}
                            bg={isDark ? '$backgroundDark800' : '$white'}
                            borderRadius="$lg"
                            p="$4"
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark800' : '$borderLight200'}
                        >
                            <HStack alignItems="center" space="sm">
                                <Box
                                    p="$2"
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight100'}
                                    borderRadius="$lg"
                                >
                                    <FeatherIcon name="award" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
                                </Box>
                                <Text
                                    fontSize="$sm"
                                    fontWeight="$semibold"
                                    color={isDark ? '$textLight0' : '$textDark0'}
                                >
                                    Rewards
                                </Text>
                            </HStack>
                            <Box
                                height={1}
                                bg={isDark ? '$borderDark800' : '$borderLight200'}
                                my="$5"
                            />
                            <HStack space="sm" alignItems="center">
                                <Image
                                    source={require('@/assets/badges/rozet_01.png')}
                                    alt="Badge"
                                    width={26}
                                    height={20}
                                />
                                <Text
                                    fontSize="$xs"
                                    fontWeight="$semibold"
                                    color={isDark ? '$textLight0' : '$textDark0'}
                                >
                                    Rozet Adı
                                </Text>
                            </HStack>
                        </Box>
                    </HStack>

                    {/* Tasks Section */}
                    <VStack space="sm" mt="$3">
                        <Box
                            bg={isDark ? '$backgroundDark800' : '$white'}
                            borderRadius="$lg"
                            p="$4"
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark800' : '$borderLight200'}
                        >
                            <HStack alignItems="center" space="sm">
                                <Box
                                    width={36}
                                    height={36}
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight100'}
                                    borderRadius="$md"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <FeatherIcon name="message-circle" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                                </Box>
                                <VStack flex={1}>
                                    <Text
                                        fontSize="$xs"
                                        fontWeight="$semibold"
                                        color={isDark ? '$textLight0' : '$textDark0'}
                                    >
                                        150 Yorum Yap
                                    </Text>
                                    <Box mt="$2">
                                        <Progress
                                            value={75}
                                            bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                                        >
                                            <Progress.FilledTrack bg={isDark ? '$primary400' : '$primary500'} />
                                        </Progress>
                                    </Box>
                                </VStack>
                                <Box
                                    width={14}
                                    height={14}
                                    borderRadius={7}
                                    bg={isDark ? '$primary400' : '$primary500'}
                                />
                            </HStack>
                        </Box>

                        <Box
                            bg={isDark ? '$backgroundDark800' : '$white'}
                            borderRadius="$lg"
                            p="$4"
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark800' : '$borderLight200'}
                        >
                            <HStack alignItems="center" space="sm">
                                <Box
                                    width={36}
                                    height={36}
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight100'}
                                    borderRadius="$md"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <FeatherIcon name="edit" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                                </Box>
                                <VStack flex={1}>
                                    <Text
                                        fontSize="$xs"
                                        fontWeight="$semibold"
                                        color={isDark ? '$textLight0' : '$textDark0'}
                                    >
                                        20 Deneyim Paylaş
                                    </Text>
                                    <Box mt="$2">
                                        <Progress
                                            value={50}
                                            bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                                        >
                                            <Progress.FilledTrack bg={isDark ? '$primary400' : '$primary500'} />
                                        </Progress>
                                    </Box>
                                </VStack>
                            </HStack>
                        </Box>

                        <Box
                            bg={isDark ? '$backgroundDark800' : '$white'}
                            borderRadius="$lg"
                            p="$4"
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark800' : '$borderLight200'}
                        >
                            <HStack alignItems="center" space="sm">
                                <Box
                                    width={36}
                                    height={36}
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight100'}
                                    borderRadius="$md"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <FeatherIcon name="star" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                                </Box>
                                <VStack flex={1}>
                                    <Text
                                        fontSize="$xs"
                                        fontWeight="$semibold"
                                        color={isDark ? '$textLight0' : '$textDark0'}
                                    >
                                        Şunu Yap
                                    </Text>
                                    <Box mt="$2">
                                        <Progress
                                            value={25}
                                            bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                                        >
                                            <Progress.FilledTrack bg={isDark ? '$primary400' : '$primary500'} />
                                        </Progress>
                                    </Box>
                                </VStack>
                            </HStack>
                        </Box>

                        <Box
                            bg={isDark ? '$backgroundDark800' : '$white'}
                            borderRadius="$lg"
                            p="$4"
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark800' : '$borderLight200'}
                        >
                            <HStack alignItems="center" space="sm">
                                <Box
                                    width={36}
                                    height={36}
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight100'}
                                    borderRadius="$md"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <FeatherIcon name="heart" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                                </Box>
                                <VStack flex={1}>
                                    <Text
                                        fontSize="$xs"
                                        fontWeight="$semibold"
                                        color={isDark ? '$textLight0' : '$textDark0'}
                                    >
                                        Bunu Yap
                                    </Text>
                                    <Box mt="$2">
                                        <Progress
                                            value={100}
                                            bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                                        >
                                            <Progress.FilledTrack bg={isDark ? '$primary400' : '$primary500'} />
                                        </Progress>
                                    </Box>
                                </VStack>
                            </HStack>
                        </Box>
                    </VStack>
                </Box>
            </ScrollView>
        </Box>
    );
};
