import React, { useState, useRef, useMemo, useCallback } from 'react';
import { 
    Box, 
    ScrollView, 
    VStack, 
    HStack, 
    Text, 
    Pressable,
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
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { AddProductFromCatalog } from '@/src/components/AddProductFromCatalog';
import { Product } from '@/src/mock/catalog/productCatalog/types';

interface SelectProductProps {
    onProductSelect: (product: { id: string; name: string; brand?: string; description?: string; image: any }) => void;
    selectedProduct?: { id: string; name: string; brand?: string; description?: string; image: any } | null;
}

// Usage options for inventory
const usageDurationOptions = ['2 Weeks', '1 Month', '3 Months', '6 Months', '1 Year', 'More than 1 Year'];
const usageLocationOptions = ['Home', 'Office', 'Car', 'Travel', 'Gym', 'Other'];
const usagePurposeOptions = ['Personal Use', 'Work', 'Gift', 'Testing', 'Review', 'Other'];

export const SelectProduct: React.FC<SelectProductProps> = ({
    onProductSelect,
    selectedProduct,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<string>('');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedPurpose, setSelectedPurpose] = useState<string>('');

    const handleProductSelectPress = () => {
        // Open AddProductFromCatalog
        setShowProductSelector(true);
    };

    const handleCatalogProductSelect = (product: Product) => {
        // Parse product name to extract brand if possible
        const nameParts = product.name.split(' ');
        const brand = nameParts.length > 1 ? nameParts[0] : undefined;
        const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
        
        const selectedProductData = {
            id: product.id,
            name: productName,
            brand: brand,
            description: product.description,
            image: product.image,
        };
        onProductSelect(selectedProductData);
        setShowProductSelector(false);
    };

    const handleCloseProductSelector = () => {
        setShowProductSelector(false);
    };

    // Show AddProductFromCatalog if product selector is open
    if (showProductSelector) {
        return (
            <AddProductFromCatalog
                onProductSelect={handleCatalogProductSelect}
                onClose={handleCloseProductSelector}
            />
        );
    }

    return (
        <ScrollView 
            flex={1} 
            showsVerticalScrollIndicator={false}
        >
            <VStack space="md" pb={100}>
                {/* Select Product Section */}
                <VStack px={16} space="xs">
                    {/* Section Title */}
                    <Text
                        color={isDark ? '$textDark400' : '#B9B9B9'}
                        fontSize={10}
                        fontWeight="$bold"
                    >
                        Select Product
                    </Text>

                    {/* Select Product Button or ProductInfoCard */}
                    {!selectedProduct ? (
                        <Pressable onPress={handleProductSelectPress}>
                            <Box
                                bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                $dark-borderColor="$borderDark600"
                                borderRadius={10}
                                height={44}
                                justifyContent="center"
                                alignItems="center"
                            >
                                <HStack alignItems="center" space="sm">
                                    <Feather
                                        name="plus"
                                        size={16}
                                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    />
                                    <Text
                                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                        fontSize={10}
                                        fontWeight="$medium"
                                    >
                                        Select Product
                                    </Text>
                                </HStack>
                            </Box>
                        </Pressable>
                    ) : (
                        <Box px="$4" py="$2">
                            <ProductInfoCard
                                image={selectedProduct.image}
                                title={selectedProduct.name}
                                subName={selectedProduct.description}
                                size="big"
                                type={ProductInfoType.SUB_CATEGORY}
                            />
                        </Box>
                    )}

                    {/* Usage Duration Selectbox */}
                    <VStack space="xs">
                        <Select
                            selectedValue={selectedDuration}
                            onValueChange={setSelectedDuration}
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
                                    placeholder="Usage Duration"
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
                                    {usageDurationOptions.map((option) => (
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

                    {/* Usage Location Selectbox */}
                    <VStack space="xs">
                        <Select
                            selectedValue={selectedLocation}
                            onValueChange={setSelectedLocation}
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
                                    placeholder="Usage Location"
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    color={selectedLocation ? (isDark ? '$textDark50' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
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
                                    {usageLocationOptions.map((option) => (
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

                    {/* Usage Purpose Selectbox */}
                    <VStack space="xs">
                        <Select
                            selectedValue={selectedPurpose}
                            onValueChange={setSelectedPurpose}
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
                                    placeholder="Usage Purpose"
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    color={selectedPurpose ? (isDark ? '$textDark50' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
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
                                    {usagePurposeOptions.map((option) => (
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
