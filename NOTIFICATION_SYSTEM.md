# Notification System Documentation

## Overview

The notification system ensures that users receive messages even when they're not actively connected to the socket or haven't joined specific rooms. This mimics the behavior of popular messaging applications like WhatsApp, Telegram, and Slack.

## Problem Solved

### Before ❌
- Messages only sent to users who joined the room
- If remote user not in room, they wouldn't receive the message
- No notifications for offline users
- Messages lost if user wasn't actively in the chat

### After ✅
- Messages sent to ALL room participants regardless of room join status
- Online users receive messages instantly via socket
- Offline users receive email notifications
- No messages lost, everyone stays informed

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Sends Message                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Get Room Details & Identify Participants           │
│          (senderId + receiverId from Room schema)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Check Each Participant's Connection Status          │
│         (socketManager.isUserConnected)                     │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
        ONLINE│                      │OFFLINE
             ▼                       ▼
┌─────────────────────────┐  ┌──────────────────────────────┐
│  Send via Socket        │  │  Queue Notification          │
│  • Instant delivery     │  │  • Email notification        │
│  • Real-time update     │  │  • Push notification (TODO)  │
│  • No room join needed  │  │  • SMS (TODO)                │
└─────────────────────────┘  └──────────────────────────────┘
             │                       │
             └───────────┬───────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Save Message to Database                       │
│              Send Confirmation to Online Users              │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Notification Service (`src/service/notificationService.js`)

**Purpose:** Handle all notification logic for offline users

**Key Functions:**

```javascript
// Send notification to single offline user
sendOfflineNotification(recipient, sender, message, type)

// Send notifications to multiple offline users
sendBulkOfflineNotifications(recipients, sender, message, type)

// Check if user should receive notification
shouldNotifyUser(userId, senderId)
```

**Features:**
- Email notifications via mail queue
- Extensible for push notifications
- Error handling and logging
- Message preview truncation

### 2. Updated Message Controller (`src/controller/message2SocketController.js`)

**Changes:**

1. **Fetch Room Details**
   ```javascript
   const roomDetails = await roomRepository.getRoomDetails(roomId);
   const participants = [roomDetails.senderId, roomDetails.recieverId];
   ```

2. **Check Connection Status**
   ```javascript
   const isConnected = socketManager.isUserConnected(participantId);
   ```

3. **Send to Online Users**
   ```javascript
   if (isConnected) {
       const socketId = socketManager.getSocketId(participantId);
       io.to(socketId).emit('roomMessageRecieved', optimisticMessage);
   }
   ```

4. **Notify Offline Users**
   ```javascript
   if (!isConnected) {
       await sendOfflineNotification(participant, sender, message, 'room');
   }
   ```

### 3. Email Notification Template (`src/utils/mailTemplate/notificationTemplate.html`)

**Features:**
- Beautiful black & white design
- Message preview
- Sender information
- Timestamp
- Call-to-action button
- Responsive design

### 4. Mail Object Generator (`src/utils/common/mailObject.js`)

**New Function:**
```javascript
generatedNotificationMail(notificationData)
```

**Parameters:**
- `recipientEmail` - Recipient's email
- `recipientName` - Recipient's name
- `senderName` - Sender's name
- `senderEmail` - Sender's email
- `messagePreview` - Truncated message content
- `messageType` - 'room' or 'channel'
- `timestamp` - Message timestamp
- `hasImage` - Boolean for image attachment

## Message Flow

### One-to-One Chat (Room Message)

```javascript
// 1. User sends message
socket.emit('roomMessage', {
    roomId: 'abc123',
    senderId: 'user1',
    body: 'Hello!'
})

// 2. Server identifies participants
const participants = [senderId, receiverId] // from Room schema

// 3. Check each participant
participants.forEach(participant => {
    if (participant === sender) return; // Skip sender
    
    if (socketManager.isUserConnected(participant)) {
        // ONLINE: Send via socket
        io.to(socketId).emit('roomMessageRecieved', message)
    } else {
        // OFFLINE: Send notification
        sendOfflineNotification(participant, sender, message)
    }
})

// 4. Save to database
await createMessageService(messageData)

// 5. Confirm to online users
onlineUsers.forEach(user => {
    io.to(socketId).emit('roomMessageConfirmed', confirmedMessage)
})
```

### Group/Channel Chat

Similar flow but with multiple participants from channel members.

## Notification Types

### 1. Email Notification

**Trigger:** User offline (not connected to socket)

**Content:**
- Sender name and email
- Message preview (first 100 characters)
- Message type (room/channel)
- Timestamp
- Link to open app

**Delivery:** Via Bull queue (async, non-blocking)

### 2. Push Notification (TODO)

**Trigger:** User offline or app in background

**Services to integrate:**
- Firebase Cloud Messaging (FCM)
- Apple Push Notification Service (APNS)
- OneSignal
- Pusher

**Implementation:**
```javascript
// In notificationService.js
export const sendPushNotification = async (recipient, sender, message) => {
    // TODO: Implement FCM/APNS
    const notification = {
        title: `New message from ${sender.username}`,
        body: message.body,
        data: {
            roomId: message.roomId,
            senderId: sender._id
        }
    };
    
    await fcm.send(recipient.deviceToken, notification);
};
```

### 3. SMS Notification (TODO)

**Trigger:** Critical messages or user preference

**Services:**
- Twilio
- AWS SNS
- Vonage

