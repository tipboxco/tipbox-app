import React from 'react';
import { 
    Box, 
    ScrollView, 
    VStack, 
    Text, 
    Select,
    SelectTrigger,
    SelectInput,
    SelectIcon,
    SelectPortal,
    SelectBackdrop,
    SelectContent,
    SelectDragIndicatorWrapper,
    SelectDragIndicator,
    SelectItem,
    ChevronDownIcon
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';

// Mock data for product info
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
}

// Experience options
const durationOptions = ['2 Weeks', '1 Month', '3 Months', '6 Months', '1 Year', 'More than 1 Year'];
const conditionOptions = ['Could Be Better', 'Good', 'Excellent', 'Perfect'];
const frequencyOptions = ['Daily Use', 'Weekly Use', 'Monthly Use', 'Rarely Use'];

export const StepOneScreen: React.FC<StepOneScreenProps> = ({
    selectedDuration,
    selectedCondition,
    selectedFrequency,
    onDurationChange,
    onConditionChange,
    onFrequencyChange,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <ScrollView 
            flex={1} 
            showsVerticalScrollIndicator={false}
        >
            <VStack space="md" pb={100}>
                {/* Product Info Card */}
                <Box px="$4" py="$2">
                    <ProductInfoCard
                        image={productInfo.image}
                        title={productInfo.title}
                        type="big"
                    />
                </Box>

                {/* Experience Section */}
                <VStack px={16} space="xs">
                    {/* Duration Selectbox */}
                    <VStack space="xs">
                        <Select
                            selectedValue={selectedDuration}
                            onValueChange={onDurationChange}
                        >
                            <SelectTrigger
                                variant="outline"
                                size="md"
                                bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                $dark-borderColor="$borderDark600"
                                borderRadius={10}
                                height={44}
                            >
                                <SelectInput
                                    placeholder="Select duration"
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    color={selectedDuration ? (isDark ? '$textDark50' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
                                    fontSize={10}
                                    fontWeight="$medium"
                                />
                                <SelectIcon mr="$3" as={ChevronDownIcon} />
                            </SelectTrigger>
                            <SelectPortal>
                                <SelectBackdrop />
                                <SelectContent>
                                    <SelectDragIndicatorWrapper>
                                        <SelectDragIndicator />
                                    </SelectDragIndicatorWrapper>
                                    {durationOptions.map((option) => (
                                        <SelectItem
                                            key={option}
                                            label={option}
                                            value={option}
                                        />
                                    ))}
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                    </VStack>

                    {/* Condition Selectbox */}
                    <VStack space="xs">
                        <Select
                            selectedValue={selectedCondition}
                            onValueChange={onConditionChange}
                        >
                            <SelectTrigger
                                variant="outline"
                                size="md"
                                bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                $dark-borderColor="$borderDark600"
                                borderRadius={10}
                                height={44}
                            >
                                <SelectInput
                                    placeholder="Select condition"
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    color={selectedCondition ? (isDark ? '$textDark50' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
                                    fontSize={10}
                                    fontWeight="$medium"
                                />
                                <SelectIcon mr="$3" as={ChevronDownIcon} />
                            </SelectTrigger>
                            <SelectPortal>
                                <SelectBackdrop />
                                <SelectContent>
                                    <SelectDragIndicatorWrapper>
                                        <SelectDragIndicator />
                                    </SelectDragIndicatorWrapper>
                                    {conditionOptions.map((option) => (
                                        <SelectItem
                                            key={option}
                                            label={option}
                                            value={option}
                                        />
                                    ))}
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                    </VStack>

                    {/* Frequency Selectbox */}
                    <VStack space="xs">
                        <Select
                            selectedValue={selectedFrequency}
                            onValueChange={onFrequencyChange}
                        >
                            <SelectTrigger
                                variant="outline"
                                size="md"
                                bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                $dark-borderColor="$borderDark600"
                                borderRadius={10}
                                height={44}
                            >
                                <SelectInput
                                    placeholder="Select frequency"
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    color={selectedFrequency ? (isDark ? '$textDark50' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
                                    fontSize={10}
                                    fontWeight="$medium"
                                />
                                <SelectIcon mr="$3" as={ChevronDownIcon} />
                            </SelectTrigger>
                            <SelectPortal>
                                <SelectBackdrop />
                                <SelectContent>
                                    <SelectDragIndicatorWrapper>
                                        <SelectDragIndicator />
                                    </SelectDragIndicatorWrapper>
                                    {frequencyOptions.map((option) => (
                                        <SelectItem
                                            key={option}
                                            label={option}
                                            value={option}
                                        />
                                    ))}
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                    </VStack>
                </VStack>
            </VStack>
        </ScrollView>
    );
};

