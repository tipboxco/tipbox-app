import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Image, 
  Pressable,
  Input,
  InputField,
  Textarea,
  TextareaInput,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
  ChevronDownIcon,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody
} from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { mock_user_card } from '@/src/mock/profile/userCardData';
import { useUpdateProfile } from '../api/hooks';
import type { ProfileStackParamList } from '../navigation';

type ProfileEditScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const ProfileEditScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProfileEditScreenNavigationProp>();

  // Form state
  const [name, setName] = useState(mock_user_card.name);
  const [bio, setBio] = useState(mock_user_card.description);
  const [badge1, setBadge1] = useState('');
  const [badge2, setBadge2] = useState('');
  const [badge3, setBadge3] = useState('');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [selectedAvatarType, setSelectedAvatarType] = useState<'picture' | 'cosmetic'>('picture');

  // Update Profile mutation
  const updateProfileMutation = useUpdateProfile();

  const handleSave = () => {
    // Validate name (min 2 characters)
    if (name.trim().length < 2) {
      Alert.alert('Hata', 'İsim en az 2 karakter olmalıdır');
      return;
    }

    // Validate biography (max 500 characters)
    if (bio.trim().length > 500) {
      Alert.alert('Hata', 'Biyografi en fazla 500 karakter olabilir');
      return;
    }

    // Collect badge IDs (filter out empty strings)
    const badgeIds = [badge1, badge2, badge3].filter((badge) => badge.trim().length > 0);

    // Prepare update data
    const updateData: {
      name?: string;
      biography?: string;
      badge?: string[];
      cosmetic?: string | null;
      avatar?: string | null;
      banner?: string | null;
    } = {
      name: name.trim(),
      biography: bio.trim() || undefined,
    };

    // Add badge array if there are any badges
    if (badgeIds.length > 0) {
      updateData.badge = badgeIds;
    }

    // TODO: Add avatar, banner, cosmetic when image picker is implemented
    // For now, we'll only update name, biography, and badges

    updateProfileMutation.mutate(updateData, {
      onSuccess: () => {
        Alert.alert('Başarılı', 'Profil başarıyla güncellendi!', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      },
      onError: (error) => {
        Alert.alert('Hata', error.message || 'Profil güncellenirken bir hata oluştu');
      },
    });
  };

  const handleAvatarChange = () => {
    setIsAvatarModalVisible(true);
  };

  const handleSaveAvatarChange = () => {
    setIsAvatarModalVisible(false);
    // TODO: Implement avatar change
    console.log('Save avatar change:', selectedAvatarType);
  };

  const handleBannerChange = () => {
    // TODO: Implement image picker
    console.log('Change banner');
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <Header
        title="Edit Profile"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable onPress={handleSave}>
            <Text
              color="#E8FF6B"
              fontSize={15}
              fontWeight="$semibold"
            >
              Save
            </Text>
          </Pressable>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="lg">
          {/* Banner Section */}
          <Box position="relative">
            <Box h={160} overflow="hidden">
              <Image
                source={require('@/assets/banner/banner_01.png')}
                alt="Profile Banner"
                w="100%"
                h="100%"
                resizeMode="cover"
              />
            </Box>
            
            {/* Change Banner Button - Center */}
            <Pressable
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(0, 0, 0, 0.3)"
              justifyContent="center"
              alignItems="center"
              onPress={handleBannerChange}
            >
              <Image
                source={require('@/assets/icons/camera_plus.png')}
                alt="Change Banner"
                w={24}
                h={24}
                resizeMode="contain"
              />
            </Pressable>

            {/* Avatar Section */}
            <Box
              position="absolute"
              bottom={-40}
              left={16}
              borderRadius={100}
              overflow="hidden"
              w={100}
              h={100}
              borderWidth={4}
              borderColor={isDark ? '$backgroundDark950' : '$backgroundLight0'}
            >
              <Image
                source={mock_user_card.avatar}
                alt={name}
                w="100%"
                h="100%"
              />
              
              {/* Change Avatar Button - Center Overlay */}
              <Pressable
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(0, 0, 0, 0.4)"
                justifyContent="center"
                alignItems="center"
                onPress={handleAvatarChange}
              >
                <Image
                  source={require('@/assets/icons/camera_plus.png')}
                  alt="Change Avatar"
                  w={24}
                  h={24}
                  resizeMode="contain"
                />
              </Pressable>
            </Box>
          </Box>

          {/* Form Fields */}
          <VStack space="xl" px="$4" mt="$10">
            {/* Name Field */}
            <VStack space="xs">
              <Text
                color={isDark ? '$textDark200' : '$textLight700'}
                fontSize={11}
                fontWeight="$semibold"
              >
                Name
              </Text>
              <Input
                variant="outline"
                size="xl"
                bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                borderWidth={0}
                borderRadius={8}
              >
                <InputField
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={11}
                />
              </Input>
            </VStack>

            {/* Bio Field */}
            <VStack space="xs">
              <Text
                color={isDark ? '$textDark200' : '$textLight700'}
                fontSize={11}
                fontWeight="$semibold"
              >
                Bio
              </Text>
              <Textarea
                bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                borderWidth={0}
                borderRadius={8}
                h={120}
              >
                <TextareaInput
                  value={bio}
                  onChangeText={(text) => {
                    if (text.length <= 160) setBio(text);
                  }}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={11}
                  multiline
                />
              </Textarea>
            </VStack>

            {/* Badge Section */}
            <VStack space="xs">
              <Text
                color={isDark ? '$textDark200' : '$textLight700'}
                fontSize={11}
                fontWeight="$semibold"
              >
                Badge
              </Text>
              
              {/* Badge 1 */}
              <Select
                selectedValue={badge1}
                onValueChange={setBadge1}
              >
                <SelectTrigger
                  variant="outline"
                  size="xl"
                  bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                  borderWidth={0}
                  borderRadius={8}
                >
                  <SelectInput
                    placeholder="Select Badge 1"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize={11}
                  />
                  <SelectIcon mr="$3" as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="Everyday Consumer" value="everyday_consumer" />
                    <SelectItem label="Home Appliance Enthusiast" value="home_appliance" />
                    <SelectItem label="Product Reviewer" value="product_reviewer" />
                    <SelectItem label="Tech Expert" value="tech_expert" />
                  </SelectContent>
                </SelectPortal>
              </Select>

              {/* Badge 2 */}
              <Select
                selectedValue={badge2}
                onValueChange={setBadge2}
              >
                <SelectTrigger
                  variant="outline"
                  size="xl"
                  bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                  borderWidth={0}
                  borderRadius={8}
                >
                  <SelectInput
                    placeholder="Select Badge 2"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize={11}
                  />
                  <SelectIcon mr="$3" as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="Everyday Consumer" value="everyday_consumer" />
                    <SelectItem label="Home Appliance Enthusiast" value="home_appliance" />
                    <SelectItem label="Product Reviewer" value="product_reviewer" />
                    <SelectItem label="Tech Expert" value="tech_expert" />
                  </SelectContent>
                </SelectPortal>
              </Select>

              {/* Badge 3 */}
              <Select
                selectedValue={badge3}
                onValueChange={setBadge3}
              >
                <SelectTrigger
                  variant="outline"
                  size="xl"
                  bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                  borderWidth={0}
                  borderRadius={8}
                >
                  <SelectInput
                    placeholder="Select Badge 3"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize={11}
                  />
                  <SelectIcon mr="$3" as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="Everyday Consumer" value="everyday_consumer" />
                    <SelectItem label="Home Appliance Enthusiast" value="home_appliance" />
                    <SelectItem label="Product Reviewer" value="product_reviewer" />
                    <SelectItem label="Tech Expert" value="tech_expert" />
                  </SelectContent>
                </SelectPortal>
              </Select>
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>

      {/* Avatar Change Modal */}
      <Modal isOpen={isAvatarModalVisible} onClose={() => setIsAvatarModalVisible(false)} flex={1}>
        <ModalBackdrop />
        <ModalContent
          width="90%"
          maxWidth={360}
          bg={isDark ? '#1A1A1A' : '#FFFFFF'}
          borderRadius={16}
        >
          <ModalBody p="$0">
            <VStack space="lg" py="$6">
              {/* Large Profile Photo */}
              <VStack alignItems="center" space="md">
                <Box
                  width={110}
                  height={110}
                  borderRadius={70}
                  borderWidth={2}
                  borderColor="#FF0000"
                  overflow="hidden"
                >
                  <Image
                    source={mock_user_card.avatar}
                    alt={name}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </Box>

                {/* Name */}
                <Text
                  fontSize={18}
                  fontWeight="$bold"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  textAlign="center"
                >
                  {name}
                </Text>
              </VStack>

              <Box h={1} w="100%" bg={'#DEDEDE'} my={"$3"} />

              {/* Avatar Type Selection */}
              <HStack space="lg" justifyContent="center" px="$6">
                {/* Profile Picture Option */}
                <Pressable
                  onPress={() => setSelectedAvatarType('picture')}
                  alignItems="center"
                  flex={1}
                >
                  <VStack space="xs" alignItems="center">
                    <Box
                      width={64}
                      height={64}
                      borderRadius={40}
                      overflow="hidden"
                      bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                    >
                      <Image
                        source={mock_user_card.avatar}
                        alt="Profile Picture"
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </Box>
                    <Text
                      fontSize={12}
                      fontWeight={"#semibold"}
                      color={isDark ? '#FFFFFF' : '#818181'}
                      textAlign="center"
                    >
                      Profile Picture
                    </Text>
                  </VStack>
                </Pressable>

                <Box h="100%" w={1} bg={'#DEDEDE'} mx={"$3"} />

                {/* Profile Cosmetic Option */}
                <Pressable
                  onPress={() => setSelectedAvatarType('cosmetic')}
                  alignItems="center"
                  flex={1}
                >
                  <VStack space="xs" alignItems="center">
                    <Box
                      width={64}
                      height={64}
                      borderRadius={40}
                      borderWidth={2}
                      borderColor="#FF0000"
                      overflow="hidden"
                      bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                    >
                      <Image
                        source={mock_user_card.avatar}
                        alt="Profile Cosmetic"
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </Box>
                    <Text
                      fontSize={12}
                      fontWeight={"#semibold"}
                      color={isDark ? '#FFFFFF' : '#818181'}
                      textAlign="center"
                    >
                      Profile Cosmetic
                    </Text>
                  </VStack>
                </Pressable>
              </HStack>

              {/* Action Buttons */}
              <HStack space="sm" px="$6" mt="$2">
                {/* Cancel Button */}
                <Pressable
                  onPress={() => setIsAvatarModalVisible(false)}
                  flex={1}
                  bg={isDark ? '#2A2A2A' : '#EDEDED'}
                  borderRadius={12}
                  py="$3"
                  alignItems="center"
                >
                  <Text
                    fontSize={14}
                    fontWeight="$semibold"
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  >
                    Cancel
                  </Text>
                </Pressable>

                {/* Save Button */}
                <Pressable
                  onPress={handleSaveAvatarChange}
                  flex={2}
                  bg="#E8FF6B"
                  borderRadius={12}
                  py="$3"
                  alignItems="center"
                >
                  <Text
                    fontSize={12}
                    fontWeight="$bold"
                    color="#000000"
                  >
                    Save
                  </Text>
                </Pressable>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      </Box>
    </SafeAreaView>
  );
};

ProfileEditScreen.displayName = 'ProfileEditScreen';

export default ProfileEditScreen;

