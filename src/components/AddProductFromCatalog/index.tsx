import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductCatalogScreen } from '@/src/features/catalog/screens/ProductCatalogScreen';
import { CatalogProduct } from '@/src/features/catalog/types';
import { Product } from '@/src/mock/catalog/productCatalog/types';

interface AddProductFromCatalogProps {
    onProductSelect: (product: Product) => void;
    onClose: () => void;
}

export const AddProductFromCatalog: React.FC<AddProductFromCatalogProps> = ({
    onProductSelect,
    onClose,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Handle product selection from ProductCatalogScreen
    const handleProductSelect = useCallback((product: CatalogProduct & { id: string; image: any; description?: string }) => {
        // Convert CatalogProduct to Product format
        const formattedProduct: Product = {
            id: product.productId || product.id,
            name: product.name,
            description: product.description || '',
            image: product.image || undefined,
        };
        onProductSelect(formattedProduct);
    }, [onProductSelect]);

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                {/* Header */}
                <Header
                    title="Add Product from Catalog"
                    leftAction="back"
                    onLeftActionPress={onClose}
                />
                
                {/* ProductCatalogScreen - Shared screen */}
                <Box flex={1}>
                    <ProductCatalogScreen
                        onStateChange={() => {
                            // Handle state changes if needed
                        }}
                        scrollViewPaddingBottom={52}
                        selectMode="benchmark"
                        returnScreen={undefined}
                        onProductSelect={handleProductSelect}
                        initialView="categories"
                        initialBreadcrumbItems={[]}
                        onCreatePost={undefined}
                    />
                </Box>
            </VStack>
        </SafeAreaView>
    );
};

export default AddProductFromCatalog;

