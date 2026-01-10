import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Image,
    Modal,
    ModalBackdrop,
    ModalContent,
    ModalBody,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface CongratsModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const CongratsModal: React.FC<CongratsModalProps> = ({ isVisible, onClose }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Modal style={{ flex: 1 }} isOpen={isVisible} onClose={onClose}>
            <ModalBackdrop />
            <ModalContent
                width="90%"
                maxWidth={358}
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderRadius={10}
            >
                <ModalBody p="$0">
                    <VStack flex={1} space="md">
                        {/* 1. VStack - Photo Section */}
                        <VStack alignItems="center" space="sm" pt="$4">
                            {/* Congrats Image */}
                            <Box
                                width={132}
                                height={133}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Image
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                    }}
                                    source={require('@/assets/congrats.png')}
                                    alt="Congrats"
                                    resizeMode="contain"
                                />
                            </Box>

                            {/* Congrats Text */}
                            <Text
                                fontSize={20}
                                fontWeight="$bold"
                                color={isDark ? '#FFFFFF' : '#000000'}
                                textAlign="center"
                            >
                                Congrats!
                            </Text>
                        </VStack>

                        {/* 2. HStack - Two User Profiles (Symmetrical) */}
                        <HStack justifyContent="space-between" alignItems="center" space="xl" pb='$2'>
                            {/* Expert 1 - Micheal Clark (Left) */}
                            <HStack alignItems="center" space="xs" width={120}>
                                <Box
                                    width={42}
                                    height={42}
                                    borderRadius={21}
                                    bg="#F400FF"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <Image
                                        source={require('@/assets/avatar/default-useravatar.png')}
                                        alt="Micheal Clark"
                                        width={38}
                                        height={38}
                                        borderRadius={19}
                                    />
                                </Box>
                                <VStack space="xs">
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={11}
                                        fontWeight="$semibold"
                                        textAlign='left'
                                    >
                                        Micheal Clark
                                    </Text>
                                    <Text
                                        color={isDark ? '#787878' : '#787878'}
                                        fontSize={9}
                                        fontWeight="$medium"
                                        numberOfLines={1}
                                    >
                                        Technology Enthuist...
                                    </Text>
                                </VStack>
                            </HStack>

                            {/* Expert 2 - Trevor Nace (Right) */}
                            <HStack alignItems="center" space="xs" width={120} flexDirection="row-reverse">
                                <Box
                                    width={42}
                                    height={42}
                                    borderRadius={21}
                                    bg="#F400FF"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <Image
                                        source={require('@/assets/avatar/default-useravatar.png')}
                                        alt="Trevor Nace"
                                        width={38}
                                        height={38}
                                        borderRadius={19}
                                    />
                                </Box>
                                <VStack space="xs">
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={11}
                                        fontWeight="$semibold"
                                        textAlign='right'
                                    >
                                        Trevor Nace
                                    </Text>
                                    <Text
                                        color={isDark ? '#787878' : '#787878'}
                                        fontSize={9}
                                        fontWeight="$medium"
                                        textAlign='right'
                                        numberOfLines={1}
                                    >
                                        Technology Enthuist...
                                    </Text>
                                </VStack>
                            </HStack>
                        </HStack>

                        {/* 3. VStack - Question and Expert Answer */}
                        <VStack space="sm">
                            {/* Question Section */}
                            <VStack space="sm">
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
                                        Question
                                    </Text>
                                </HStack>

                                <Text
                                    fontSize={10}
                                    fontWeight="$normal"
                                    color={isDark ? '#343434' : '#343434'}
                                    lineHeight={12}
                                    px="$3"
                                    ml='$6'
                                >
                                    Choosing between LG OLED C3 and Samsung QN90C Neo QLED (65"). Concerned about OLED burn-in vs QLED brightness in a bright room, which is better long term?
                                </Text>
                            </VStack>

                            {/* Expert Answer Section */}
                            <VStack space="sm" mt='$2'>
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
                                    color={isDark ? '#343434' : '#343434'}
                                    lineHeight={12}
                                    px="$3"
                                    ml='$6'
                                >
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                </Text>
                            </VStack>
                        </VStack>

                        {/* 4. HStack - Expert Prize */}
                        <HStack
                            justifyContent="space-between"
                            alignItems="center"
                            borderTopWidth={1}
                            borderColor={isDark ? '#333333' : '#D9D9D9'}
                            px="$6"
                            py="$3"
                        >
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
                                50 TIPS
                            </Text>
                        </HStack>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default CongratsModal;
