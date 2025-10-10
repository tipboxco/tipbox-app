import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
} from '@gluestack-ui/themed';
import { TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import CongratsModal from '../CongratsModal';

interface ExpertBottomSheetProps {
    onClose: () => void;
}

type ExpertStep = 'form' | 'searching' | 'matched';

const ExpertBottomSheet: React.FC<ExpertBottomSheetProps> = ({ onClose }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const [currentStep, setCurrentStep] = useState<ExpertStep>('form');
    const [selectedCategory, setSelectedCategory] = useState('Select the category of your question');
    const [questionDetails, setQuestionDetails] = useState('');
    const [expertPrize, setExpertPrize] = useState('50');
    const [showCongratsModal, setShowCongratsModal] = useState(false);

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
        setCurrentStep('searching');
    };

    const handleCancel = () => {
        if (currentStep === 'form') {
            onClose();
        } else {
            setCurrentStep('form');
        }
    };

    const renderFormStep = () => (
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
    );

    const renderSearchingStep = () => (
        <VStack flex={1} alignItems="center" justifyContent="center" space="lg">
            {/* Radar Animation */}
            <Image
                source={require('@/assets/radar.png')}
                alt="Radar Animation"
                width={234}
                height={234}
                resizeMode="contain"
            />

            {/* Status Card */}
            <VStack alignItems="center" space="sm">
                <Box
                    bg="#9699E5"
                    borderWidth={1}
                    borderColor="#5B60DF"
                    borderRadius={20}
                    px="$6"
                    py="$1"
                >
                    <HStack alignItems="center" space="sm">
                        <Feather
                            name="clock"
                            size={18}
                            color="#000"
                        />
                        <Text
                            fontSize={12}
                            fontWeight="$bold"
                            color="#000"
                        >
                            3 Min
                        </Text>
                    </HStack>
                </Box>

                <VStack alignItems="center" space="xs">
                    <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                        textAlign="center"
                    >
                        Finding Available Experts Nearby
                    </Text>
                    <Text
                        fontSize={11}
                        fontWeight="$medium"
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        textAlign="center"
                        px="$4"
                    >
                        Your question is being broadcasted to the expert user
                    </Text>
                </VStack>
            </VStack>

            {/* Question Display */}
            <VStack space="sm" px="$4" width="100%">
                <HStack alignItems="center" space="sm">
                    <Feather
                        name="help-circle"
                        size={24}
                        color={isDark ? '#FFFFFF' : '#000000'}
                    />
                    <Text
                        fontSize={12}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                    >
                        Your Question
                    </Text>
                </HStack>
                
                <Text
                    fontSize={10}
                    fontWeight="$normal"
                    color={isDark ? '#343434' : '#343434'}
                    lineHeight={14}
                    px="$3"
                >
                    {questionDetails || 'Choosing between LG OLED C3 and Samsung QN90C Neo QLED (65"). Concerned about OLED burn-in vs QLED brightness in a bright room, which is better long term?'}
                </Text>
            </VStack>

            {/* Answer Section */}
            <VStack space="sm" px="$4" width="100%">
                <HStack alignItems="center" space="sm">
                    <Feather
                        name="message-circle"
                        size={24}
                        color={isDark ? '#FFFFFF' : '#000000'}
                    />
                    <Text
                        fontSize={12}
                        fontWeight="$bold"
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                        Answer
                    </Text>
                </HStack>
                
                <Text
                    fontSize={10}
                    fontWeight="$normal"
                    color={isDark ? '#343434' : '#343434'}
                    lineHeight={14}
                    px="$3"
                >
                    aranıyor Giff gelecek
                </Text>
            </VStack>

            {/* Expert Prize Display */}
            <VStack borderBottomWidth={1} borderTopWidth={1} borderColor={isDark ? '#333333' : '#D9D9D9'} space="xs" px="$4" py="$1" width="100%">
                <HStack justifyContent="space-between" alignItems="center">
                    <Text
                        fontSize={12}
                        fontWeight="$semibold"
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                        Expert Prize
                    </Text>
                    <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color={isDark ? '#909090' : '#909090'}
                    >
                        {expertPrize} TIPS
                    </Text>
                </HStack>
            </VStack>
        </VStack>
    );

    const renderMatchedStep = () => (
        <VStack flex={1} space="lg">
            {/* Question Display */}
            <VStack space="sm" px="$4" width="100%">
                <HStack alignItems="center" space="sm">
                    <Feather
                        name="help-circle"
                        size={24}
                        color={isDark ? '#FFFFFF' : '#000000'}
                    />
                    <Text
                        fontSize={12}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                    >
                        Your Question
                    </Text>
                </HStack>
                
                <Text
                    fontSize={10}
                    fontWeight="$normal"
                    color={isDark ? '#343434' : '#343434'}
                    lineHeight={14}
                    px="$3"
                >
                    {questionDetails || 'Choosing between LG OLED C3 and Samsung QN90C Neo QLED (65"). Concerned about OLED burn-in vs QLED brightness in a bright room, which is better long term?'}
                </Text>
            </VStack>

            {/* Expert Answer */}
            <VStack space="sm" px="$4" width="100%">
                <HStack alignItems="center" space="sm">
                    <Feather
                        name="message-circle"
                        size={24}
                        color={isDark ? '#FFFFFF' : '#000000'}
                    />
                    <Text
                        fontSize={12}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                    >
                        Expert Answer
                    </Text>
                </HStack>
                
                <Text
                    fontSize={10}
                    fontWeight="$normal"
                    color={isDark ? '#000000' : '#000000'}
                    lineHeight={12}
                    px="$3"
                >
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </Text>
            </VStack>

            {/* Expert Info */}
            <VStack space="sm" px="$4" width="100%">
                <HStack alignItems="center" space="md">
                    {/* Avatar */}
                    <Box
                        width={48}
                        height={48}
                        borderRadius={24}
                        bg="#F400FF"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Image
                            source={require('@/assets/avatar/ozan.png')}
                            alt="Expert Avatar"
                            width={42}
                            height={42}
                            borderRadius={21}
                        />
                    </Box>

                    {/* Expert Info */}
                    <VStack flex={1} space="xs">
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={11}
                            fontWeight="$semibold"
                        >
                            Trevor Nace
                        </Text>
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={9}
                            fontWeight="$medium"
                            numberOfLines={1}
                        >
                            Technology Enthuistant - Hardware Expert - Digital Innovation Specialist
                        </Text>
                    </VStack>
                </HStack>
            </VStack>

            {/* Expert Prize Display */}
            <VStack borderBottomWidth={1} borderTopWidth={1} borderColor={isDark ? '#333333' : '#D9D9D9'} space="xs" px="$4" py="$1" width="100%">
                <HStack justifyContent="space-between" alignItems="center">
                    <Text
                        fontSize={12}
                        fontWeight="$semibold"
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                        Expert Prize
                    </Text>
                    <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color={isDark ? '#909090' : '#909090'}
                    >
                        {expertPrize} TIPS
                    </Text>
                </HStack>
            </VStack>
        </VStack>
    );

    return (
        <Box
            flex={1}
            bg={isDark ? '#1A1A1A' : '#FDFDFB'}
            borderTopLeftRadius={30}
            borderTopRightRadius={30}
            px="$4"
        >
            {/* Content based on current step */}
            {currentStep === 'form' && renderFormStep()}
            {currentStep === 'searching' && renderSearchingStep()}
            {currentStep === 'matched' && renderMatchedStep()}

            {/* Action Buttons */}
            <HStack space="sm" mt="$6" mb="$4">
                {currentStep === 'matched' ? (
                    <>
                        {/* Flag Button */}
                        <Pressable
                            onPress={() => console.log('Flag pressed')}
                            width={44}
                            height={44}
                            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                            borderRadius={5}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Feather
                                name="flag"
                                size={20}
                                color={isDark ? '#9E9E9E' : '#9E9E9E'}
                            />
                        </Pressable>

                        {/* Extra TIPS Button */}
                        <Pressable
                            onPress={() => console.log('Extra TIPS pressed')}
                            flex={1}
                            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                            borderRadius={5}
                            py="$3"
                            alignItems="center"
                        >
                            <Text
                                fontSize={12}
                                fontWeight="$bold"
                                color={isDark ? '#9E9E9E' : '#9E9E9E'}
                            >
                                Extra TIPS
                            </Text>
                        </Pressable>

                        {/* Accept Answer Button */}
                        <Pressable
                            onPress={() => {
                                console.log('Accept Answer pressed');
                                setShowCongratsModal(true);
                                onClose();
                            }}
                            flex={1.7}
                            bg="#D8FF08"
                            borderRadius={5}
                            py="$3"
                            alignItems="center"
                        >
                            <Text
                                fontSize={12}
                                fontWeight="$bold"
                                color="#111111"
                            >
                                Accept Answer
                            </Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <Pressable
                            onPress={handleCancel}
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

                        {(currentStep === 'form' || currentStep === 'searching') && (
                            <Pressable
                                onPress={currentStep === 'form' ? handleSubmit : () => setCurrentStep('matched')}
                                flex={1.7}
                                bg="#D8FF08"
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
                        )}
                    </>
                )}
            </HStack>

            {/* Congrats Modal */}
            <CongratsModal
                isVisible={showCongratsModal}
                onClose={() => setShowCongratsModal(false)}
            />
        </Box>
    );
};

export { ExpertBottomSheet };
export default ExpertBottomSheet;
