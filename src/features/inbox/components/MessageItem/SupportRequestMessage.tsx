import React from 'react';
import { Box, VStack, HStack, Text, Button, ButtonText, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
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
      px="$4"
      py="$2"
    >
      <Box minWidth={250}>
        <Pressable onPress={() => onToggleSupportRequest?.(item.id)}>
          <Box
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            borderRadius={16}
            borderWidth={1}
            borderColor={isDark ? '#2A2A2A' : '#E5E5E5'}
            py="$1"
            px="$2"
          >
            <HStack space="sm" alignItems="center" justifyContent="space-between">
              <HStack space="sm" alignItems="center" flex={1}>
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
                  Support Request Created
                </Text>
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
                    Support Type
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
                    Request Details
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
                    Status
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
                      textTransform="capitalize"
                    >
                      {requestStatus}
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
                          Cancel Request
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
                            Accept
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
                            Reject
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
                        Go to Support Chat
                      </ButtonText>
                    </Button>
                  </VStack>
                )}
              </VStack>
            )}
          </Box>
        </Pressable>

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
            {requestStatus === 'pending' 
              ? 'Support request will close automatically in 24 hours if unanswered.'
              : requestStatus === 'accepted'
              ? 'Support request has been accepted. Click "Go to Support Chat" to start the conversation.'
              : requestStatus === 'rejected'
              ? 'This support request has been rejected.'
              : requestStatus === 'canceled'
              ? 'This support request has been canceled.'
              : 'Support request status: ' + requestStatus
            }
          </Text>
        </HStack>
      </Box>
    </VStack>
  );
};
