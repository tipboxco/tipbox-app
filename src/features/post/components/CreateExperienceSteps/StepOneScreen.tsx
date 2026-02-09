import React, { useCallback } from 'react';
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

const productInfo = {
    image: require('@/assets/product/product_01.png'),
    title: 'Dyson V15s\nDetect Submarine™ Wet & Dry Cordl...',
};

interface StepOneScreenProps {
    selectedDuration: string;
    selectedCondition: string;
    selectedFrequency: string;
    onDurationChange: (value: string) => void;
    onConditionChange: (value: string) => void;
    onFrequencyChange: (value: string) => void;
    selectedProduct?: { id: string; name: string; brand?: string; description?: string; image: any } | null;
}

const durationOptions: OptionSelectBottomSheetOption[] = [
    { label: '2 Weeks', value: '2 Weeks' },
    { label: '1 Month', value: '1 Month' },
    { label: '3 Months', value: '3 Months' },
    { label: '6 Months', value: '6 Months' },
    { label: '1 Year', value: '1 Year' },
    { label: 'More than 1 Year', value: 'More than 1 Year' },
];
const conditionOptions: OptionSelectBottomSheetOption[] = [
    { label: 'Could Be Better', value: 'Could Be Better' },
    { label: 'Good', value: 'Good' },
    { label: 'Excellent', value: 'Excellent' },
    { label: 'Perfect', value: 'Perfect' },
];
const frequencyOptions: OptionSelectBottomSheetOption[] = [
    { label: 'Daily Use', value: 'Daily Use' },
    { label: 'Weekly Use', value: 'Weekly Use' },
    { label: 'Monthly Use', value: 'Monthly Use' },
    { label: 'Rarely Use', value: 'Rarely Use' },
];

const TRIGGER_HEIGHT = 44;
const TRIGGER_FONT_SIZE = 14;

export const StepOneScreen: React.FC<StepOneScreenProps> = ({
    selectedDuration,
    selectedCondition,
    selectedFrequency,
    onDurationChange,
    onConditionChange,
    onFrequencyChange,
    selectedProduct,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

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
        value: string,
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
                    color={value ? (isDark ? '$textDark50' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
                    flex={1}
                >
                    {value || label}
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
                            'Select duration',
                            selectedDuration,
                            () => openSelectSheet('Select duration', durationOptions, selectedDuration, onDurationChange)
                        )}
                    </VStack>

                    <VStack space="xs">
                        {renderTrigger(
                            'Select condition',
                            selectedCondition,
                            () => openSelectSheet('Select condition', conditionOptions, selectedCondition, onConditionChange)
                        )}
                    </VStack>

                    <VStack space="xs">
                        {renderTrigger(
                            'Select frequency',
                            selectedFrequency,
                            () => openSelectSheet('Select frequency', frequencyOptions, selectedFrequency, onFrequencyChange)
                        )}
                    </VStack>
                </VStack>
            </VStack>
        </ScrollView>
    );
};
