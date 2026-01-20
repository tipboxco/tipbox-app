/**
 * Message Event Handlers Hook
 * Socket event handler'ları ve mesaj işlemleri için custom hook
 */

import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/src/providers/SocketProvider';
import { useAppStore } from '@/src/store/appStore';
import { inboxKeys } from '../api/hooks';
import { formatMessageTime } from '../utils/messageHelpers';
import type { MessageDetailItem } from '../components/MessageItem/types';

interface UseMessageHandlersProps {
  threadId: string | null;
  isSocketReady: boolean;
  isMountedRef: React.MutableRefObject<boolean>;
  setMessages: React.Dispatch<React.SetStateAction<MessageDetailItem[]>>;
  paramsRef: React.MutableRefObject<{
    senderName: string;
    senderTitle: string;
    senderAvatar: any;
  }>;
}

export const useMessageHandlers = ({
  threadId,
  isSocketReady,
  isMountedRef,
  setMessages,
  paramsRef,
}: UseMessageHandlersProps) => {
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const {
    on,
    off,
    markMessageAsRead: socketMarkMessageAsRead,
    markThreadRead: socketMarkThreadRead,
  } = useSocket();

  // New message handler
  const handleNewMessage = useCallback((eventData: any) => {
    console.log('[MessageDetail] 📨 New message received:', {
      threadId: eventData.threadId,
      currentThreadId: threadId,
      messageId: eventData.messageId,
      messageType: eventData.messageType,
      senderId: eventData.senderId,
    });

    if (!threadId || eventData.threadId !== threadId) {
      return;
    }

    const isSent = eventData.senderId === user?.id;
    const currentParams = paramsRef.current;
    const isImageMessage = eventData.messageType === 'image' || !!eventData.mediaUrl;

    if (eventData.messageType === 'message' || eventData.messageType === 'image') {
      const newMessage: MessageDetailItem = {
        id: eventData.messageId,
        text: eventData.message || eventData.text || eventData.caption || '',
        timestamp: formatMessageTime(eventData.timestamp || eventData.sentAt),
        isSent,
        senderName: isSent ? undefined : (currentParams.senderName || 'Unknown'),
        senderAvatar: isSent ? undefined : currentParams.senderAvatar,
        type: isImageMessage ? 'image' : 'message',
        mediaUrl: isImageMessage ? (eventData.mediaUrl || eventData.imageUrl) : undefined,
        mediaType: isImageMessage ? 'image' : undefined,
        thumbnailUrl: isImageMessage ? eventData.thumbnailUrl : undefined,
        isRead: false,
        status: isSent ? 'sent' : undefined,
        senderId: eventData.senderId,
      };

      if (isMountedRef.current) {
        setMessages((prev) => {
          const existingMessage = prev.find((msg) => msg.id === eventData.messageId);
          if (existingMessage) {
            return prev;
          }

          const optimisticMessageIndex = prev.findIndex(
            (msg) => {
              if (!msg.id.startsWith('pending-')) return false;
              if (msg.isSent !== newMessage.isSent) return false;
              
              if (newMessage.type === 'image' && msg.type === 'image') {
                return msg.mediaUrl === newMessage.mediaUrl || 
                       (msg.uploadStatus === 'uploading' && newMessage.mediaUrl);
              }
              
              return msg.text === newMessage.text;
            }
          );
          
          if (optimisticMessageIndex !== -1) {
            const updated = [...prev];
            updated[optimisticMessageIndex] = newMessage;
            return updated;
          }
          
          return [...prev, newMessage];
        });
      }

      if (!isSent && isSocketReady && threadId && isMountedRef.current) {
        socketMarkMessageAsRead(eventData.messageId);
        
        if (isMountedRef.current) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === eventData.messageId) {
                return {
                  ...msg,
                  isRead: true,
                  readAt: new Date().toISOString(),
                };
              }
              return msg;
            })
          );
        }
      }
    } else if (eventData.messageType === 'send-tips') {
      const tipsAmount = eventData.amount || 0;
      const tipsMessageText = eventData.message || '';
      const currentParams = paramsRef.current;
      
      const newTipsMessage: MessageDetailItem = {
        id: eventData.messageId,
        text: tipsMessageText,
        timestamp: formatMessageTime(eventData.timestamp || eventData.sentAt),
        isSent,
        senderName: isSent ? undefined : (currentParams.senderName || 'Unknown'),
        senderAvatar: isSent ? undefined : currentParams.senderAvatar,
        type: 'tips',
        tipsAmount: tipsAmount,
        isRead: false,
        senderId: eventData.senderId,
      };
      
      if (isMountedRef.current) {
        setMessages((prev) => {
          const existingMessage = prev.find((msg) => msg.id === eventData.messageId);
          if (existingMessage) {
            return prev;
          }
          
          const optimisticMessageIndex = prev.findIndex(
            (msg) => msg.id.startsWith('pending-tips-') && 
                     msg.isSent === isSent &&
                     msg.type === 'tips' &&
                     Math.abs((msg.tipsAmount || 0) - tipsAmount) < 0.01
          );
          
          if (optimisticMessageIndex !== -1) {
            const updated = [...prev];
            updated[optimisticMessageIndex] = newTipsMessage;
            return updated;
          }
          
          return [...prev, newTipsMessage];
        });
      }
      
      if (!isSent && isSocketReady && threadId && isMountedRef.current) {
        socketMarkMessageAsRead(eventData.messageId);
        
        if (isMountedRef.current) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === eventData.messageId) {
                return {
                  ...msg,
                  isRead: true,
                  readAt: new Date().toISOString(),
                };
              }
              return msg;
            })
          );
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    if (threadId) {
      queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(threadId) });
    }
  }, [user?.id, threadId, isSocketReady, isMountedRef, setMessages, paramsRef, queryClient, socketMarkMessageAsRead]);

  // Message sent handler
  const handleMessageSent = useCallback((eventData: any) => {
    console.log('[MessageDetail] ✅ Message sent confirmation:', eventData);
    
    if (eventData.threadId && eventData.threadId !== threadId) {
      return;
    }

    const messageText = eventData.message || eventData.text || '';
    const messageId = eventData.messageId;

    if (!messageId) {
      return;
    }

    if (isMountedRef.current) {
      setMessages((prev) => {
        const alreadyExists = prev.some(msg => msg.id === messageId);
        if (alreadyExists) {
          return prev;
        }

        const optimisticIndex = prev.findIndex(
          (msg) => 
            msg.id.startsWith('pending-') && 
            msg.text === messageText && 
            msg.isSent
        );

        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = {
            ...updated[optimisticIndex],
            id: messageId,
            status: 'sent' as const,
          };
          return updated;
        }

        const messageExists = prev.some(msg => msg.text === messageText && msg.isSent);
        if (!messageExists && messageText) {
          const newMessage: MessageDetailItem = {
            id: messageId,
            text: messageText,
            timestamp: formatMessageTime(eventData.timestamp || new Date()),
            isSent: true,
            isRead: false,
            status: 'sent' as const,
          };
          return [...prev, newMessage];
        }

        return prev;
      });
    }

    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    if (threadId) {
      queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(threadId) });
    }
  }, [threadId, isMountedRef, setMessages, queryClient]);

  // Message deleted handler
  const handleMessageDeleted = useCallback((eventData: any) => {
    console.log('[MessageDetail] 🗑️ Message deleted event:', eventData);
    
    if (eventData.threadId && eventData.threadId !== threadId) {
      return;
    }

    if (isMountedRef.current) {
      setMessages((prev) => prev.filter((msg) => msg.id !== eventData.messageId));
    }

    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    if (threadId) {
      queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(threadId) });
    }
  }, [threadId, isMountedRef, setMessages, queryClient]);

  // Message edited handler
  const handleMessageEdited = useCallback((eventData: any) => {
    console.log('[MessageDetail] ✏️ Message edited event:', eventData);
    
    if (eventData.threadId && eventData.threadId !== threadId) {
      return;
    }

    if (isMountedRef.current) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === eventData.messageId) {
            return {
              ...msg,
              text: eventData.message || eventData.text || msg.text,
              isEdited: true,
              editedAt: eventData.editedAt || new Date().toISOString(),
            };
          }
          return msg;
        })
      );
    }

    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    if (threadId) {
      queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(threadId) });
    }
  }, [threadId, isMountedRef, setMessages, queryClient]);

  // Message delivered handler
  const handleMessageDelivered = useCallback((eventData: any) => {
    console.log('[MessageDetail] 📬 Message delivered event:', eventData);
    
    if (eventData.threadId && eventData.threadId !== threadId) {
      return;
    }

    if (isMountedRef.current) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === eventData.messageId) {
            return {
              ...msg,
              status: 'delivered' as const,
              deliveredAt: eventData.deliveredAt || new Date().toISOString(),
            };
          }
          return msg;
        })
      );
    }
  }, [threadId, isMountedRef, setMessages]);

  // Message reaction handler
  const handleMessageReaction = useCallback((eventData: any) => {
    console.log('[MessageDetail] 😀 Message reaction event:', eventData);
    
    if (eventData.threadId && eventData.threadId !== threadId) {
      return;
    }

    if (isMountedRef.current) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === eventData.messageId) {
            const existingReactions = msg.reactions || [];
            const reactionIndex = existingReactions.findIndex(r => r.emoji === eventData.emoji);
            
            let updatedReactions: typeof existingReactions;
            if (reactionIndex !== -1) {
              // Reaction already exists, update count
              updatedReactions = [...existingReactions];
              updatedReactions[reactionIndex] = {
                ...updatedReactions[reactionIndex],
                count: eventData.count || updatedReactions[reactionIndex].count + 1,
                users: eventData.users || [...updatedReactions[reactionIndex].users, eventData.userId],
              };
            } else {
              // New reaction
              updatedReactions = [
                ...existingReactions,
                {
                  emoji: eventData.emoji,
                  count: eventData.count || 1,
                  users: eventData.users || [eventData.userId],
                },
              ];
            }
            
            return {
              ...msg,
              reactions: updatedReactions,
            };
          }
          return msg;
        })
      );
    }

    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    if (threadId) {
      queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(threadId) });
    }
  }, [threadId, isMountedRef, setMessages, queryClient]);

  // Typing indicator handler
  const handleUserTyping = useCallback((data: { userId: string; threadId: string; isTyping: boolean }) => {
    if (!isMountedRef.current || data.threadId !== threadId || data.userId === user?.id) {
      return;
    }
    
    // This will be handled by parent component's typing state
    return data;
  }, [threadId, user?.id, isMountedRef]);

  // Message read handler
  const handleMessageRead = useCallback((data: { messageId: string; threadId: string; readBy: string; timestamp: string }) => {
    if (!isMountedRef.current || data.threadId !== threadId) {
      return;
    }
    
    if (isMountedRef.current) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              isRead: true,
              readAt: data.timestamp,
              status: 'read' as const,
            };
          }
          return msg;
        })
      );
    }
  }, [threadId, isMountedRef, setMessages]);

  // Thread read handler
  // ✅ Backend iyileştirmesi: thread_read event'ine unreadCount ve isUnread eklendi
  const handleThreadRead = useCallback((data: { 
    threadId: string; 
    readBy: string; 
    timestamp: string;
    unreadCount?: number;  // YENİ - Backend'den gelen unreadCount
    isUnread?: boolean;    // YENİ - Backend'den gelen isUnread
  }) => {
    if (!isMountedRef.current || data.threadId !== threadId) {
      return;
    }
    
    // ✅ Backend'den gelen unreadCount ve isUnread değerlerini kullanarak cache'i güncelle
    const unreadCount = data.unreadCount !== undefined ? data.unreadCount : 0;
    const isUnread = data.isUnread !== undefined ? data.isUnread : false;
    
    const queryKey = [...inboxKeys.messages(), undefined];
    queryClient.setQueryData(queryKey, (oldData: any[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map((msg: any) => 
        msg.id === data.threadId 
          ? { ...msg, isUnread, unreadCount }
          : msg
      );
    });
    
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    
    if (isMountedRef.current) {
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          isRead: true,
        }))
      );
    }
  }, [threadId, isMountedRef, setMessages, queryClient]);

  // Thread joined handler
  const handleThreadJoined = useCallback((data: { threadId: string }) => {
    // ✅ Backend iyileştirmesi: GET /inbox/:threadId çağrıldığında backend otomatik olarak
    // tüm okunmamış mesajları isRead: true yapıyor ve thread_read socket event'i gönderiyor.
    // Bu yüzden frontend'de manuel olarak markThreadRead çağırmaya gerek yok.
    // thread_read event'i geldiğinde inbox listesi otomatik güncellenecek.
    if (data.threadId === threadId && isSocketReady) {
      console.log('[useMessageHandlers] ✅ Thread joined. Backend automatically marks messages as read when GET /inbox/:threadId is called.');
    }
  }, [threadId, isSocketReady]);

  // Support request handlers
  const handleSupportRequestAccepted = useCallback((data: { requestId: string; threadId: string }) => {
    if (isMountedRef.current) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.type === 'support_request' && msg.supportRequest?.requestId === data.requestId) {
            return {
              ...msg,
              supportRequest: {
                ...msg.supportRequest,
                status: 'accepted',
                threadId: data.threadId,
              },
            };
          }
          return msg;
        })
      );
    }
    
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
  }, [isMountedRef, setMessages, queryClient]);

  const handleSupportRequestRejected = useCallback((data: { requestId: string }) => {
    if (isMountedRef.current) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.type === 'support_request' && msg.supportRequest?.requestId === data.requestId) {
            return {
              ...msg,
              supportRequest: {
                ...msg.supportRequest,
                status: 'rejected',
              },
            };
          }
          return msg;
        })
      );
    }
    
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
  }, [isMountedRef, setMessages, queryClient]);

  const handleSupportRequestCancelled = useCallback((data: { requestId: string }) => {
    if (isMountedRef.current) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.type === 'support_request' && msg.supportRequest?.requestId === data.requestId) {
            return {
              ...msg,
              supportRequest: {
                ...msg.supportRequest,
                status: 'canceled',
              },
            };
          }
          return msg;
        })
      );
    }
    
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
  }, [isMountedRef, setMessages, queryClient]);

  return {
    handleNewMessage,
    handleMessageSent,
    handleMessageDeleted,
    handleMessageEdited,
    handleMessageDelivered,
    handleMessageReaction,
    handleUserTyping,
    handleMessageRead,
    handleThreadRead,
    handleThreadJoined,
    handleSupportRequestAccepted,
    handleSupportRequestRejected,
    handleSupportRequestCancelled,
  };
};