## Configuration

### Enable/Disable Notifications

Add to user preferences schema:

```javascript
{
    notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        doNotDisturb: { type: Boolean, default: false },
        mutedConversations: [{ type: ObjectId, ref: 'Room' }]
    }
}
```

### Notification Preferences

```javascript
// Check user preferences before sending
export const shouldNotifyUser = async (userId, senderId) => {
    const user = await userRepository.getUserById(userId);
    
    // Don't notify sender
    if (userId === senderId) return false;
    
    // Check DND
    if (user.notifications?.doNotDisturb) return false;
    
    // Check if conversation muted
    if (user.notifications?.mutedConversations?.includes(roomId)) {
        return false;
    }
    
    return true;
};
```

## Logs & Monitoring

### Success Logs

```
[RoomMessage] Sent to online user: user@example.com
[RoomMessage] User offline, will notify: offline@example.com
[RoomMessage] Sending notifications to 2 offline users
[Notification] Sending to offline user: offline@example.com
[Notification] Email queued for offline@example.com
```

### Error Logs

```
[RoomMessage] Error fetching room details: ...
[RoomMessage] Notification failed for user@example.com: ...
[Notification] Error sending notification: ...
```

### Metrics to Track

1. **Delivery Rate**
   - Online delivery: Should be ~100%
   - Notification delivery: Track email/push success rate

2. **Latency**
   - Online message delivery: < 5ms
   - Notification queue time: < 1s

3. **Notification Stats**
   - Total notifications sent
   - Email open rate
   - Push notification click rate

## Testing

### Test Online User

```javascript
// User 1 sends message
socket1.emit('roomMessage', {
    roomId: 'room123',
    senderId: 'user1',
    body: 'Hello User 2!'
})

// User 2 receives instantly (if online)
socket2.on('roomMessageRecieved', (message) => {
    console.log('Received:', message.body)
    // Output: "Hello User 2!"
})
```

### Test Offline User

```javascript
// User 1 sends message
socket1.emit('roomMessage', {
    roomId: 'room123',
    senderId: 'user1',
    body: 'Hello User 2!'
})

// User 2 is offline
// Check email inbox for notification
// Email subject: "New message from User 1 on MessageSlake"
```

### Test Mixed Scenario

```javascript
// 3 participants: User1 (sender), User2 (online), User3 (offline)
socket1.emit('roomMessage', {
    roomId: 'room123',
    senderId: 'user1',
    body: 'Hello everyone!'
})

// Expected:
// - User2 receives via socket instantly
// - User3 receives email notification
// - Both get message when they check the app
```

## API Response

### Successful Message Send

```json
{
    "success": true,
    "message": "Successfully created message in the room",
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "body": "Hello!",
        "senderId": { ... },
        "roomId": "507f1f77bcf86cd799439012",
        "createdAt": "2025-10-09T04:43:54.000Z"
    },
    "timing": {
        "emitTime": 3,
        "dbTime": 87
    },
    "delivery": {
        "onlineUsers": 1,
        "offlineUsers": 1,
        "notificationsSent": 1
    }
}
```

## Best Practices

### 1. Don't Block Message Sending

```javascript
// ❌ Wrong - blocks message sending
await sendOfflineNotification(user, sender, message);

// ✅ Correct - async, non-blocking
sendOfflineNotification(user, sender, message).catch(console.error);
```

### 2. Handle Notification Failures Gracefully

```javascript
try {
    await sendOfflineNotification(user, sender, message);
} catch (error) {
    console.error('Notification failed, but message still saved');
    // Don't fail the message send if notification fails
}
```

### 3. Respect User Preferences

```javascript
if (shouldNotifyUser(userId, senderId)) {
    await sendOfflineNotification(user, sender, message);
}
```

### 4. Truncate Long Messages

```javascript
const preview = message.body.length > 100 
    ? message.body.substring(0, 100) + '...'
    : message.body;
```

## Future Enhancements

### 1. Rich Notifications

- Show sender avatar
- Display message images
- Action buttons (Reply, Mark as Read)

### 2. Notification Batching

- Group multiple messages from same sender
- "You have 5 new messages from John"

### 3. Smart Notifications

- Only notify for @mentions in groups
- Quiet hours (no notifications 10pm-8am)
- Priority messages

### 4. Multi-Channel Delivery

- Email + Push simultaneously
- Fallback: Push → Email → SMS

### 5. Read Receipts

- Mark notification as read when user opens app
- Sync read status across devices

## Troubleshooting

### Issue: User not receiving notifications

**Check:**
1. Is user actually offline? `socketManager.isUserConnected(userId)`
2. Check email queue: `/ui` (Bull Board)
3. Verify email configuration in `mailConfig.js`
4. Check user's email in database

### Issue: Duplicate notifications

**Solution:**
- Ensure `shouldNotifyUser` checks are working
- Verify user not counted as both online and offline

### Issue: Notifications delayed

**Check:**
1. Bull queue processing rate
2. Email service rate limits
3. Redis connection

## Summary

✅ **Messages sent to all participants** - Not just room members  
✅ **Online users** - Instant delivery via socket  
✅ **Offline users** - Email notifications  
✅ **No messages lost** - Everyone gets notified  
✅ **Non-blocking** - Notifications don't slow down messaging  
✅ **Extensible** - Easy to add push notifications  
✅ **Production-ready** - Error handling and logging  

The system now works like professional messaging apps! 🎉
