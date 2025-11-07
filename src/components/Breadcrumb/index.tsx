import React from 'react';
import {
    HStack,
    Text,
    Pressable,
    Box,
    ScrollView,
} from '@gluestack-ui/themed';
import { ChevronRight } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BreadcrumbItem } from '@/src/types/breadcrumb';

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    onItemPress: (item: BreadcrumbItem, index: number) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onItemPress }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const breadCrumbsHeight = 40;

    return (
        <ScrollView
            maxHeight={breadCrumbsHeight}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                alignItems: 'center'
            }}
        >
            <HStack alignItems="center" space="xs">
                {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <Pressable
                            onPress={() => onItemPress(item, index)}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                minWidth: 60,
                                flexShrink: 0,
                            })}
                        >
                            <Text
                                color={
                                    index === items.length - 1
                                        ? (isDark ? '#FFFFFF' : '#000000')
                                        : (isDark ? '#8C8C8C' : '#8C8C8C')
                                }
                                fontSize={12}
                                fontWeight={index === items.length - 1 ? '$bold' : '$normal'}
                                numberOfLines={1}
                            >
                                {item.name}
                            </Text>
                        </Pressable>

                        {index < items.length - 1 && (
                            <Box
                                width={16}
                                height={16}
                                justifyContent="center"
                                alignItems="center"
                            >
                                <ChevronRight
                                    size={12}
                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                />
                            </Box>
                        )}
                    </React.Fragment>
                ))}
            </HStack>
        </ScrollView>
    );
};

export default Breadcrumb;

