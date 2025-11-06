import React, { useState, useRef, useMemo, useCallback } from 'react';
import { ScrollView, Alert } from 'react-native';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Textarea,
    TextareaInput,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../navigation';
import { Feather } from '@expo/vector-icons';
import { CreateEventPostBottomSheet } from '../components/CreateEventPostBottomSheet';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

type EventCreatePostNavigationProp = NativeStackNavigationProp<EventsStackParamList>;

const EventCreatePost: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<EventCreatePostNavigationProp>();

    const [content, setContent] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    // Bottom sheet refs
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Bottom sheet snap points
    const snapPoints = useMemo(() => ['40%'], []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
            />
        ),
        []
    );

    const handleSelectProduct = () => {
        // Open bottom sheet
        if (bottomSheetRef.current) {
            bottomSheetRef.current.snapToIndex(0);
        }
    };

    const handleCloseBottomSheet = () => {
        bottomSheetRef.current?.close();
    };

    const handleSelectCatalog = () => {
        console.log('Select from catalog');
        handleCloseBottomSheet();
        // TODO: Navigate to catalog selection
    };

    const handleSelectInventory = () => {
        console.log('Select from inventory');
        handleCloseBottomSheet();
        // TODO: Navigate to inventory selection
    };

    const handleAddPhoto = () => {
        // TODO: Implement image picker
        console.log('Add photo');
    };

    const handleShare = () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please write something');
            return;
        }
        // TODO: Implement post creation
        Alert.alert('Success', 'Post created successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    return (
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* Header */}
            <Box
                bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
                borderBottomWidth={1}
                borderBottomColor={isDark ? '#333' : '#E5E5E5'}
            >
                <HStack
                    px="$4"
                    py="$3"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Pressable onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                    </Pressable>
                    <Text
                        color={isDark ? '$textDark50' : '$textLight900'}
                        fontSize={18}
                        fontWeight="$bold"
                        flex={1}
                        textAlign="center"
                    >
                        Write a Post
                    </Text>
                    <Pressable
                        onPress={handleShare}
                        bg={content.trim() ? '#E8FF6B' : '#D9D9D9'}
                        borderRadius={25}
                        px={24}
                        py={8}
                        disabled={!content.trim()}
                    >
                        <Text
                            color={content.trim() ? '#000000' : '#8C8C8C'}
                            fontSize={15}
                            fontWeight="$semibold"
                        >
                            Share
                        </Text>
                    </Pressable>
                </HStack>
            </Box>

            <ScrollView showsVerticalScrollIndicator={false}>
                <VStack space="lg" p="$4">
                    {/* Select Product Button */}
                    <Pressable
                        onPress={handleSelectProduct}
                        borderWidth={1}
                        borderColor={isDark ? '#333' : '#D9D9D9'}
                        borderRadius={8}
                        minHeight={42}
                        justifyContent="center"
                        alignItems="center"
                        bg={isDark ? '#1A1A1A' : '$backgroundLight0'}
                    >
                        <HStack space="sm" alignItems="center">
                            <Feather
                                name="plus"
                                size={20}
                                color={isDark ? '#999' : '#CCCCCC'}
                            />
                            <Text
                                color={isDark ? '#999' : '#CCCCCC'}
                                fontSize={15}
                            >
                                Select Product
                            </Text>
                        </HStack>
                    </Pressable>

                    {/* Post Description */}
                    <VStack space="xs">
                        <Text
                            color={isDark ? '$textDark200' : '#999999'}
                            fontSize={14}
                        >
                            Post Description
                        </Text>
                        <Textarea
                            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#D9D9D9'}
                            borderRadius={8}
                            height={180}
                        >
                            <TextareaInput
                                placeholder="Type your Post here..."
                                value={content}
                                onChangeText={(text) => {
                                    if (text.length <= 500) {
                                        setContent(text);
                                    }
                                }}
                                color={isDark ? '$textDark50' : '$textLight900'}
                                placeholderTextColor={isDark ? '#666' : '#999'}
                                fontSize={15}
                                multiline
                            />
                        </Textarea>
                        <Text
                            position="absolute"
                            bottom={8}
                            right={12}
                            color="#CCCCCC"
                            fontSize={12}
                        >
                            {content.length}/500
                        </Text>
                    </VStack>

                    {/* Images Section */}
                    <VStack space="xs">
                        <Text
                            color={isDark ? '$textDark200' : '#999999'}
                            fontSize={14}
                        >
                            Images
                        </Text>
                        <Pressable
                            onPress={handleAddPhoto}
                            borderWidth={2}
                            borderStyle="dashed"
                            borderColor={isDark ? '#333' : '#D9D9D9'}
                            borderRadius={8}
                            width={64}
                            height={64}
                            justifyContent="center"
                            alignItems="center"
                            bg="transparent"
                        >
                            <Feather
                                name="plus"
                                size={36}
                                color={isDark ? '#666' : '#CCCCCC'}
                            />
                        </Pressable>
                    </VStack>
                </VStack>
            </ScrollView>

            {/* Select Product Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                enableOverDrag={false}
                enableHandlePanningGesture={true}
                enableContentPanningGesture={true}
                animateOnMount={true}
                backdropComponent={renderBackdrop}
                backgroundStyle={{
                    backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                }}
                handleStyle={{
                    backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                }}
                handleIndicatorStyle={{
                    backgroundColor: isDark ? '#333333' : '#CCCCCC',
                    width: 40,
                    height: 4,
                }}
            >
                <BottomSheetView>
                    <CreateEventPostBottomSheet
                        onClose={handleCloseBottomSheet}
                        onSelectCatalog={handleSelectCatalog}
                        onSelectInventory={handleSelectInventory}
                    />
                </BottomSheetView>
            </BottomSheet>
        </Box>
    );
};

EventCreatePost.displayName = 'EventCreatePost';

export default EventCreatePost;

