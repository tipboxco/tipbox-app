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
import { AddProductFromInventory } from '@/src/components/AddProductFromInventory';
import { Product } from '@/src/mock/catalog/productCatalog/types';
import { InventoryItem } from '@/src/features/profile/types';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';
import { useTranslation } from '@/src/hooks/useTranslation';

interface SelectProductProps {
    onProductSelect: (product: { id: string; name: string; brand?: string; description?: string; image: any }) => void;
    selectedProduct?: { id: string; name: string; brand?: string; description?: string; image: any } | null;
    fromInventory?: boolean;
    /** Called when catalog back is pressed without selecting a product */
    onCancel?: () => void;
}

// Usage options for inventory
const usageDurationOptions = ['2 Weeks', '1 Month', '3 Months', '6 Months', '1 Year', 'More than 1 Year'];
const usageLocationOptions = ['Home', 'Office', 'Car', 'Travel', 'Gym', 'Other'];
const usagePurposeOptions = ['Personal Use', 'Work', 'Gift', 'Testing', 'Review', 'Other'];

export const SelectProduct: React.FC<SelectProductProps> = ({
    onProductSelect,
    selectedProduct,
    fromInventory = false,
    onCancel,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { t } = useTranslation('post');
    // Auto-open catalog when no product is selected and not from inventory
    const [showProductSelector, setShowProductSelector] = useState(!selectedProduct && !fromInventory);
    const [selectedDuration, setSelectedDuration] = useState<string>('');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedPurpose, setSelectedPurpose] = useState<string>('');
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

    const handleProductSelectPress = () => {
        if (fromInventory) {
            // Open inventory selector as bottom sheet
            openBottomSheet(
                <AddProductFromInventory
                    onProductSelect={handleInventoryProductSelect}
                    onClose={closeBottomSheet}
                />,
                {
                    enablePanDownToClose: true,
                    enableOverDrag: false,
                    enableHandlePanningGesture: true,
                    enableContentPanningGesture: true,
                    animateOnMount: false,
                    paddingBottom: bottomOffset,
                }
            );
        } else {
            // Open catalog selector (full screen)
            setShowProductSelector(true);
        }
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

    const handleInventoryProductSelect = (item: InventoryItem) => {
        // Convert InventoryItem to product format
        const brandName = item.brand?.name || 'Unknown Brand';
        const brandModel = item.brand?.model || '';
        const productName = brandModel ? `${brandName} ${brandModel}` : brandName;
        
        const selectedProductData = {
            id: item.productId || item.id,
            name: productName,
            brand: brandName,
            description: item.brand?.specs || '',
            image: item.image,
        };
        onProductSelect(selectedProductData);
        closeBottomSheet();
    };

    const handleCloseProductSelector = () => {
        if (onCancel && !selectedProduct) {
            // No product was selected, navigate back
            onCancel();
        } else {
            setShowProductSelector(false);
        }
    };

    // Show AddProductFromCatalog if showProductSelector is true (only for catalog, inventory uses bottom sheet)
    if (showProductSelector && !fromInventory) {
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
                        {t('create.experience.step0.selectProduct')}
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
                                        {t('create.experience.step0.selectProduct')}
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
                                    placeholder={t('create.experience.step0.placeholders.duration')}
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
                                    placeholder={t('create.experience.step0.placeholders.location')}
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
                                    placeholder={t('create.experience.step0.placeholders.purpose')}
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
