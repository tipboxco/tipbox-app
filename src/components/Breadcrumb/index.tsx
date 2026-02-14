import React, { useRef, useEffect } from 'react';
import {
    HStack,
    Text,
    Pressable,
    Box,
} from '@gluestack-ui/themed';
import { ScrollView } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BreadcrumbItem } from '@/src/types/breadcrumb';

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    onItemPress: (item: BreadcrumbItem, index: number) => void;
    rootLabel?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onItemPress, rootLabel }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const scrollViewRef = useRef<ScrollView>(null);

    // Auto scroll to end when items change
    useEffect(() => {
        // Small delay to ensure layout is complete
        const timer = setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return () => clearTimeout(timer);
    }, [items]);

    // Scroll to end when content size changes (triggered when layout completes)
    const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
        // Scroll to end immediately when content changes
        scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    return (
        <Box 
            position="relative"
            bg={isDark ? '#000' : '#FFF'}
            borderBottomWidth={1}
            borderBottomColor="#E9E9E9"
          
        >
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 0,
                    alignItems: 'center',
                }}
                onContentSizeChange={handleContentSizeChange}
            >
                <HStack alignItems="center" space="xs">
                    {rootLabel && (
                        <>
                            <Pressable
                                onPress={() => onItemPress({ id: 'root', name: rootLabel, type: 'root' }, -1)}
                                style={({ pressed }) => ({
                                    opacity: pressed ? 0.7 : 1,
                                })}
                            >
                                <Box position="relative">
                                    <Text
                                        color={items.length === 0 ? (isDark ? '#FFFFFF' : '#1A1A1A') : '#8C8C8C'}
                                        fontSize={14}
                                        fontWeight={items.length === 0 ? '$bold' : '$normal'}
                                        mb={8}
                                        style={{ flexShrink: 0 }}
                                    >
                                        {rootLabel}
                                    </Text>
                                    {items.length === 0 && (
                                        <Box
                                            position="absolute"
                                            bottom={0}
                                            left={0}
                                            right={0}
                                            height={2}
                                            bg={isDark ? '#FFFFFF' : '#1A1A1A'}
                                        />
                                    )}
                                </Box>
                            </Pressable>
                            {items.length > 0 && (
                                <Box alignItems="center" justifyContent="center" px={4}>
                                    <ChevronRight
                                             size={14}
                                             color="#8C8C8C"
                                             style={{ marginBottom: 7 }}
                                             strokeWidth={2}
                                    />
                                </Box>
                            )}
                        </>
                    )}

                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;
                        return (
                            <React.Fragment key={item.id}>
                                <Pressable
                                    onPress={() => onItemPress(item, index)}
                                    style={({ pressed }) => ({
                                        opacity: pressed ? 0.7 : 1,
                                        justifyContent: 'center',
                                    })}
                                >
                                    <Box position="relative">
                                        <Text
                                            color={isLast ? (isDark ? '#FFFFFF' : '#1A1A1A') : '#8C8C8C'}
                                            fontSize={14}
                                            fontWeight={isLast ? '$bold' : '$normal'}
                                            mb={8}
                                            style={{ flexShrink: 0 }}
                                        >
                                            {item.name}
                                        </Text>
                                        {isLast && (
                                            <Box
                                                position="absolute"
                                                bottom={0}
                                                left={0}
                                                right={0}
                                                height={2}
                                                bg={isDark ? '#FFFFFF' : '#1A1A1A'}
                                            />
                                        )}
                                    </Box>
                                </Pressable>

                                {!isLast && (
                                    <Box alignItems="center" justifyContent="center" px={4}>
                                        <ChevronRight
                                            size={14}
                                            color="#8C8C8C"
                                            style={{ marginBottom: 7 }}
                                            strokeWidth={2}
                                        />
                                    </Box>
                                )}
                            </React.Fragment>
                        );
                    })}
                    {/* Spacer to ensure last item is fully visible */}
                    <Box width={16} />
                </HStack>
            </ScrollView>
        </Box>
    );
};

export default Breadcrumb;
