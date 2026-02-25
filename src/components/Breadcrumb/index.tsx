import React, { useRef, useEffect, useMemo } from 'react';
import {
    Text,
    Pressable,
    Box,
} from '@gluestack-ui/themed';
import { FlatList, View, ListRenderItemInfo } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BreadcrumbItem } from '@/src/types/breadcrumb';

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    onItemPress: (item: BreadcrumbItem, index: number) => void;
    rootLabel?: string;
}

// ─── flat data types ────────────────────────────────────────────────────────
type CrumbRoot = { kind: 'root'; key: string; label: string; isActive: boolean };
type CrumbSep  = { kind: 'sep';  key: string };
type CrumbItem = { kind: 'item'; key: string; item: BreadcrumbItem; idx: number; isLast: boolean };
type CrumbCell = CrumbRoot | CrumbSep | CrumbItem;

/**
 * Breadcrumb
 *
 * Uses FlatList (not ScrollView) because FlatList.scrollToEnd() is
 * natively more reliable: the underlying VirtualizedList hands the
 * scroll command directly to the native scroll view after measuring.
 *
 * Behaviour:
 *   – Short content (fits viewport) → stays at x=0 (left-aligned).
 *   – Long content (overflows) → auto-scrolled to the end so the
 *     rightmost (active) item is always visible.
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onItemPress, rootLabel }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const flatListRef = useRef<FlatList<CrumbCell>>(null);

    // ── build flat data: root → sep → item → sep → item … ─────────────────
    const data = useMemo<CrumbCell[]>(() => {
        const result: CrumbCell[] = [];

        if (rootLabel) {
            result.push({
                kind: 'root',
                key: 'root',
                label: rootLabel,
                isActive: items.length === 0,
            });
        }

        items.forEach((item, i) => {
            result.push({ kind: 'sep', key: `sep-${i}` });
            result.push({
                kind: 'item',
                key: item.id,
                item,
                idx: i,
                isLast: i === items.length - 1,
            });
        });

        return result;
    }, [rootLabel, items]);

    // ── scroll to end whenever items change ─────────────────────────────────
    useEffect(() => {
        if (data.length === 0) return;

        // Immediate attempt (may fire before layout completes on first render)
        flatListRef.current?.scrollToEnd({ animated: false });

        // Belt-and-suspenders: retry after native layout pass
        const t = setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
        }, 50);

        return () => clearTimeout(t);
    }, [data]);

    // ── render cells ────────────────────────────────────────────────────────
    const renderItem = ({ item: cell }: ListRenderItemInfo<CrumbCell>) => {
        if (cell.kind === 'sep') {
            return (
                <Box alignItems="center" justifyContent="center" px={4}>
                    <ChevronRight
                        size={14}
                        color="#8C8C8C"
                        style={{ marginBottom: 7 }}
                        strokeWidth={2}
                    />
                </Box>
            );
        }

        if (cell.kind === 'root') {
            const isActive = cell.isActive;
            return (
                <Pressable
                    onPress={() => onItemPress({ id: 'root', name: cell.label, type: 'root' }, -1)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                    <Box position="relative">
                        <Text
                            color={isActive ? (isDark ? '#FFFFFF' : '#1A1A1A') : '#8C8C8C'}
                            fontSize={14}
                            fontWeight={isActive ? '$bold' : '$normal'}
                            mb={8}
                        >
                            {cell.label}
                        </Text>
                        {isActive && (
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
            );
        }

        // kind === 'item'
        const { item, idx, isLast } = cell;
        return (
            <Pressable
                onPress={() => onItemPress(item, idx)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
                <Box position="relative">
                    <Text
                        color={isLast ? (isDark ? '#FFFFFF' : '#1A1A1A') : '#8C8C8C'}
                        fontSize={14}
                        fontWeight={isLast ? '$bold' : '$normal'}
                        mb={8}
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
        );
    };

    return (
        <Box
            bg={isDark ? '#000' : '#FFF'}
            borderBottomWidth={1}
            borderBottomColor="#E9E9E9"
        >
            <FlatList<CrumbCell>
                ref={flatListRef}
                data={data}
                keyExtractor={(cell) => cell.key}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    alignItems: 'center',
                }}
                // scrollToEnd also triggers on every content layout change
                onContentSizeChange={() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                }}
            />
        </Box>
    );
};

export default Breadcrumb;
