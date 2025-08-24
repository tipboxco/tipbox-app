import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { Text, View, Image, } from '@gluestack-ui/themed';
import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Heart, Send } from 'lucide-react-native';
import { mockComments } from '@/src/mock/common/comments';
import { Portal } from '@gorhom/portal';
import { Comment, CommentsBottomSheetProps } from './types';

export const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  isVisible,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const bottomSheetRef = useRef<BottomSheet>(null);
  const inputRef = useRef<any>(null);

  const [newComment, setNewComment] = useState('');
  const [comments] = useState<Comment[]>(mockComments);

  const snapPoints = useMemo(() => ['100%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    } else if (index >= 0){
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [onClose]);

  const handleSendComment = () => {
    if (newComment.trim()) {
      setNewComment('');
      console.log('Yorum gönderildi:', newComment);
    }
  };

  const handleLikeComment = (commentId: string) => {
    // Basit beğeni işlemi - şimdilik sadece console'a yazdırıyoruz
    console.log('Beğenildi:', commentId);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <View key={comment.id} style={{ marginBottom: 16, marginLeft: isReply ? 32 : 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Image
          source={comment.user.avatar}
          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{
              color: isDark ? '#FFFFFF' : '#000000',
              fontWeight: 'bold',
              fontSize: 14,
              marginRight: 8
            }}>
              {comment.user.name}
            </Text>
            {comment.user.badge && (
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: comment.user.badge.borderColor,
                backgroundColor: comment.user.badge.color,
                marginRight: 8
              }}>
                <Text style={{ fontSize: 10, color: '#FFFFFF' }}>
                  {comment.user.badge.text}
                </Text>
              </View>
            )}
            <Text style={{
              color: isDark ? '#999999' : '#666666',
              fontSize: 12
            }}>
              {comment.timestamp}
            </Text>
          </View>

          <Text style={{
            color: isDark ? '#CCCCCC' : '#333333',
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 8
          }}>
            {comment.content}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => handleLikeComment(comment.id)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Heart size={16} color={isDark ? '#DCDCDC' : '#666666'} />
              <Text style={{
                color: isDark ? '#999999' : '#666666',
                fontSize: 12,
                marginLeft: 4
              }}>
                {comment.likes}
              </Text>
            </TouchableOpacity>
          </View>

          {comment.replies && comment.replies.length > 0 && (
            <View style={{ marginTop: 12 }}>
              {comment.replies.map(reply => renderComment(reply, true))}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (!isVisible) return null;

  return (
    <Portal>
             <BottomSheet
         ref={bottomSheetRef}
         topInset={0}
         index={0}
         snapPoints={snapPoints}
         onChange={handleSheetChanges}
         enablePanDownToClose
         android_keyboardInputMode='adjustResize'
         keyboardBehavior="interactive"
         keyboardBlurBehavior="restore"
         enableOverDrag={true}
         backgroundStyle={{
           backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
         }}
         handleIndicatorStyle={{
           backgroundColor: isDark ? '#666666' : '#CCCCCC',
         }}
       >
         <BottomSheetView style={{ flex: 1, height: "100%", paddingHorizontal: 16 }}>
           {/* Header */}
           <View style={{
             flexDirection: 'row',
             justifyContent: 'center',
             paddingVertical: 16,
             borderBottomWidth: 1,
             borderBottomColor: isDark ? '#333333' : '#E5E5E5'
           }}>
             <Text
               style={{
                 color: isDark ? '#FFFFFF' : '#000000',
                 fontWeight: 'bold',
                 fontSize: 18
               }}>
               Yorumlar
             </Text>
           </View>

           {/* Comments List */}
           <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
             <View style={{ paddingVertical: 16 }}>
               {comments.map(comment => renderComment(comment))}
             </View>
           </ScrollView>

           {/* Comment Input - Fixed at bottom */}
           <View style={{
             paddingVertical: 16,
             borderTopWidth: 1,
             borderTopColor: isDark ? '#333333' : '#E5E5E5',
             backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF'
           }}>
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <BottomSheetTextInput
                 ref={inputRef}
                 style={{
                   flex: 1,
                   height: 40,
                   borderWidth: 1,
                   borderColor: isDark ? '#444444' : '#CCCCCC',
                   borderRadius: 8,
                   paddingHorizontal: 12,
                   marginRight: 8,
                   backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                   color: isDark ? '#FFFFFF' : '#000000',
                   fontSize: 14
                 }}
                 placeholder="Bir yorum yaz..."
                 placeholderTextColor={isDark ? '#666666' : '#999999'}
                 value={newComment}
                 onChangeText={setNewComment}
                 multiline={false}
               />
               <TouchableOpacity
                 onPress={handleSendComment}
                 disabled={!newComment.trim()}
                 style={{
                   width: 36,
                   height: 36,
                   borderRadius: 18,
                   backgroundColor: newComment.trim()
                     ? (isDark ? '#4CAF50' : '#4CAF50')
                     : (isDark ? '#444444' : '#CCCCCC'),
                   justifyContent: 'center',
                   alignItems: 'center'
                 }}
               >
                 <Send
                   size={18}
                   color={newComment.trim() ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                 />
               </TouchableOpacity>
             </View>
           </View>
         </BottomSheetView>
       </BottomSheet>
    </Portal>
  );
};
