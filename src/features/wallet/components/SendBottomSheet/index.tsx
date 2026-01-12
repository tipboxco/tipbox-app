import React, { useState } from 'react';
import { VStack, HStack, Text, Pressable, Box, Input, InputField, Image } from '@gluestack-ui/themed';
import {
  ChevronLeftIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  InformationCircleIcon,
  ArrowsRightLeftIcon,
  UserIcon,
  UsersIcon,
} from 'react-native-heroicons/outline';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SendFriendBottomSheet } from '../SendFriendBottomSheet';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';

interface SendBottomSheetProps {
  onClose: () => void;
  onWalletAddressPress?: () => void;
  onFriendPress?: () => void;
  onViewChange?: (view: 'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection') => void;
  onSuccess?: (transactionDetails: {
    sentAmount: string;
    transactionFee: string;
    remainingBalance: string;
    transactionId?: string;
  }) => void;
}

export const SendBottomSheet: React.FC<SendBottomSheetProps> = ({
  onClose,
  onWalletAddressPress,
  onFriendPress,
  onViewChange,
  onSuccess,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [view, setView] = useState<'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection'>('options');
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSwapped, setIsSwapped] = useState(false); // false = TIPS mode, true = USD mode
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string; title?: string; bio?: string; avatar: any } | null>(null);
  
  // Conversion rate: 1 TIPS = $0.01 (20,000 TIPS = $200)
  const TIPS_TO_USD_RATE = 0.01;
  const USD_TO_TIPS_RATE = 100;

  // Mock recent addresses
  const recentAddresses = [
    { address: 'F4184fc596......0e9', lastUsed: '11 ay önce kullanıldı' },
    { address: 'F4184fc596......0e9', lastUsed: '11 ay önce kullanıldı' },
    { address: 'F4184fc596......0e9', lastUsed: '11 ay önce kullanıldı' },
  ];

  // Mock friends list
  const mockFriends = [
    { id: '1', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '2', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '3', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '4', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '5', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '6', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '7', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '8', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '9', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '10', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '11', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '12', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
  ];

  const handleWalletAddressSelect = () => {
    setView('wallet-address');
    onViewChange?.('wallet-address');
    onWalletAddressPress?.();
  };

  const handleBack = () => {
    setView('options');
    onViewChange?.('options');
  };

  const handleConfirmFromAddress = () => {
    console.log('[SendBottomSheet] Confirm from address pressed');
    // Navigate to amount view
    // First update local state
    setView('amount');
    console.log('[SendBottomSheet] View state set to amount');
    // Then notify parent to update bottom sheet snap point
    onViewChange?.('amount');
    console.log('[SendBottomSheet] onViewChange callback called');
  };

  const handleConfirmFromAmount = () => {
    console.log('[SendBottomSheet] Confirm from amount pressed');
    const inputValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
    console.log('[SendBottomSheet] Amount value:', inputValue);
    
    if (inputValue > 0) {
      // Navigate to confirmation view
      console.log('[SendBottomSheet] Navigating to confirmation view');
      setView('confirmation');
      onViewChange?.('confirmation');
    } else {
      console.log('[SendBottomSheet] Invalid amount, cannot proceed');
    }
  };

  // Calculate transaction fee and remaining balance
  const getTransactionDetails = () => {
    const inputValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
    const tipsAmount = isSwapped ? Math.round(inputValue * USD_TO_TIPS_RATE) : Math.round(inputValue);
    const usdAmount = isSwapped ? inputValue : (tipsAmount * TIPS_TO_USD_RATE);
    // Transaction fee: 0.001% of the amount in USD
    const transactionFee = usdAmount * 0.00001;
    const remainingBalance = 20000 - tipsAmount; // 20000 TIPS - sent amount
    
    return {
      tipsAmount,
      usdAmount: usdAmount.toFixed(2),
      transactionFee: transactionFee.toFixed(4),
      remainingBalance: Math.max(0, remainingBalance),
    };
  };

  const handleMaxPress = () => {
    if (isSwapped) {
      setAmount('200'); // Max USD = $200
    } else {
      setAmount('20000'); // Max TIPS = 20,000
    }
  };

  const handleSwap = () => {
    const currentValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
    let newValue = '';
    
    if (isSwapped) {
      // Converting from USD to TIPS
      newValue = Math.round(currentValue * USD_TO_TIPS_RATE).toString();
    } else {
      // Converting from TIPS to USD
      newValue = (currentValue * TIPS_TO_USD_RATE).toFixed(2);
    }
    
    setAmount(newValue);
    setIsSwapped(!isSwapped);
  };

  // Calculate display value for the bottom section
  const getDisplayValue = () => {
    const inputValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
    
    if (isSwapped) {
      // If in USD mode, show TIPS equivalent
      const tipsValue = Math.round(inputValue * USD_TO_TIPS_RATE);
      return `${tipsValue.toLocaleString()} TIPS`;
    } else {
      // If in TIPS mode, show USD equivalent
      const usdValue = (inputValue * TIPS_TO_USD_RATE).toFixed(2);
      return `$${parseFloat(usdValue).toLocaleString()}`;
    }
  };

  console.log('[SendBottomSheet] Current view:', view);
  
  if (view === 'options') {
    return (
      <VStack px="$4" py="$4" space="lg">
        {/* Title */}
        <HStack justifyContent="center" alignItems="center">
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            TIPS Gönder
          </Text>
        </HStack>

        {/* Option Cards */}
        <VStack space="md">
          {/* Wallet Address Option */}
          <Pressable onPress={handleWalletAddressSelect}>
            <Box
              bg="$backgroundLight0"
              $dark-bg="$backgroundDark800"
              borderWidth={1}
              borderColor="$borderLight200"
              $dark-borderColor="$borderDark600"
              rounded={10}
              p="$4"
            >
              <HStack space="md" alignItems="center">
                <Box
                  w={24}
                  h={24}
                  bg="$backgroundLight50"
                  $dark-bg="$backgroundDark700"
                  rounded={6}
                  alignItems="center"
                  justifyContent="center"
                >
                  <CreditCardIcon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
                <VStack flex={1} space="xs">
                  <Text fontSize={12} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                    Cüzdan Adresine Gönder
                  </Text>
                  <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" lineHeight={14}>
                    TIPS Yollamak istediğiniz cüzdan adresini yapıştırarak gönderim sağlayın.
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </Pressable>

          {/* Friend Option */}
          <Pressable onPress={() => {
            setView('friend-selection');
            onViewChange?.('friend-selection');
            onFriendPress?.();
          }}>
            <Box
              bg="$backgroundLight0"
              $dark-bg="$backgroundDark800"
              borderWidth={1}
              borderColor="$borderLight200"
              $dark-borderColor="$borderDark600"
              rounded={10}
              p="$4"
            >
              <HStack space="md" alignItems="center">
                <Box
                  w={24}
                  h={24}
                  bg="$backgroundLight50"
                  $dark-bg="$backgroundDark700"
                  rounded={6}
                  alignItems="center"
                  justifyContent="center"
                >
                  <UsersIcon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
                <VStack flex={1} space="xs">
                  <Text fontSize={12} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                    Arkadaşına Gönder
                  </Text>
                  <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" lineHeight={14}>
                    TIPS Yollamak istediğiniz arkadaşınızı arkadaş listesinden seçerek gönderim sağlayın.
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </Pressable>
        </VStack>
      </VStack>
    );
  }

  if (view === 'wallet-address') {
    // Wallet Address View
    return (
    <VStack px="$4" py="$4" space="md" flex={1}>
      {/* Header with back button */}
      <HStack alignItems="center" space="md" mb="$2">
        <Pressable onPress={handleBack}>
          <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <HStack flex={1} justifyContent="center" alignItems="center">
                  <CreditCardIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" ml="$2">
            TIPS Gönder
          </Text>
        </HStack>
        <Box w={24} />
      </HStack>

      {/* Input Field */}
      <Box
        bg="#FDFDFD"
        $dark-bg="$backgroundDark800"
        borderWidth={1}
        borderColor="#E9E9E9"
        $dark-borderColor="$borderDark600"
        rounded={10}
        px="$4"
        py="$1"
      >
        <HStack alignItems="center" space="md">
          <Text fontSize={10} fontWeight="$bold" color="#7F7F7E" $dark-color="$textDark400">
            To:
          </Text>
          <Input flex={1} variant="outline" borderWidth={0}>
            <InputField
              placeholder="Wallet Address..."
              placeholderTextColor="#D9D9D9"
              value={walletAddress}
              onChangeText={setWalletAddress}
              fontSize={10}
              fontWeight="$bold"
              color="$textLight900"
              $dark-color="$textDark50"
            />
          </Input>
          <Pressable>
            <DocumentDuplicateIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </HStack>
      </Box>

      {/* Recent Section */}
      <VStack space="sm" mt="$2">
        <Text fontSize={12} fontWeight="$bold" color="#B9B9B9" $dark-color="$textDark400">
          Recent
        </Text>
        {recentAddresses.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => setWalletAddress(item.address)}
          >
            <HStack
              alignItems="center"
              space="md"
              py="$3"
              px="$2"
              rounded={6}
            >
                  <CreditCardIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
              <HStack flex={1} justifyContent="space-between">
                <Text fontSize={14} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400">
                  {item.address}
                </Text>
                <Text fontSize={9} color="#B9B9B9" $dark-color="$textDark400">
                  {item.lastUsed}
                </Text>
              </HStack>
            </HStack>
          </Pressable>
        ))}
      </VStack>

      {/* Confirm Button */}
      <Pressable
        onPress={handleConfirmFromAddress}
        bg="#D8FF08"
        $dark-bg="#D8FF08"
        rounded={8}
        py="$3"
        mt="auto"
        disabled={!walletAddress.trim()}
        opacity={walletAddress.trim() ? 1 : 0.5}
      >
        <Text fontSize={14} fontWeight="$bold" color="#111111" textAlign="center">
          Confirm
        </Text>
      </Pressable>
    </VStack>
    );
  }

  if (view === 'amount') {
    // Amount View
    return (
    <VStack px="$4" py="$4" space="md" flex={1}>
      {/* Header with back button */}
      <HStack alignItems="center" space="md" mb="$2">
        <Pressable onPress={() => {
          if (selectedFriend) {
            setView('friend-selection');
            onViewChange?.('friend-selection');
          } else {
            setView('wallet-address');
            onViewChange?.('wallet-address');
          }
        }}>
          <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <HStack flex={1} justifyContent="center" alignItems="center">
          <PaperAirplaneIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" ml="$2">
            TIPS Gönder
          </Text>
        </HStack>
        <Box w={24} />
      </HStack>

      {/* To: Friend or Address Field */}
      {selectedFriend ? (
        <Box
          bg="$backgroundLight0"
          $dark-bg="$backgroundDark800"
          borderWidth={1}
          borderColor="#E9E9E9"
          $dark-borderColor="$borderDark600"
          rounded={10}
          p="$4"
        >
          <HStack alignItems="center" space="md">
            <Text fontSize={10} fontWeight="$bold" color="#7F7F7E" $dark-color="$textDark400">
              To:
            </Text>
            {/* Friend Avatar */}
            <Box position="relative">
              <Box
                width={50}
                height={50}
                borderRadius={100}
                bg="#CE4A4A"
                alignItems="center"
                justifyContent="center"
              >
                <Box
                  width={46}
                  height={46}
                  borderRadius={23}
                  overflow="hidden"
                >
                  <Image
                    source={toImageSource(selectedFriend.avatar)!}
                    alt={selectedFriend.name}
                    width={46}
                    height={46}
                    resizeMode="cover"
                  />
                </Box>
              </Box>
            </Box>
            {/* Friend Info */}
            <VStack space="xs" flex={1}>
              <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                {selectedFriend.name}
              </Text>
              {(selectedFriend.title || selectedFriend.bio) && (
                <Text
                  fontSize={9}
                  fontWeight="$medium"
                  color="#8C8C8C"
                  $dark-color="$textDark400"
                  numberOfLines={1}
                >
                  {selectedFriend.title || selectedFriend.bio}
                </Text>
              )}
            </VStack>
          </HStack>
        </Box>
      ) : (
        <Box
          bg="$backgroundLight0"
          $dark-bg="$backgroundDark800"
          borderWidth={1}
          borderColor="#E9E9E9"
          $dark-borderColor="$borderDark600"
          rounded={10}
          p="$4"
        >
          <HStack alignItems="center" space="md">
            <Text fontSize={10} fontWeight="$bold" color="#7F7F7E" $dark-color="$textDark400">
              To:
            </Text>
            <Input flex={1} variant="outline" borderWidth={0} isDisabled={true}>
              <InputField
                value={walletAddress || '0x'}
                editable={false}
                fontSize={10}
                fontWeight="$medium"
                color="$textLight900"
                $dark-color="$textDark50"
              />
            </Input>
          </HStack>
        </Box>
      )}

      {/* Info Icon and Warning Message */}
      <HStack alignItems="center" space="sm" mt="$1">
        <Box
          w={16}
          h={16}
          rounded="$full"
          bg="$backgroundLight200"
          $dark-bg="$backgroundDark700"
          alignItems="center"
          justifyContent="center"
        >
          <InformationCircleIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
        <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" flex={1}>
          buraya uyarı mesajı yazılacak
        </Text>
      </HStack>

      {/* Amount Input Section */}
      <VStack space="md" alignItems="center" py="$2">
        {/* Amount Input with Swap Icon */}
        <Box w="100%" position="relative" alignItems="center" justifyContent="center" py="$2" px="$4">
          {/* Centered Input - Equal padding on both sides for proper centering */}
          <Box w="100%" alignItems="center" justifyContent="center" px="$16">
            <HStack alignItems="center" justifyContent="center" w="100%">
              {isSwapped && (
                <Text fontSize={44} fontWeight="$bold" color="#DDDDDD" $dark-color="$textDark400" mr="$1">
                  $
                </Text>
              )}
              <Input variant="outline" borderWidth={0} flex={1} minHeight={50} alignItems="center">
                <InputField
                  value={isSwapped ? amount.replace('$', '') : amount}
                  onChangeText={(text) => {
                    // Remove non-numeric characters except decimal point
                    const numericValue = text.replace(/[^0-9.]/g, '');
                    setAmount(numericValue);
                  }}
                  keyboardType="decimal-pad"
                  fontSize={44}
                  fontWeight="$bold"
                  color="#DDDDDD"
                  $dark-color="$textDark400"
                  textAlign="center"
                  placeholder={isSwapped ? "200" : "20.000"}
                  placeholderTextColor="#DDDDDD"
                />
              </Input>
            </HStack>
          </Box>
          {/* Swap Icon - Right side, absolute positioned */}
          <Box position="absolute" right="$4" top="$4">
            <Pressable onPress={handleSwap}>
              <ArrowsRightLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#808080'} />
            </Pressable>
          </Box>
        </Box>
        {/* Display Value Button - Centered */}
        <Pressable
          bg="#DDDDDD"
          $dark-bg="#DDDDDD"
          borderWidth={1}
          borderColor="#808080"
          $dark-borderColor="#808080"
          rounded={10}
          px="$5"
          py="$2"
          opacity={0.5}
          w={96}
          h={36}
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={12} fontWeight="$bold" color="#000000" $dark-color="#000000">
            {amount ? getDisplayValue() : (isSwapped ? '$0' : '0 TIPS')}
          </Text>
        </Pressable>
      </VStack>

      {/* Available Balance Section */}
      <HStack justifyContent="space-between" alignItems="center" px="$0" mt="$2">
        <VStack>
          <Text fontSize={10} fontWeight="$bold" color="#D9D9D9" $dark-color="$textDark400">
            Available Balance
          </Text>
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            20.000 TIPS
          </Text>
        </VStack>
        <Pressable
          bg="#EDEDEC"
          $dark-bg="$backgroundDark700"
          borderWidth={1}
          borderColor="#B5B5B5"
          $dark-borderColor="$borderDark600"
          rounded={5}
          px="$5"
          py="$1.5"
          onPress={handleMaxPress}
        >
          <Text fontSize={10} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            Max.
          </Text>
        </Pressable>
      </HStack>

      {/* Confirm Button */}
      {(() => {
        const inputValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
        const isEnabled = amount && inputValue > 0;
        
        return (
          <Pressable
            onPress={handleConfirmFromAmount}
            bg={isEnabled ? "#D8FF08" : "#EDEDEC"}
            $dark-bg={isEnabled ? "#D8FF08" : "$backgroundDark700"}
            borderWidth={isEnabled ? 0 : 1}
            borderColor={isEnabled ? "transparent" : "#B1B1B1"}
            $dark-borderColor={isEnabled ? "transparent" : "$borderDark600"}
            rounded={8}
            py="$3"
            mt="auto"
            disabled={!isEnabled}
            opacity={isEnabled ? 1 : 0.5}
          >
            <Text fontSize={14} fontWeight="$bold" color={isEnabled ? "#111111" : "#B1B1B1"} $dark-color={isEnabled ? "#111111" : "$textDark400"} textAlign="center">
              Confirm
            </Text>
          </Pressable>
        );
      })()}
    </VStack>
    );
  }

  // Confirmation View (view === 'confirmation')
  if (view === 'confirmation') {
    console.log('[SendBottomSheet] Rendering confirmation view, current view state:', view);
    const transactionDetails = getTransactionDetails();
    
    return (
    <VStack px="$4" py="$4" space="md" flex={1}>
      {/* Header with back button */}
      <HStack alignItems="center" space="md" mb="$2">
        <Pressable onPress={() => {
          setView('amount');
          onViewChange?.('amount');
        }}>
          <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <HStack flex={1} justifyContent="center" alignItems="center">
                  <CreditCardIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" ml="$2">
            TIPS Gönder
          </Text>
        </HStack>
        <Box w={24} />
      </HStack>

      {/* Amount Display */}
      <VStack space="md" alignItems="center" py="$2">
        <Text fontSize={44} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
          {transactionDetails.tipsAmount.toLocaleString()} TIPS
        </Text>
        <Pressable
          bg="#DDDDDD"
          $dark-bg="#DDDDDD"
          borderWidth={1}
          borderColor="#808080"
          $dark-borderColor="#808080"
          rounded={10}
          px="$5"
          py="$2"
          opacity={0.5}
          w={96}
          h={36}
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={12} fontWeight="$bold" color="#000000" $dark-color="#000000">
            ${transactionDetails.usdAmount}
          </Text>
        </Pressable>
      </VStack>

      {/* Sender and Receiver Card */}
      <Box
        bg="$backgroundLight0"
        $dark-bg="$backgroundDark800"
        borderWidth={1}
        borderColor="#D9D9D9"
        $dark-borderColor="$borderDark600"
        rounded={10}
        p="$4"
      >
        <HStack alignItems="center" justifyContent="space-between" w="100%">
          {/* Sender */}
          <HStack alignItems="center" space="sm" flex={1}>
            <Box w={29} h={29} rounded="$full" bg="#D9D9D9" $dark-bg="$backgroundDark700" alignItems="center" justifyContent="center" position="relative">
              <UserIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
              <Box position="absolute" bottom={-2} right={-2} w={16} h={16} rounded="$full" bg="$backgroundLight0" $dark-bg="$backgroundDark800" borderWidth={1} borderColor="#D9D9D9" alignItems="center" justifyContent="center">
                <CreditCardIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
            </Box>
            <VStack>
              <Text fontSize={10} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                Ozan Mutluoğlu
              </Text>
            </VStack>
          </HStack>

          {/* Arrow Icon */}
          <Box mx="$2" position="relative">
            <Feather 
              name="send" 
              size={24} 
              color={isDark ? '#FFFFFF' : '#000000'}
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          </Box>

          {/* Receiver */}
          <HStack alignItems="center" space="sm" flex={1} justifyContent="flex-end">
            {selectedFriend ? (
              <>
                <VStack alignItems="flex-end" flex={1}>
                  <Text fontSize={10} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right">
                    {selectedFriend.name}
                  </Text>
                  {(selectedFriend.title || selectedFriend.bio) && (
                    <Text fontSize={9} fontWeight="$medium" color="#8C8C8C" $dark-color="$textDark400" textAlign="right" numberOfLines={1}>
                      {selectedFriend.title || selectedFriend.bio}
                    </Text>
                  )}
                </VStack>
                <Box position="relative">
                  <Box
                    width={29}
                    height={29}
                    borderRadius={100}
                    bg="#CE4A4A"
                    alignItems="center"
                    justifyContent="center"
                    >
                    <Box
                      width={25}
                      height={25}
                      borderRadius={12}
                      overflow="hidden"
                    >
                      <Image
                        source={toImageSource(selectedFriend.avatar)!}
                        alt={selectedFriend.name}
                        width={25}
                        height={25}
                        resizeMode="cover"
                      />
                    </Box>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <VStack alignItems="flex-end">
                  <Text fontSize={10} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right">
                    {walletAddress || 'F418496......0e9'}
                  </Text>
                </VStack>
                <Box w={29} h={29} rounded="$full" bg="#D9D9D9" $dark-bg="$backgroundDark700" alignItems="center" justifyContent="center">
                  <CreditCardIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
              </>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Info Icon and Warning Message */}
      <HStack alignItems="center" space="sm">
        <Box
          w={16}
          h={16}
          rounded="$full"
          bg="$backgroundLight200"
          $dark-bg="$backgroundDark700"
          alignItems="center"
          justifyContent="center"
        >
          <InformationCircleIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
        <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" flex={1}>
          buraya uyarı mesajı gelecek
        </Text>
      </HStack>

      {/* Divider */}
      <Box h={1} bg="#D9D9D9" my="$2" />

      {/* Transaction Details */}
      <VStack space="xs">
        <HStack justifyContent="space-between" alignItems="center" w="100%">
          <Text fontSize={9} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400">
            İşlem Ücreti:
          </Text>
          <Text fontSize={9} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400">
            ${transactionDetails.transactionFee}
          </Text>
        </HStack>
        <HStack justifyContent="space-between" alignItems="center" w="100%">
          <Text fontSize={9} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400">
            İşlem Sonrası Bakiye:
          </Text>
          <Text fontSize={9} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400" textAlign="right">
            ${transactionDetails.usdAmount} - {transactionDetails.tipsAmount.toLocaleString()} TIPS
          </Text>
        </HStack>
      </VStack>

      {/* Send Button */}
      <Pressable
        onPress={() => {
          console.log('Sending transaction:', { walletAddress, amount: transactionDetails.tipsAmount });
          // Generate transaction ID (mock - in real app this would come from backend)
          const transactionId = `0x${Math.random().toString(16).substr(2, 64)}`;
          
          // Call onSuccess callback with transaction details
          onSuccess?.({
            sentAmount: `${transactionDetails.tipsAmount.toLocaleString()} TIPS`,
            transactionFee: `$${transactionDetails.transactionFee}`,
            remainingBalance: `${transactionDetails.remainingBalance.toLocaleString()} TIPS`,
            transactionId: transactionId,
          });
          onClose();
        }}
        bg="#D8FF08"
        $dark-bg="#D8FF08"
        rounded={8}
        py="$3"
        mt="auto"
      >
        <Text fontSize={14} fontWeight="$bold" color="#111111" $dark-color="#111111" textAlign="center">
          Send
        </Text>
      </Pressable>
    </VStack>
    );
  }

  if (view === 'friend-selection') {
    // Friend Selection View using SendFriendBottomSheet component
    return (
      <SendFriendBottomSheet
        friends={mockFriends}
        onFriendSelect={(friend) => {
          // Store selected friend and navigate to amount view
          setSelectedFriend(friend);
          setView('amount');
          onViewChange?.('amount');
        }}
        onBack={handleBack}
      />
    );
  }

  // Fallback - should never reach here
  console.warn('[SendBottomSheet] Unknown view state:', view);
  return null;
};

