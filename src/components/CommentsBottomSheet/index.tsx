import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Heart, Send, ChevronDown } from 'lucide-react-native';
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
  const [newComment, setNewComment] = useState('');
  const [comments] = useState<Comment[]>(mockComments);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);

  const snapPoints = useMemo(() => ['50%', '100%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
      setIsFullscreenEditor(false);
    }
  }, [onClose]);

  const handleSendComment = () => {
    if (newComment.trim()) {
      setNewComment('');
      console.log('Yorum gönderildi:', newComment);
      setIsFullscreenEditor(false);
    }
  };

  const handleInputPress = () => {
    setIsFullscreenEditor(true);
  };

  const handleCloseEditor = () => {
    setIsFullscreenEditor(false);
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
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#666666' : '#CCCCCC',
        }}
      >
             <BottomSheetView style={{ flex: 1, paddingHorizontal: 16 }}>
         {/* Header */}
         <View style={{
           flexDirection: 'row',
           justifyContent: 'space-between',
           alignItems: 'center',
           paddingVertical: 16,
           borderBottomWidth: 1,
           borderBottomColor: isDark ? '#333333' : '#E5E5E5'
         }}>
           <Text style={{
             color: isDark ? '#FFFFFF' : '#000000',
             fontWeight: 'bold',
             fontSize: 18
           }}>
             Yorumlar
           </Text>
           <TouchableOpacity onPress={onClose}>
             <ChevronDown size={24} color={isDark ? '#FFFFFF' : '#000000'} />
           </TouchableOpacity>
         </View>

         {/* Content Container */}
         <View style={{ flex: 1, flexDirection: 'column' }}>
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
             borderTopColor: isDark ? '#333333' : '#E5E5E5'
           }}>
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <TouchableOpacity
                 style={{
                   flex: 1,
                   height: 40,
                   borderWidth: 1,
                   borderColor: isDark ? '#444444' : '#CCCCCC',
                   borderRadius: 8,
                   paddingHorizontal: 12,
                   marginRight: 8,
                   backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                   justifyContent: 'center'
                 }}
                 onPress={handleInputPress}
               >
                 <Text style={{
                   color: isDark ? '#666666' : '#999999',
                   fontSize: 14
                 }}>
                   Bir yorum yaz...
                 </Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
             </BottomSheetView>
       </BottomSheet>

       {/* Fullscreen Comment Editor */}
       {isFullscreenEditor && (
         <Portal>
           <View style={{
             position: 'absolute',
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
             zIndex: 1000
           }}>
             {/* Header */}
             <View style={{
               flexDirection: 'row',
               justifyContent: 'space-between',
               alignItems: 'center',
               paddingTop: 50,
               paddingHorizontal: 16,
               paddingBottom: 16,
               borderBottomWidth: 1,
               borderBottomColor: isDark ? '#333333' : '#E5E5E5'
             }}>
               <TouchableOpacity onPress={handleCloseEditor}>
                 <Text style={{
                   color: isDark ? '#007AFF' : '#007AFF',
                   fontSize: 16
                 }}>
                   İptal
                 </Text>
               </TouchableOpacity>
               <Text style={{
                 color: isDark ? '#FFFFFF' : '#000000',
                 fontWeight: 'bold',
                 fontSize: 18
               }}>
                 Yorum Yaz
               </Text>
               <TouchableOpacity 
                 onPress={handleSendComment}
                 disabled={!newComment.trim()}
               >
                 <Text style={{
                   color: newComment.trim() ? (isDark ? '#007AFF' : '#007AFF') : (isDark ? '#666666' : '#999999'),
                   fontSize: 16,
                   fontWeight: 'bold'
                 }}>
                   Gönder
                 </Text>
               </TouchableOpacity>
             </View>

             {/* Text Input */}
             <View style={{ flex: 1, padding: 16 }}>
               <TextInput
                 style={{
                   flex: 1,
                   textAlignVertical: 'top',
                   color: isDark ? '#FFFFFF' : '#000000',
                   fontSize: 16,
                   lineHeight: 24
                 }}
                 placeholder="Yorumunuzu yazın..."
                 placeholderTextColor={isDark ? '#666666' : '#999999'}
                 value={newComment}
                 onChangeText={setNewComment}
                 multiline
                 autoFocus
               />
             </View>
           </View>
         </Portal>
       )}
     </Portal>
   );
 };
