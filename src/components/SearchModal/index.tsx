import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Dimensions, Pressable as RNPressable, Modal, StyleSheet, Animated, PanResponder, PanResponderGestureState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Box,
    VStack,
    HStack,
    Text,
    Input,
    InputField,
    Pressable,
    ScrollView,
    Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50; // Minimum distance to trigger close

interface SearchModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const insets = useSafeAreaInsets();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'users' | 'brands' | 'products'>('users');
    const [isAnimating, setIsAnimating] = useState(false);
    
    // Animation
    const slideAnim = useRef(new Animated.Value(-SCREEN_HEIGHT * 0.9)).current;
    const panY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Reset panY when modal opens
            panY.setValue(0);
            slideAnim.setValue(-SCREEN_HEIGHT * 0.9);
            setIsAnimating(false);
            
            // Slide down from top
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        }
    }, [visible, slideAnim, panY]);

    // Handler for closing animation
    const handleCloseAnimation = useCallback((currentPanY: number, duration: number) => {
        setIsAnimating(true);
        Animated.timing(panY, {
            toValue: -SCREEN_HEIGHT * 0.9,
            duration: duration,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                // Reset animations first
                panY.setValue(0);
                slideAnim.setValue(-SCREEN_HEIGHT * 0.9);
                setIsAnimating(false);
                // Then call onClose
                onClose();
            }
        });
    }, [panY, slideAnim, onClose]);

    // Pan Responder for swipe up to close
    const panResponder = useMemo(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to vertical swipes with significant movement
                const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
                const hasMovement = Math.abs(gestureState.dy) > 10;
                return isVertical && hasMovement;
            },
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                // Capture the gesture only if it's a clear vertical swipe
                const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
                const hasMovement = Math.abs(gestureState.dy) > 10;
                return isVertical && hasMovement;
            },
            onPanResponderMove: (_, gestureState) => {
                // Allow both upward and downward movement, but limit downward movement
                const maxDownwardMovement = 100; // Maximum pixels user can drag down
                const newValue = gestureState.dy > maxDownwardMovement ? maxDownwardMovement : gestureState.dy;
                panY.setValue(newValue);
            },
            onPanResponderRelease: (_, gestureState) => {
                const { dy, vy } = gestureState;
                
                // Check if the final movement is upward and significant
                const isUpwardSwipe = dy < 0;
                const hasEnoughDistance = Math.abs(dy) > SWIPE_THRESHOLD;
                const hasEnoughVelocity = vy < -0.3; // Negative velocity means upward (reduced for better UX)
                
                // Only close if user ended with upward movement
                if (isUpwardSwipe && (hasEnoughDistance || hasEnoughVelocity)) {
                    // Close the modal - continue from current position without jumping
                    const currentPosition = (panY as any)._value;
                    const remainingDistance = -SCREEN_HEIGHT * 0.9 - currentPosition;
                    const duration = Math.max(200, Math.min(350, Math.abs(remainingDistance / 2.5)));
                    handleCloseAnimation(currentPosition, duration);
                } else {
                    // Snap back to original position
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 100,
                        friction: 10,
                    }).start();
                }
            },
        }),
        [panY, handleCloseAnimation]
    );

    const filters = [
        { id: 'users' as const, label: 'Users' },
        { id: 'brands' as const, label: 'Brands' },
        { id: 'products' as const, label: 'Products' },
    ];

    // Mock user data
    const mockUsers = [
        {
            id: '1',
            name: 'John Smith',
            title: 'Tech Enthusiast & Reviewer',
            avatar: require('@/assets/avatar/ozan.png'),
            trustLevel: 4,
        },
        {
            id: '2',
            name: 'Sarah Johnson',
            title: 'Product Designer',
            avatar: require('@/assets/avatar/ozan.png'),
            trustLevel: 5,
        },
        {
            id: '3',
            name: 'Mike Chen',
            title: 'Software Engineer',
            avatar: require('@/assets/avatar/ozan.png'),
            trustLevel: 3,
        },
        {
            id: '4',
            name: 'Emily Davis',
            title: 'Marketing Specialist',
            avatar: require('@/assets/avatar/ozan.png'),
            trustLevel: 4,
        },
    ];

    // Mock brand data
    const mockBrands = [
        {
            id: '1',
            name: 'Apple',
            category: 'Technology',
            logo: require('@/assets/inventory/product_01.png'),
        },
        {
            id: '2',
            name: 'Samsung',
            category: 'Technology',
            logo: require('@/assets/inventory/product_02.png'),
        },
        {
            id: '3',
            name: 'Maybeline',
            category: 'Cosmetic',
            logo: require('@/assets/inventory/product_03.png'),
        },
        {
            id: '4',
            name: 'Nike',
            category: 'Sports',
            logo: require('@/assets/inventory/product_04.png'),
        },
    ];

    // Mock product data
    const mockProducts = [
        {
            id: '1',
            name: 'Dyson V15s',
            description: 'Detect Submarine™ Wet & Dry Cordl...',
            image: require('@/assets/inventory/product_01.png'),
        },
        {
            id: '2',
            name: 'iPhone 15 Pro Max',
            description: '256GB Titanium Blue',
            image: require('@/assets/inventory/product_02.png'),
        },
        {
            id: '3',
            name: 'MacBook Air M3',
            description: '13-inch, 8GB RAM, 256GB SSD',
            image: require('@/assets/inventory/product_03.png'),
        },
        {
            id: '4',
            name: 'Samsung Galaxy S24',
            description: 'Ultra 512GB Phantom Black',
            image: require('@/assets/inventory/product_04.png'),
        },
    ];


    // Get category title
    const getCategoryTitle = () => {
        switch (selectedFilter) {
            case 'users':
                return 'Users';
            case 'brands':
                return 'Brands';
            case 'products':
                return 'Products';
            default:
                return 'Users';
        }
    };

    const handleSearch = (query: string) => {
        console.log('Searching for:', query);
        // TODO: Implement actual search
    };

    const handleOverlayClose = useCallback(() => {
        // Animate close when overlay is pressed
        const currentPosition = (panY as any)._value;
        handleCloseAnimation(currentPosition, 250);
    }, [panY, handleCloseAnimation]);

    // Keep rendering modal during animation even if visible is false
    if (!visible && !isAnimating) return null;

    return (
        <Modal
            visible={visible || isAnimating}
            animationType="fade"
            transparent={true}
            onRequestClose={handleOverlayClose}
            statusBarTranslucent
        >
            <Box style={styles.container}>
                {/* Overlay Background */}
                <RNPressable 
                    style={styles.overlay}
                    onPress={handleOverlayClose}
                />

                {/* Search Panel - 90% height from top */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: SCREEN_HEIGHT * 0.9,
                            backgroundColor: isDark ? '#000000' : '#FFFFFF',
                            borderBottomLeftRadius: 24,
                            borderBottomRightRadius: 24,
                            overflow: 'hidden',
                            transform: [
                                { translateY: Animated.add(slideAnim, panY) }
                            ],
                        },
                    ]}
                >
                    <Box flex={1}>
                        {/* Header */}
                        <VStack space="md" px="$4" pt={insets.top + 8} pb="$2">
                        {/* Search Bar */}
                        <HStack
                            alignItems="center"
                            bg={isDark ? '#1C1C1E' : '#F2F2F7'}
                            borderRadius={12}
                            px="$3"
                            space="sm"
                            h={48}
                        >
                            <Feather
                                name="search"
                                size={20}
                                color={isDark ? '#8E8E93' : '#8E8E93'}
                            />
                            <Input flex={1} borderWidth={0} bg="transparent">
                                <InputField
                                    placeholder="Search for products, posts, users..."
                                    placeholderTextColor={isDark ? '#8E8E93' : '#8E8E93'}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={15}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={() => handleSearch(searchQuery)}
                                    returnKeyType="search"
                                    autoFocus
                                />
                            </Input>
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery('')} p="$1">
                                    <Feather
                                        name="x-circle"
                                        size={18}
                                        color={isDark ? '#8E8E93' : '#8E8E93'}
                                    />
                                </Pressable>
                            )}
                        </HStack>

                        {/* Filters */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <HStack space="sm">
                                {filters.map((filter) => (
                                    <Pressable
                                        key={filter.id}
                                        onPress={() => setSelectedFilter(filter.id)}
                                        bg={
                                            selectedFilter === filter.id
                                                ? '#007AFF'
                                                : (isDark ? '#1C1C1E' : '#F2F2F7')
                                        }
                                        borderRadius={20}
                                        px="$4"
                                        py="$2"
                                    >
                                        <Text
                                            color={
                                                selectedFilter === filter.id
                                                    ? '#FFFFFF'
                                                    : (isDark ? '#FFFFFF' : '#000000')
                                            }
                                            fontSize={14}
                                            fontWeight={selectedFilter === filter.id ? '$semibold' : '$normal'}
                                        >
                                            {filter.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </HStack>
                        </ScrollView>
                    </VStack>

                    {/* Content */}
                    <ScrollView flex={1} px="$4" showsVerticalScrollIndicator={false}>
                        <VStack space="xl" pb="$6">
                            {/* Category Results */}
                            {searchQuery.length === 0 && selectedFilter === 'users' && (
                                <VStack space="md" mt="$2">
                                    <HStack justifyContent="space-between" alignItems="center">
                                        <Text
                                            fontSize={18}
                                            fontWeight="$semibold"
                                            color={isDark ? '$textDark50' : '#B9B9B9'}
                                        >
                                            {getCategoryTitle()}
                                        </Text>
                                    </HStack>
                                    
                                    {/* Users List */}
                                    <VStack space="xs">
                                        {mockUsers.map((user) => (
                                            <Pressable
                                                key={user.id}
                                                onPress={() => console.log('User pressed:', user.name)}
                                            >
                                                <HStack
                                                    alignItems="center"
                                                    space="md"
                                                    py="$3"
                                                    borderBottomWidth={1}
                                                    borderBottomColor={isDark ? '#2C2C2E' : '#E5E5EA'}
                                                >
                                                    {/* Avatar with Trust Level Ring */}
                                                    <Box position="relative">
                                                        <Box
                                                            width={54}
                                                            height={54}
                                                            borderRadius={100}
                                                            bg='#CE4A4A'
                                                            alignItems="center"
                                                            justifyContent="center"
                                                        >
                                                            <Box
                                                                width={50}
                                                                height={50}
                                                                borderRadius={25}
                                                                overflow="hidden"
                                                            >
                                                                <Image
                                                                    source={user.avatar}
                                                                    alt={user.name}
                                                                    width={50}
                                                                    height={50}
                                                                    resizeMode="cover"
                                                                />
                                                            </Box>
                                                        </Box>
                                                    </Box>

                                                    {/* User Info */}
                                                    <VStack flex={1} space="xs">
                                                        <Text
                                                            color={isDark ? '#FFFFFF' : '#000000'}
                                                            fontSize={14}
                                                            fontWeight="$semibold"
                                                            numberOfLines={1}
                                                        >
                                                            {user.name}
                                                        </Text>
                                                        <Text
                                                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                                            fontSize={12}
                                                            numberOfLines={1}
                                                        >
                                                            {user.title}
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                            </Pressable>
                                        ))}
                                    </VStack>
                                </VStack>
                            )}

                            {/* Brands List */}
                            {searchQuery.length === 0 && selectedFilter === 'brands' && (
                                <VStack space="md" mt="$2">
                                    <HStack justifyContent="space-between" alignItems="center">
                                        <Text
                                            fontSize={18}
                                            fontWeight="$semibold"
                                            color={isDark ? '$textDark50' : '#B9B9B9'}
                                        >
                                            {getCategoryTitle()}
                                        </Text>
                                    </HStack>
                                    
                                    {/* Brands Cards */}
                                    <VStack space="xs">
                                        {mockBrands.map((brand) => (
                                            <Pressable
                                                key={brand.id}
                                                onPress={() => console.log('Brand pressed:', brand.name)}
                                            >
                                                <HStack
                                                    alignItems="center"
                                                    space="md"
                                                    py="$3"
                                                    borderBottomWidth={1}
                                                    borderBottomColor={isDark ? '#2C2C2E' : '#E5E5EA'}
                                                >
                                                    {/* Brand Logo */}
                                                    <Box
                                                        width={54}
                                                        height={54}
                                                        borderRadius={8}
                                                        overflow="hidden"
                                                    >
                                                        <Image
                                                            source={brand.logo}
                                                            alt={brand.name}
                                                            width={54}
                                                            height={54}
                                                            resizeMode="contain"
                                                        />
                                                    </Box>

                                                    {/* Brand Info */}
                                                    <VStack flex={1} space="xs">
                                                        <Text
                                                            color={isDark ? '#FFFFFF' : '#000000'}
                                                            fontSize={14}
                                                            fontWeight="$bold"
                                                            numberOfLines={1}
                                                        >
                                                            {brand.name}
                                                        </Text>
                                                        <Text
                                                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                                            fontSize={13}
                                                            numberOfLines={1}
                                                        >
                                                            {brand.category}
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                            </Pressable>
                                        ))}
                                    </VStack>
                                </VStack>
                            )}

                            {/* Products List */}
                            {searchQuery.length === 0 && selectedFilter === 'products' && (
                                <VStack space="md" mt="$2">
                                    <HStack justifyContent="space-between" alignItems="center">
                                        <Text
                                            fontSize={18}
                                            fontWeight="$semibold"
                                            color={isDark ? '$textDark50' : '#B9B9B9'}
                                        >
                                            {getCategoryTitle()}
                                        </Text>
                                    </HStack>
                                    
                                    {/* Products Cards */}
                                    <VStack space="xs">
                                        {mockProducts.map((product) => (
                                            <Pressable
                                                key={product.id}
                                                onPress={() => console.log('Product pressed:', product.name)}
                                            >
                                                <HStack
                                                    alignItems="center"
                                                    space="md"
                                                    py="$3"
                                                    borderBottomWidth={1}
                                                    borderBottomColor={isDark ? '#2C2C2E' : '#E5E5EA'}
                                                >
                                                    {/* Product Image */}
                                                    <Box
                                                        width={54}
                                                        height={54}
                                                        borderRadius={8}
                                                        overflow="hidden"
                                                    >
                                                        <Image
                                                            source={product.image}
                                                            alt={product.name}
                                                            width={54}
                                                            height={54}
                                                            resizeMode="contain"
                                                        />
                                                    </Box>

                                                    {/* Product Info */}
                                                    <VStack flex={1} space="xs">
                                                        <Text
                                                            color={isDark ? '#FFFFFF' : '#000000'}
                                                            fontSize={14}
                                                            fontWeight="$bold"
                                                            numberOfLines={1}
                                                        >
                                                            {product.name}
                                                        </Text>
                                                        <Text
                                                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                                            fontSize={13}
                                                            numberOfLines={2}
                                                        >
                                                            {product.description}
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                            </Pressable>
                                        ))}
                                    </VStack>
                                </VStack>
                            )}

                            {/* Search Results */}
                            {searchQuery.length > 0 && (
                                <VStack space="md" mt="$2">
                                    <Text
                                        fontSize={18}
                                        fontWeight="$semibold"
                                        color={isDark ? '$textDark50' : '#000000'}
                                    >
                                        Results for "{searchQuery}"
                                    </Text>
                                    <Box py="$20" alignItems="center">
                                        <Feather
                                            name="search"
                                            size={56}
                                            color={isDark ? '#48484A' : '#D1D1D6'}
                                        />
                                        <Text
                                            mt="$4"
                                            fontSize={16}
                                            color={isDark ? '#8E8E93' : '#8E8E93'}
                                            textAlign="center"
                                        >
                                            Start typing to search
                                        </Text>
                                    </Box>
                                </VStack>
                            )}
                        </VStack>
                    </ScrollView>

                    {/* Swipe Handle at Bottom */}
                    <Animated.View
                        {...panResponder.panHandlers}
                        style={{
                            paddingTop: 16,
                            paddingBottom: 16,
                            alignItems: 'center',
                            backgroundColor: 'transparent',
                            width: '100%',
                        }}
                    >
                        <Box
                            width={40}
                            height={4}
                            borderRadius={2}
                            bg={isDark ? '#3C3C3E' : '#D1D1D6'}
                        />
                    </Animated.View>
                    </Box>
                </Animated.View>
            </Box>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
});

export default SearchModal;

