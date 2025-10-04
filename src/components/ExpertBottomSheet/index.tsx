import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
} from '@gluestack-ui/themed';
import { TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface ExpertBottomSheetProps {
    onClose: () => void;
}

const ExpertBottomSheet: React.FC<ExpertBottomSheetProps> = ({ onClose }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const [selectedCategory, setSelectedCategory] = useState('Select the category of your question');
    const [questionDetails, setQuestionDetails] = useState('');
    const [expertPrize, setExpertPrize] = useState('50');

    const categories = [
        'Technology',
        'Design',
        'Business',
        'Marketing',
        'Development',
        'Other'
    ];

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    const handleSubmit = () => {
        console.log('Expert question submitted:', {
            category: selectedCategory,
            question: questionDetails,
            prize: expertPrize
        });
        onClose();
    };

    return (
        <Box
            flex={1}
            bg={isDark ? '#1A1A1A' : '#FDFDFB'}
            borderTopLeftRadius={30}
            borderTopRightRadius={30}
            px="$4"
        >
            {/* Form Content */}
            <VStack space="lg" flex={1}>
                {/* Category Selection */}
                <VStack space="sm">
                    <Text
                        fontSize={10}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                    >
                        Category
                    </Text>

                    <Pressable
                        onPress={() => {
                            // Category selection modal would open here
                            console.log('Category selection pressed');
                        }}
                        bg={isDark ? '#2A2A2A' : '#EEEEEE'}
                        borderRadius={10}
                        px="$4"
                        py="$3"
                        borderWidth={1}
                        borderColor={isDark ? '#333333' : '#E0E0E0'}
                    >
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                fontSize={10}
                                fontWeight="$medium"
                                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                flex={1}
                            >
                                {selectedCategory}
                            </Text>
                            <Feather
                                name="chevron-down"
                                size={18}
                                color={isDark ? '#FFFFFF' : '#000000'}
                            />
                        </HStack>
                    </Pressable>
                </VStack>

                {/* Question Details */}
                <VStack space="sm">
                    <Text
                        fontSize={10}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                    >
                        Question Details
                    </Text>

                    <Box
                        borderWidth={1}
                        borderColor={isDark ? '#333333' : '#B9B9B9'}
                        borderRadius={10}
                        px="$3"
                        py="$2"
                    >
                        <TextInput
                            placeholder="Type your question here… provide enough details for experts to help you."
                            placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                            style={{
                                color: isDark ? '#FFFFFF' : '#000000',
                                fontSize: 10,
                                minHeight: 140,
                                textAlignVertical: 'top',
                            }}
                            value={questionDetails}
                            onChangeText={setQuestionDetails}
                            multiline
                            numberOfLines={5}
                        />
                    </Box>
                </VStack>

                {/* Media Upload (Optional) */}
                <VStack space="sm">
                    <Text
                        fontSize={10}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                    >
                        Media (optional)
                    </Text>

                    <Pressable
                        onPress={() => {
                            console.log('Media upload pressed');
                        }}
                        width={60}
                        height={60}
                        borderWidth={1}
                        borderColor={isDark ? '#333333' : '#9E9E9E'}
                        borderStyle="dashed"
                        borderRadius={5}
                        justifyContent="center"
                        alignItems="center"
                        bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                    >
                        <Feather
                            name="plus"
                            size={28}
                            color={isDark ? '#C1BEBF' : '#C1BEBF'}
                        />
                    </Pressable>
                </VStack>

                {/* Expert Prize */}
                <VStack space="sm">
                    <Text
                        fontSize={10}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                    >
                        Expert Prize
                    </Text>

                    <Box
                        borderWidth={1}
                        borderColor={isDark ? '#333333' : '#C8C8C8'}
                        borderRadius={10}
                        bg={isDark ? '#1A1A1A' : '#FDFDFB'}
                    >
                        <HStack justifyContent="space-between" alignItems="center" px="$4" py="$2">
                            <Text
                                fontSize={38}
                                fontWeight="$bold"
                                color={isDark ? '#909090' : '#909090'}
                            >
                                {expertPrize}
                            </Text>
                            <Box
                                bg={isDark ? '#2A2A2A' : '#E8E8E8'}
                                borderRadius={20}
                                px="$4"
                                py="$1"
                            >
                                <Text
                                    fontSize={9}
                                    fontWeight="$bold"
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                >
                                    Max
                                </Text>
                            </Box>
                        </HStack>

                        <Box
                            height={1}
                            bg={isDark ? '#333333' : '#D9D9D9'}
                        />

                        <HStack justifyContent="space-between" alignItems="center" px="$4" py="$3">
                            <Text
                                fontSize={9}
                                fontWeight="$medium"
                                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            >
                                $5
                            </Text>
                            <Text
                                fontSize={9}
                                fontWeight="$medium"
                                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            >
                                Current Balance : 500 TIPS
                            </Text>
                        </HStack>
                    </Box>
                </VStack>
            </VStack>

            {/* Action Buttons */}
            <HStack space="sm" mt="$6" mb="$4">
                <Pressable
                    onPress={onClose}
                    flex={1}
                    bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                    borderRadius={8}
                    py="$3"
                    alignItems="center"
                >
                    <Text
                        fontSize={12}
                        fontWeight="$bold"
                        color={isDark ? '#9E9E9E' : '#9E9E9E'}
                    >
                        Cancel
                    </Text>
                </Pressable>

                <Pressable
                    onPress={handleSubmit}
                    flex={1.7}
                    bg="#C2E607"
                    borderRadius={8}
                    py="$3"
                    alignItems="center"
                >
                    <Text
                        fontSize={12}
                        fontWeight="$bold"
                        color="#111111"
                    >
                        Change TIPS
                    </Text>
                </Pressable>
            </HStack>
        </Box>
    );
};

export { ExpertBottomSheet };
export default ExpertBottomSheet;
