import React from 'react';
import { View } from 'react-native';
import { Box, VStack, HStack, Text, Button, ButtonText, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { formatMessageTime } from '../../utils/messageHelpers';
import { useTranslation } from '@/src/hooks/useTranslation';
import type { MessageItemProps } from './types';

interface SupportRequestMessageProps extends Pick<MessageItemProps,
  'item' | 'isDark' | 'expandedSupportRequests' | 'onToggleSupportRequest' |
  'onAcceptSupportRequest' | 'onRejectSupportRequest' | 'onCancelSupportRequest' |
  'onGoToSupportChat' | 'currentUserId'> {
}

export const SupportRequestMessage: React.FC<SupportRequestMessageProps> = ({
  item,
  isDark,
  expandedSupportRequests = {},
  onToggleSupportRequest,
  onAcceptSupportRequest,
  onRejectSupportRequest,
  onCancelSupportRequest,
  onGoToSupportChat,
  currentUserId,
}) => {
  const { t } = useTranslation('inbox');

  if (!item.supportRequest) return null;

  const isExpanded = expandedSupportRequests[item.id];
  const isSent = item.isSent;
  const requestStatus = item.supportRequest.status;
  const requestId = item.supportRequest.requestId || item.id;
  const supportThreadId = item.supportRequest.threadId;
  const fromUserId = item.supportRequest.fromUserId;
  const toUserId = item.supportRequest.toUserId;

  const isSender = fromUserId === currentUserId;
  const isRecipient = toUserId === currentUserId;

  return (
    <VStack
      space="xs"
      alignItems={isSent ? 'flex-end' : 'flex-start'}
      py="$1"
    >
      <Box minWidth={250} maxWidth="85%">
        <Pressable onPress={() => onToggleSupportRequest?.(item.id)}>
          <Box
            bg={isDark ? '#FFFFFF' : '#FFFFFF'}
            borderRadius={12}
            borderWidth={0}
            py="$3"
            px="$3"
          >
            <HStack space="sm" alignItems="center" justifyContent="space-between">
              <HStack space="sm" alignItems="center" flex={1}>
                {requestStatus === 'pending' ? (
                  <>
                    <Feather
                      name="clock"
                      size={18}
                      color="#FFC107"
                    />
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color="#000000"
                    >
                      {t('supportRequest.statusLabels.created')}
                    </Text>
                  </>
                ) : requestStatus === 'canceled' ? (
                  <>
                    <Feather
                      name="x-circle"
                      size={18}
                      color="#9E9E9E"
                    />
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color="#000000"
                    >
                      {t('supportRequest.statusLabels.canceled')}
                    </Text>
                  </>
                ) : requestStatus === 'accepted' ? (
                  <>
                    <Feather
                      name="check-circle"
                      size={18}
                      color="#4CAF50"
                    />
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color="#000000"
                    >
                      {t('supportRequest.statusLabels.accepted')}
                    </Text>
                  </>
                ) : requestStatus === 'rejected' ? (
                  <>
                    <Feather
                      name="x-circle"
                      size={18}
                      color="#F44336"
                    />
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color="#000000"
                    >
                      {t('supportRequest.statusLabels.rejected')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Box
                      bg={isDark ? 'rgba(226, 255, 70, 0.15)' : 'rgba(226, 255, 70, 0.2)'}
                      p="$2"
                      borderRadius={10}
                    >
                      <Feather
                        name="life-buoy"
                        size={18}
                        color="#E2FF46"
                      />
                    </Box>
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {t('supportRequest.title')}
                    </Text>
                  </>
                )}
              </HStack>
              <Feather
                name="chevron-down"
                size={18}
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                style={{
                  transform: [{ rotate: isExpanded ? '180deg' : '0deg' }]
                }}
              />
            </HStack>

            {isExpanded && (
              <VStack space="sm" mt="$3">
                <Box
                  height={1}
                  bg={isDark ? '#2A2A2A' : '#E5E5E5'}
                />

                <VStack space="xs">
                  <Text
                    fontSize="$xs"
                    fontWeight="$medium"
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  >
                    {t('supportRequest.labels.supportType')}
                  </Text>
                  <Text
                    fontSize="$xs"
                    fontWeight="$semibold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                  >
                    {item.supportRequest.supportType}
                  </Text>
                </VStack>

                <VStack space="xs">
                  <Text
                    fontSize="$xs"
                    fontWeight="$medium"
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  >
                    {t('supportRequest.labels.requestDetails')}
                  </Text>
                  <Text
                    fontSize="$xs"
                    fontWeight="$normal"
                    color={isDark ? '#CCCCCC' : '#666666'}
                    lineHeight={16}
                  >
                    {item.supportRequest.message}
                  </Text>
                </VStack>

                <HStack space="xs" alignItems="center">
                  <Feather
                    name="award"
                    size={14}
                    color="#E2FF46"
                  />
                  <Text
                    fontSize="$xs"
                    fontWeight="$bold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                  >
                    {item.supportRequest.amount} TIPS
                  </Text>
                </HStack>

                <VStack space="xs" mt="$2">
                  <Text
                    fontSize="$xs"
                    fontWeight="$medium"
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  >
                    {t('supportRequest.labels.status')}
                  </Text>
                  <Box
                    bg={
                      requestStatus === 'pending' ? (isDark ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)') :
                      requestStatus === 'accepted' ? (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)') :
                      requestStatus === 'rejected' ? (isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)') :
                      requestStatus === 'canceled' ? (isDark ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)') :
                      (isDark ? '#2A2A2A' : '#E5E5E5')
                    }
                    borderRadius={8}
                    px="$2"
                    py="$1"
                    alignSelf="flex-start"
                  >
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color={
                        requestStatus === 'pending' ? '#FFC107' :
                        requestStatus === 'accepted' ? '#4CAF50' :
                        requestStatus === 'rejected' ? '#F44336' :
                        requestStatus === 'canceled' ? '#9E9E9E' :
                        (isDark ? '#FFFFFF' : '#000000')
                      }
                    >
                      {t(`supportRequest.statusBadges.${requestStatus}` as any, { defaultValue: requestStatus })}
                    </Text>
                  </Box>
                </VStack>

                {requestStatus === 'pending' && (
                  <VStack space="sm" mt="$3">
                    {isSender && (
                      <Button
                        onPress={() => onCancelSupportRequest?.(requestId)}
                        bg={isDark ? '#F44336' : '#F44336'}
                        borderRadius={8}
                        py="$2"
                      >
                        <ButtonText color="#FFFFFF" fontSize="$xs" fontWeight="$semibold">
                          {t('supportRequest.buttons.cancelRequest')}
                        </ButtonText>
                      </Button>
                    )}
                    {isRecipient && (
                      <HStack space="sm">
                        <Button
                          onPress={() => onAcceptSupportRequest?.(requestId)}
                          bg={isDark ? '#4CAF50' : '#4CAF50'}
                          borderRadius={8}
                          py="$2"
                          flex={1}
                        >
                          <ButtonText color="#FFFFFF" fontSize="$xs" fontWeight="$semibold">
                            {t('supportRequest.buttons.accept')}
                          </ButtonText>
                        </Button>
                        <Button
                          onPress={() => onRejectSupportRequest?.(requestId)}
                          bg={isDark ? '#F44336' : '#F44336'}
                          borderRadius={8}
                          py="$2"
                          flex={1}
                        >
                          <ButtonText color="#FFFFFF" fontSize="$xs" fontWeight="$semibold">
                            {t('supportRequest.buttons.reject')}
                          </ButtonText>
                        </Button>
                      </HStack>
                    )}
                  </VStack>
                )}
                
                {requestStatus === 'accepted' && supportThreadId && (
                  <VStack space="sm" mt="$3">
                    <Button
                      onPress={() => onGoToSupportChat?.(supportThreadId, requestId)}
                      bg={isDark ? '#E2FF46' : '#E2FF46'}
                      borderRadius={8}
                      py="$2"
                    >
                      <ButtonText color="#000000" fontSize="$xs" fontWeight="$semibold">
                        {t('supportRequest.buttons.goToSupportChat')}
                      </ButtonText>
                    </Button>
                  </VStack>
                )}
              </VStack>
            )}
          </Box>
        </Pressable>

        {requestStatus === 'pending' && (
          <HStack
            space="xs"
            alignItems="center"
            mt="$2"
          >
            <Text
              fontSize="$xs"
              fontWeight="$normal"
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              flex={1}
            >
              {t('supportRequest.statusMessages.pendingAutoClose')}
            </Text>
            <Feather
              name="info"
              size={14}
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
            />
          </HStack>
        )}
        {requestStatus !== 'pending' && (
          <HStack
            space="xs"
            alignItems="center"
            mt="$2"
          >
            <Feather
              name="info"
              size={12}
              color={isDark ? '#8C8C8C' : '#999999'}
            />
            <Text
              fontSize="$xs"
              fontWeight="$normal"
              color={isDark ? '#8C8C8C' : '#999999'}
              flex={1}
            >
              {requestStatus === 'accepted'
                ? t('supportRequest.statusMessages.acceptedGoToChat')
                : requestStatus === 'rejected'
                ? t('supportRequest.statusMessages.rejected')
                : requestStatus === 'canceled'
                ? t('supportRequest.statusMessages.canceled')
                : t('supportRequest.statusMessages.statusPrefix', { status: requestStatus })
              }
            </Text>
          </HStack>
        )}
      </Box>

      {/* Timestamp + Ticks BELOW */}
      <HStack
        space="xs"
        alignItems="center"
        mt={2}
        alignSelf={isSent ? 'flex-end' : 'flex-start'}
      >
        <Text
          color={isDark ? '#8C8C8C' : '#8C8C8C'}
          fontSize={10}
          fontWeight="$normal"
        >
          {formatMessageTime(item.timestamp)}
        </Text>
        {isSent && (
          <View style={{ width: 16, height: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {item.isRead ? (
              <>
                <Feather
                  name="check"
                  size={12}
                  color="#4CAF50"
                  style={{ position: 'absolute', left: 0, top: 0 }}
                />
                <Feather
                  name="check"
                  size={12}
                  color="#4CAF50"
                  style={{ position: 'absolute', left: 4, top: 0 }}
                />
              </>
            ) : (
              <Feather
                name="check"
                size={11}
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
              />
            )}
          </View>
        )}
      </HStack>
    </VStack>
  );
};
