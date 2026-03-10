import React, { useCallback, useMemo } from 'react';
import {
    Box,
    ScrollView,
    VStack,
    Text,
    Pressable,
} from '@gluestack-ui/themed';
import { ChevronDownIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { OptionSelectBottomSheet, type OptionSelectBottomSheetOption } from './OptionSelectBottomSheet';
import type { ExperienceOption } from '../../api/postApi';
import { useTranslation } from '@/src/hooks/useTranslation';

const productInfo = {
    image: require('@/assets/product/product_01.png'),
    title: 'Dyson V15s\nDetect Submarine\u2122 Wet & Dry Cordl...',
};

interface StepOneScreenProps {
    /** Selected duration option ID */
    selectedDuration: string;
    /** Selected location option ID */
    selectedCondition: string;
    /** Selected purpose option ID */
    selectedFrequency: string;
    onDurationChange: (value: string) => void;
    onConditionChange: (value: string) => void;
    onFrequencyChange: (value: string) => void;
    selectedProduct?: { id: string; name: string; brand?: string; description?: string; image: any } | null;
    /** API'den gelen duration seçenekleri */
    durationOptions?: ExperienceOption[];
    /** API'den gelen location seçenekleri */
    locationOptions?: ExperienceOption[];
    /** API'den gelen purpose seçenekleri */
    purposeOptions?: ExperienceOption[];
}

const TRIGGER_HEIGHT = 44;
const TRIGGER_FONT_SIZE = 14;

/** ExperienceOption[] -> OptionSelectBottomSheetOption[] */
const toSheetOptions = (options: ExperienceOption[]): OptionSelectBottomSheetOption[] =>
    options.map((opt) => ({ label: opt.name, value: opt.id }));

/** ID'den display name lookup */
const findName = (options: ExperienceOption[], id: string): string =>
    options.find((opt) => opt.id === id)?.name ?? '';

export const StepOneScreen: React.FC<StepOneScreenProps> = ({
    selectedDuration,
    selectedCondition,
    selectedFrequency,
    onDurationChange,
    onConditionChange,
    onFrequencyChange,
    selectedProduct,
    durationOptions = [],
    locationOptions = [],
    purposeOptions = [],
}) => {
    const { t } = useTranslation('post');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

    // API options -> bottom sheet options
    const durationSheetOptions = useMemo(() => toSheetOptions(durationOptions), [durationOptions]);
    const locationSheetOptions = useMemo(() => toSheetOptions(locationOptions), [locationOptions]);
    const purposeSheetOptions = useMemo(() => toSheetOptions(purposeOptions), [purposeOptions]);

    // Resolve ID -> display name
    const durationDisplayName = useMemo(() => findName(durationOptions, selectedDuration), [durationOptions, selectedDuration]);
    const locationDisplayName = useMemo(() => findName(locationOptions, selectedCondition), [locationOptions, selectedCondition]);
    const purposeDisplayName = useMemo(() => findName(purposeOptions, selectedFrequency), [purposeOptions, selectedFrequency]);

    const openSelectSheet = useCallback(
        (title: string, options: OptionSelectBottomSheetOption[], value: string, onChange: (v: string) => void) => {
            openBottomSheet(
                <OptionSelectBottomSheet
                    title={title}
                    options={options}
                    selectedValue={value}
                    onSelect={onChange}
                    onClose={closeBottomSheet}
                />,
                {
                    enableDynamicSizing: false,
                    snapPoints: ['40%'],
                    enablePanDownToClose: true,
                    enableOverDrag: false,
                    enableHandlePanningGesture: true,
                    enableContentPanningGesture: true,
                    animateOnMount: true,
                    paddingBottom: bottomOffset,
                }
            );
        },
        [openBottomSheet, closeBottomSheet, bottomOffset]
    );

    const renderTrigger = (
        label: string,
        displayValue: string,
        onPress: () => void
    ) => (
        <Pressable onPress={onPress}>
            <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                borderWidth={1}
                borderColor="#E9E9E9"
                $dark-borderColor="$borderDark600"
                borderRadius={10}
                height={TRIGGER_HEIGHT}
                px="$3"
            >
                <Text
                    fontSize={TRIGGER_FONT_SIZE}
                    fontWeight="$medium"
                    color={displayValue ? (isDark ? '$textDark50' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
                    flex={1}
                >
                    {displayValue || label}
                </Text>
                <ChevronDownIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
        </Pressable>
    );

    return (
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <VStack space="md" pb={100}>
                {selectedProduct ? (
                    <Box px="$4" py="$2">
                        <ProductInfoCard
                            image={selectedProduct.image}
                            title={selectedProduct.name}
                            subName={selectedProduct.description}
                            size="big"
                            type={ProductInfoType.SUB_CATEGORY}
                        />
                    </Box>
                ) : (
                    <Box px="$4" py="$2">
                        <ProductInfoCard
                            image={productInfo.image}
                            title={productInfo.title}
                            size="big"
                            type={ProductInfoType.SUB_CATEGORY}
                        />
                    </Box>
                )}

                <VStack px={16} space="xs">
                    <VStack space="xs">
                        {renderTrigger(
                            t('create.experience.step1.selectDuration'),
                            durationDisplayName,
                            () => openSelectSheet(t('create.experience.step1.selectDuration'), durationSheetOptions, selectedDuration, onDurationChange)
                        )}
                    </VStack>

                    <VStack space="xs">
                        {renderTrigger(
                            t('create.experience.step1.selectLocation'),
                            locationDisplayName,
                            () => openSelectSheet(t('create.experience.step1.selectLocation'), locationSheetOptions, selectedCondition, onConditionChange)
                        )}
                    </VStack>

                    <VStack space="xs">
                        {renderTrigger(
                            t('create.experience.step1.selectPurpose'),
                            purposeDisplayName,
                            () => openSelectSheet(t('create.experience.step1.selectPurpose'), purposeSheetOptions, selectedFrequency, onFrequencyChange)
                        )}
                    </VStack>
                </VStack>
            </VStack>
        </ScrollView>
    );
};
