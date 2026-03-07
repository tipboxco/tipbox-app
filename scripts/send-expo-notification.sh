#!/bin/bash

# Expo Push Notification Sender
# Usage: ./send-expo-notification.sh <notification-type>

EXPO_TOKEN="ExponentPushToken[OboI4sN0R5bY2E8tuvjt3b]"

NOTIFICATION_TYPE=${1:-POST_LIKED}

case $NOTIFICATION_TYPE in
  POST_LIKED)
    DATA='{
      "to": "'$EXPO_TOKEN'",
      "sound": "default",
      "title": "New Like",
      "body": "johndoe liked your post!",
      "badge": 1,
      "data": {
        "type": "POST_LIKED",
        "userId": "user123",
        "username": "johndoe",
        "avatar": "https://i.pravatar.cc/150?img=1",
        "postId": "post123",
        "data": {
          "postContent": "Amazing product review!"
        },
        "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "read": false
      }
    }'
    ;;
  TIPS_RECEIVED)
    DATA='{
      "to": "'$EXPO_TOKEN'",
      "sound": "default",
      "title": "TIPS Received",
      "body": "alice sent you 100 TIPS!",
      "badge": 1,
      "data": {
        "type": "TIPS_RECEIVED",
        "userId": "user456",
        "username": "alice",
        "avatar": "https://i.pravatar.cc/150?img=2",
        "data": {
          "amount": 100,
          "senderUsername": "alice"
        },
        "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "read": false
      }
    }'
    ;;
  DM_REQUEST)
    DATA='{
      "to": "'$EXPO_TOKEN'",
      "sound": "default",
      "title": "Message Request",
      "body": "bob wants to connect with you",
      "badge": 1,
      "data": {
        "type": "DM_REQUEST_RECEIVED",
        "userId": "user789",
        "username": "bob",
        "avatar": "https://i.pravatar.cc/150?img=3",
        "threadId": "thread456",
        "data": {
          "message": "Hey, I saw your post!"
        },
        "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "read": false
      }
    }'
    ;;
  *)
    echo "Unknown notification type: $NOTIFICATION_TYPE"
    echo "Available types: POST_LIKED, TIPS_RECEIVED, DM_REQUEST"
    exit 1
    ;;
esac

echo "📤 Sending $NOTIFICATION_TYPE notification..."
curl -s -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d "$DATA" | jq '.'

echo "✅ Done!"
