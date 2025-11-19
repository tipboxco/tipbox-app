import React, { useState, useRef } from 'react';
import { ScrollView, Dimensions, FlatList, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
    Button,
    ButtonText,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { EventsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { mock_community_events, rewards_badges_mock} from '@/src/mock/events/communityEvents';
import { mock_posts } from '@/src/mock/profile/posts';
import { Feather } from '@expo/vector-icons';
import PostCard from '@/src/components/PostCards/PostCard';

const { width } = Dimensions.get('window');

type EventDetailScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventDetail'>;
type EventDetailScreenRouteProp = RouteProp<EventsStackParamList, 'EventDetail'>;

const EventDetailScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const navigation = useNavigation<EventDetailScreenNavigationProp>();
    const route = useRoute<EventDetailScreenRouteProp>();
    const scrollY = useRef(new Animated.Value(0)).current;

    const { eventId } = route.params;

    // Find the event from mock data
    const event = [...mock_community_events.activeEvents, ...mock_community_events.upcomingEvents, ...mock_community_events.completedEvents]
        .find(e => e.id === eventId);

    // Banner yüksekliği ve içerik başlangıç noktası
    const BANNER_HEIGHT = 250;
    const CONTENT_OFFSET = 20; // mt={-20} nedeniyle içerik banner'ın 20px üstünde başlıyor
    const CONTENT_START = BANNER_HEIGHT - CONTENT_OFFSET; // 230px

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
    );

    // Header animasyonu: İçeriğin başlangıç noktasına yaklaştığında açılır
    // 180px'de başlar, 230px'de (içerik başlangıcı) tamamen görünür olur
    const headerOpacity = scrollY.interpolate({
        inputRange: [180, CONTENT_START],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    if (!event) {
        return (
            <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                <Header
                    title="Event Not Found"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />
            </Box>
        );
    }

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* Sticky Animated Header */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    opacity: headerOpacity,
                }}
            >
                <Header
                    title={event.title}
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                    showShare={true}
                    onSharePress={() => console.log('Share pressed')}
                />
            </Animated.View>

            <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* Banner Image */}
                <Box
                    width={width}
                    height={250}
                    position="relative"
                    overflow="hidden"
                >
                    <Image
                        source={require('@/assets/events/banner.png')}
                        alt="Event Banner"
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />

                    {/* Gradient Overlay */}
                    <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bg="rgba(0, 0, 0, 0.6)"
                    />

                    {/* Back and Share Buttons */}
                    <HStack
                        position="absolute"
                        top={25}
                        left={16}
                        right={16}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Pressable
                            onPress={() => navigation.goBack()}
                            width={36}
                            height={36}
                            borderRadius={18}
                            bg="rgba(0, 0, 0, 0.6)"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Feather name="arrow-left" size={20} color="#FFFFFF" />
                        </Pressable>

                        <Pressable
                            width={36}
                            height={36}
                            borderRadius={18}
                            bg="rgba(0, 0, 0, 0.6)"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Feather name="share-2" size={20} color="#FFFFFF" />
                        </Pressable>
                    </HStack>
                </Box>

                {/* Content */}
                <VStack
                    bg={isDark ? '#000000' : '#FAFAFA'}
                    borderTopLeftRadius={20}
                    borderTopRightRadius={20}
                    mt={-20}
                    flex={1}
                    px={15}
                    pt={15}
                >
                    {/* Event Type Badge */}
                    <Box mb="$2">
                        <Box
                            bg="rgba(144, 8, 255, 0.8)"
                            borderWidth={1}
                            borderColor="#CA88FF"
                            borderRadius={10}
                            px="$2"
                            py="$1"
                            alignSelf="flex-start"
                        >
                            <Text
                                color="#FFFFFF"
                                fontSize={9}
                                fontWeight="$bold"
                            >
                                {event.eventType}
                            </Text>
                        </Box>
                    </Box>

                    <HStack justifyContent="space-between" alignItems="center" mb="$2">
                        {/* Event Title */}
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={16}
                            fontWeight="$bold"
                        >
                            {event.title}
                        </Text>
                        <Button
                            bg={isJoined ? '#D9D9D9' : '#C2E607'}
                            borderRadius={5}
                            h={20}
                            onPress={() => setIsJoined(!isJoined)}
                        >
                            <ButtonText
                                color="#000000"
                                fontSize={10}
                                fontWeight="$bold"
                                textAlign="center"
                            >
                                {isJoined ? 'Joined' : 'Join'}
                            </ButtonText>
                        </Button>
                    </HStack>

                    {/* Event Description */}
                    <Text
                        color={isDark ? '#FFFFFF' : '#343434'}
                        fontSize={10}
                        lineHeight={12}
                        mb="$3"
                    >
                        {event.description}
                    </Text>

                    {/* Details Section */}
                    <VStack space="xs" mb="$3">
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={12}
                            fontWeight="$bold"
                        >
                            Details
                        </Text>

                        <Box
                            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                            borderWidth={1}
                            borderColor="#E9E9E9"
                            borderRadius={5}
                            px="$4"
                            py="$3"
                        >
                            <VStack space="md">
                                {/* Duration */}
                                <HStack alignItems="center" space="sm">
                                    <Box
                                        width={30}
                                        height={30}
                                        borderRadius={15}
                                        borderWidth={1}
                                        borderColor="#B9B9B9"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Feather name="calendar" size={16} color="#B9B9B9" />
                                    </Box>
                                    <VStack>
                                        <Text
                                            color="#B9B9B9"
                                            fontSize={11}
                                            fontWeight="$medium"
                                        >
                                            Duration
                                        </Text>
                                        <Text
                                            color="#000000"
                                            fontSize={11}
                                            fontWeight="$bold"
                                        >
                                            {event.dateRange}
                                        </Text>
                                    </VStack>
                                </HStack>

                                {/* Participants */}
                                <HStack alignItems="center" space="sm">
                                    <Box
                                        width={30}
                                        height={30}
                                        borderRadius={15}
                                        borderWidth={1}
                                        borderColor="#B9B9B9"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Feather name="users" size={16} color="#B9B9B9" />
                                    </Box>
                                    <VStack>
                                        <Text
                                            color="#B9B9B9"
                                            fontSize={11}
                                            fontWeight="$medium"
                                        >
                                            Participants
                                        </Text>
                                        <Text
                                            color="#000000"
                                            fontSize={11}
                                            fontWeight="$bold"
                                        >
                                            {event.participants}+ people joined
                                        </Text>
                                    </VStack>
                                </HStack>
                            </VStack>
                        </Box>
                    </VStack>

                    {/* Rewards & Badges Section */}
                    <VStack space="xs" mb="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                Rewards & Badges
                            </Text>
                            <Pressable
                                onPress={() => navigation.navigate('RewardsBadges')}
                            >
                                <Text
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={9}
                                    fontWeight="$bold"
                                    underline
                                >
                                    See All
                                </Text>
                            </Pressable>
                        </HStack>

                        {/* Badge Cards - Horizontal Scroll */}
                        <FlatList
                            data={rewards_badges_mock}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            ItemSeparatorComponent={() => <Box width={6} />}
                            renderItem={({ item }) => (
                                <Box
                                    width={108}
                                    height={122}
                                    bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                                    borderWidth={1}
                                    borderColor="#E9E9E9"
                                    borderRadius={5}
                                    alignItems="center"
                                    justifyContent="center"
                                    p="$3"
                                >
                                    <Image
                                        source={item.image}
                                        alt={item.title}
                                        width={62}
                                        height={62}
                                        borderRadius={5}
                                        mb="$2"
                                        resizeMode="cover"
                                    />
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={10}
                                        fontWeight="$bold"
                                        textAlign="center"
                                    >
                                        {item.title}
                                    </Text>
                                </Box>
                            )}
                            keyExtractor={(item) => item.id}
                        />
                    </VStack>



                    {/* Event Feed Section */}
                    <VStack space="xs">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                Event Feed
                            </Text>
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={10}
                                fontWeight="$bold"
                                underline
                            >
                                Latest
                            </Text>
                        </HStack>

                        {/* Event Feed Cards */}
                        <VStack space="sm">
                            {mock_posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    data={post}
                                />
                            ))}
                        </VStack>
                    </VStack>
                </VStack>
            </ScrollView>

            {/* Floating Action Button */}
            {isJoined && (
                <Box
                    position="absolute"
                    bottom={24}
                    right={16}
                    zIndex={1000}
                >
                    <Pressable
                        bg="#E8FF6B"
                        borderRadius={30}
                        width={56}
                        height={56}
                        alignItems="center"
                        justifyContent="center"
                        shadowColor="#000"
                        shadowOffset={{ width: 0, height: 4 }}
                        shadowOpacity={0.3}
                        shadowRadius={4.65}
                        elevation={8}
                        onPress={() => navigation.navigate('EventCreatePost', {
                          eventType: event.eventType,
                          product: event.product,
                        })}
                    >
                        <Feather name="edit-3" size={24} color="#000000" />
                    </Pressable>
                </Box>
            )}
        </Box>
        </SafeAreaView>
    );
};

export default EventDetailScreen;
