# Debug Logs Guide

## Overview

Comprehensive logging has been added to all socket operations to help debug frontend-backend communication issues.

## Log Format

All logs use clear prefixes and emojis for easy identification:

```
========== SECTION NAME ==========
[Component] Action: Details
✅ Success
❌ Error
⚠️  Warning
ℹ️  Info
📤 Sending
📥 Receiving
🟢 Online
🔴 Offline
📊 Statistics
⏭️  Skipped
========== SECTION COMPLETE ==========
```

## Connection Logs

### New Connection
```
========== NEW CONNECTION ==========
[Connection] Socket ID: abc123xyz
[Connection] User: user@example.com ( john )
[Connection] User ID: 507f1f77bcf86cd799439011
[Connection] Transport: websocket
[Connection] ✅ Joined user-specific room: john-507f1f77bcf86cd799439011
[Connection] ✅ Registered in SocketManager
[Connection] Is reconnection? false
[SocketManager] Current stats: { totalUsers: 1, totalRooms: 0, totalSockets: 1 }
```

### Reconnection
```
========== NEW CONNECTION ==========
[Connection] Socket ID: def456uvw
[Connection] User: user@example.com ( john )
[Connection] User ID: 507f1f77bcf86cd799439011
[Connection] Transport: websocket
[Connection] ✅ Joined user-specific room: john-507f1f77bcf86cd799439011
[Connection] ✅ Registered in SocketManager
[Connection] Is reconnection? true
[Connection] Previous socket ID: abc123xyz
[SocketManager] Current stats: { totalUsers: 1, totalRooms: 2, totalSockets: 1 }
[Reconnection] Auto-rejoining 2 rooms for user@example.com
[Reconnection] Rejoined room: room123
[Reconnection] Rejoined room: room456
```

### Disconnection
```
========== DISCONNECTION ==========
[Disconnect] Socket ID: abc123xyz
[Disconnect] User: user@example.com
[Disconnect] Reason: transport close
[Disconnect] Transport: websocket
[Disconnect] ✅ Removed from SocketManager
[SocketManager] Stats after disconnect: { totalUsers: 0, totalRooms: 0, totalSockets: 0 }
========== DISCONNECTION COMPLETE ==========
```

**Disconnect Reasons:**
- `transport close` - Network issue
- `client namespace disconnect` - Client called disconnect()
- `server namespace disconnect` - Server forced disconnect
- `ping timeout` - No pong received

## Room Join Logs

```
========== JOIN ROOM REQUEST ==========
[JoinRoom] Socket ID: abc123xyz
[JoinRoom] User: user@example.com
[JoinRoom] Request data: {
  "roomId": "507f1f77bcf86cd799439011"
}
[JoinRoom] Room ID: 507f1f77bcf86cd799439011
[JoinRoom] User ID: 507f1f77bcf86cd799439012
[JoinRoom] Already in room? false
[JoinRoom] Joining Socket.IO room...
[JoinRoom] ✅ Joined Socket.IO room
[JoinRoom] Registering in SocketManager...
[JoinRoom] ✅ Registered in SocketManager
[JoinRoom] ✅ User user@example.com (507f1f77bcf86cd799439012) joined room 507f1f77bcf86cd799439011
[JoinRoom] 📊 Room 507f1f77bcf86cd799439011 now has 2 connected users
[JoinRoom] Users in room: [ 'user1@example.com', 'user2@example.com' ]
[JoinRoom] ✅ Response sent: {
  "success": true,
  "message": "Successfully joined the room",
  "data": {
    "roomId": "507f1f77bcf86cd799439011",
    "connectedUsers": 2,
    "alreadyJoined": false
  }
}
========== JOIN ROOM COMPLETE ==========
```

## Message Logs

### Complete Message Flow
```
========== NEW ROOM MESSAGE ==========
[RoomMessage] Received from socket: abc123xyz
[RoomMessage] Sender: sender@example.com ( john )
[RoomMessage] Raw data: {
  "roomId": "507f1f77bcf86cd799439011",
  "senderId": "507f1f77bcf86cd799439012",
  "body": "Hello, how are you?",
  "image": null
}
[RoomMessage] Room ID: 507f1f77bcf86cd799439011
[RoomMessage] Sender ID: 507f1f77bcf86cd799439012
[RoomMessage] Fetching room details...
[RoomMessage] ✅ Room details fetched
[RoomMessage] Participants: {
  sender: 'sender@example.com',
  receiver: 'receiver@example.com'
}
[RoomMessage] Checking participant connection status...
[RoomMessage] ⏭️  Skipping sender: sender@example.com
[RoomMessage] Checking receiver@example.com: 🟢 ONLINE
[RoomMessage] Socket ID for receiver@example.com: def456uvw
[RoomMessage] 📤 Emitting to socket def456uvw...
[RoomMessage] ✅ Sent to online user: receiver@example.com
[RoomMessage] 📤 Sending confirmation to sender (abc123xyz)...
[RoomMessage] ✅ Sender confirmation sent
[RoomMessage] ⚡ Message emitted in 12ms
[RoomMessage] 📊 Delivery summary: 1 online, 0 offline
[RoomMessage] 💾 Saving to database...
[RoomMessage] ✅ Message saved to DB in 87ms
[RoomMessage] DB Message ID: 507f1f77bcf86cd799439013
[RoomMessage] ℹ️  No offline users to notify
[RoomMessage] 📞 Sending callback response...
[RoomMessage] ✅ Callback sent: {
  "success": true,
  "message": "Successfully created message in the room",
  "data": { ... },
  "timing": {
    "emitTime": 12,
    "dbTime": 87
  },
  "delivery": {
    "onlineUsers": 1,
    "offlineUsers": 0,
    "notificationsSent": 0
  }
}
========== MESSAGE COMPLETE ==========
```

### Message with Offline User
```
[RoomMessage] Checking receiver@example.com: 🔴 OFFLINE
[RoomMessage] 📧 User offline, will notify: receiver@example.com
[RoomMessage] ⚡ Message emitted in 8ms
[RoomMessage] 📊 Delivery summary: 0 online, 1 offline
[RoomMessage] 💾 Saving to database...
[RoomMessage] ✅ Message saved to DB in 92ms
[RoomMessage] 📧 Sending notifications to 1 offline users
[RoomMessage] Checking notification for receiver@example.com...
[RoomMessage] 📨 Sending notification to receiver@example.com...
[Notification] Sending to offline user: receiver@example.com
[Notification] Email queued for receiver@example.com
[RoomMessage] ✅ Notification sent to receiver@example.com
```

### Message Error
```
[RoomMessage] ❌ Error saving to DB: ValidationError: ...
[RoomMessage] Error stack: ...
[RoomMessage] ❌ Error callback sent: {
  "success": false,
  "message": "Failed to save message",
  "error": "ValidationError: ..."
}
========== MESSAGE FAILED ==========
```

## Debugging Frontend Issues

### Issue: Socket is null

**Check these logs:**
```
1. Connection logs - Is user connecting?
   ========== NEW CONNECTION ==========
   [Connection] Socket ID: ...
   
2. Disconnection logs - Is user disconnecting unexpectedly?
   ========== DISCONNECTION ==========
   [Disconnect] Reason: ...
```

**Common Reasons:**
- `ping timeout` → Network issue or server overloaded
- `transport close` → Network interruption
- `server namespace disconnect` → Server forced disconnect (shouldn't happen now)

### Issue: Message not received

**Check these logs:**
```
1. Message send logs:
   [RoomMessage] Checking receiver@example.com: 🟢 ONLINE or 🔴 OFFLINE
   
2. Socket ID logs:
   [RoomMessage] Socket ID for receiver@example.com: ...
   
3. Emit logs:
   [RoomMessage] 📤 Emitting to socket ...
   [RoomMessage] ✅ Sent to online user: ...
```

**Debug Steps:**
1. Check if receiver is online: Look for 🟢 ONLINE
2. Check if socket ID exists: Should show socket ID
3. Check if emit succeeded: Should show ✅ Sent

### Issue: Room not found

**Check these logs:**
```
[RoomMessage] ❌ Room not found: 507f1f77bcf86cd799439011
```

**Solution:**
- Verify room ID is correct
- Check if room exists in database
- Ensure room was created properly

### Issue: User not in SocketManager

**Check these logs:**
```
[RoomMessage] Checking receiver@example.com: 🔴 OFFLINE
[RoomMessage] ⚠️  No socket ID found for receiver@example.com
```

**Debug:**
1. Check connection logs - Did user connect?
2. Check SocketManager stats: `{ totalUsers: X }`
3. Verify user ID matches

## Log Levels

### Critical (Always Log)
- ❌ Errors
- Connection/Disconnection
- Message send/receive

### Info (Debug Mode)
- ✅ Success confirmations
- 📊 Statistics
- ℹ️  Informational messages

### Verbose (Development Only)
- Raw data dumps
- JSON payloads
- Stack traces

## Monitoring Commands

### View Real-time Logs
```bash
# Follow logs
tail -f logs/app.log

# Filter for specific user
tail -f logs/app.log | grep "user@example.com"

# Filter for errors only
tail -f logs/app.log | grep "❌"

# Filter for room messages
tail -f logs/app.log | grep "\[RoomMessage\]"
```

### Check SocketManager State

Add this endpoint temporarily:
```javascript
app.get('/debug/socket-state', (req, res) => {
    socketManager.printState();
    res.json(socketManager.getStats());
});
```

Access: `http://localhost:3000/debug/socket-state`

## Common Log Patterns

### Successful Message Flow
```
========== NEW ROOM MESSAGE ==========
[RoomMessage] Received from socket: ...
[RoomMessage] Fetching room details...
[RoomMessage] ✅ Room details fetched
[RoomMessage] Checking participant connection status...
[RoomMessage] Checking user: 🟢 ONLINE
[RoomMessage] 📤 Emitting to socket ...
[RoomMessage] ✅ Sent to online user: ...
[RoomMessage] ⚡ Message emitted in 5ms
[RoomMessage] 💾 Saving to database...
[RoomMessage] ✅ Message saved to DB in 85ms
[RoomMessage] ✅ Callback sent
========== MESSAGE COMPLETE ==========
```

### Failed Message Flow
```
========== NEW ROOM MESSAGE ==========
[RoomMessage] Received from socket: ...
[RoomMessage] Fetching room details...
[RoomMessage] ❌ Room not found: ...
========== MESSAGE FAILED ==========
```

### Offline User Flow
```
[RoomMessage] Checking user: 🔴 OFFLINE
[RoomMessage] 📧 User offline, will notify: ...
[RoomMessage] 📧 Sending notifications to 1 offline users
[RoomMessage] 📨 Sending notification to ...
[Notification] Email queued for ...
[RoomMessage] ✅ Notification sent to ...
```

## Troubleshooting Guide

### Problem: No logs appearing

**Solution:**
```bash
# Check if server is running
ps aux | grep node

# Check console output
# Logs should appear in terminal where you ran npm start
```

### Problem: Logs show user offline but they're online

**Check:**
1. Connection logs - Did user connect?
2. SocketManager stats - Is user registered?
3. User ID - Does it match?

**Debug:**
```javascript
// In browser console
socket.id // Should show socket ID
socket.connected // Should be true
```

### Problem: Message sent but not received

**Check logs for:**
1. `📤 Emitting to socket ...` - Was emit called?
2. `✅ Sent to online user` - Was it successful?
3. Check receiver's socket ID matches

**Frontend debug:**
```javascript
// Add listener to check
socket.on('roomMessageRecieved', (msg) => {
    console.log('RECEIVED MESSAGE:', msg)
})
```

## Log Examples by Scenario

### Scenario 1: Both Users Online
```
[RoomMessage] Checking sender@example.com: ⏭️  Skipping sender
[RoomMessage] Checking receiver@example.com: 🟢 ONLINE
[RoomMessage] Socket ID for receiver@example.com: def456
[RoomMessage] 📤 Emitting to socket def456...
[RoomMessage] ✅ Sent to online user: receiver@example.com
[RoomMessage] 📊 Delivery summary: 1 online, 0 offline
```

### Scenario 2: Receiver Offline
```
[RoomMessage] Checking receiver@example.com: 🔴 OFFLINE
[RoomMessage] 📧 User offline, will notify: receiver@example.com
[RoomMessage] 📊 Delivery summary: 0 online, 1 offline
[RoomMessage] 📧 Sending notifications to 1 offline users
[Notification] Email queued for receiver@example.com
```

### Scenario 3: Network Issue
```
========== DISCONNECTION ==========
[Disconnect] Reason: transport close
[Disconnect] Transport: websocket
```

### Scenario 4: Duplicate Join
```
[JoinRoom] Already in room? true
[JoinRoom] ⏭️  User user@example.com already in room, skipping join
```

## Performance Monitoring

### Timing Logs
```
[RoomMessage] ⚡ Message emitted in 5ms
[RoomMessage] ✅ Message saved to DB in 87ms
```

**What to watch:**
- Emit time should be < 10ms
- DB save time should be < 200ms
- If higher, investigate database performance

### Statistics Logs
```
[SocketManager] Current stats: {
  totalUsers: 42,
  totalRooms: 15,
  totalSockets: 42
}
```

**What to watch:**
- totalUsers should equal totalSockets
- If not, there's a state inconsistency

## Quick Debug Checklist

When debugging message issues:

- [ ] Check connection logs - Is user connected?
- [ ] Check socket ID - Does user have valid socket?
- [ ] Check room join - Did user join the room?
- [ ] Check message send logs - Was message received by server?
- [ ] Check participant status - Is receiver online/offline?
- [ ] Check emit logs - Was message emitted?
- [ ] Check callback - Did sender receive confirmation?
- [ ] Check DB logs - Was message saved?
- [ ] Check notification logs - Were offline users notified?

## Frontend Debugging

### Add Logging to Frontend

```javascript
// Log all socket events
socket.onAny((event, ...args) => {
    console.log(`[Socket Event] ${event}`, args)
})

// Log connection status
socket.on('connect', () => {
    console.log('[Frontend] Connected:', socket.id)
})

socket.on('disconnect', (reason) => {
    console.log('[Frontend] Disconnected:', reason)
})

// Log message events
socket.on('roomMessageRecieved', (msg) => {
    console.log('[Frontend] Message received:', msg)
})

socket.on('roomMessageSent', (msg) => {
    console.log('[Frontend] Message sent confirmation:', msg)
})

socket.on('roomMessageConfirmed', (msg) => {
    console.log('[Frontend] Message confirmed:', msg)
})
```

### Check Socket State

```javascript
// In browser console
console.log('Socket ID:', socket.id)
console.log('Connected:', socket.connected)
console.log('Disconnected:', socket.disconnected)
console.log('Transport:', socket.io.engine.transport.name)
```

## Production Logging

### Reduce Log Verbosity

For production, consider:

```javascript
// Add environment check
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
    console.log('[RoomMessage] Raw data:', JSON.stringify(data, null, 2));
}

// Always log errors
console.error('[RoomMessage] ❌ Error:', error);
```

### Use Proper Logger

Consider using Winston or Pino:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Use instead of console.log
logger.info('[RoomMessage] Message received', { roomId, senderId });
logger.error('[RoomMessage] Error', { error: error.message });
```

## Summary

✅ **Comprehensive logging** added to all socket operations  
✅ **Clear visual indicators** with emojis  
✅ **Structured format** with sections  
✅ **Detailed information** for debugging  
✅ **Performance metrics** included  
✅ **Error tracking** with stack traces  

Now you can easily debug any frontend-backend socket communication issues! 🎉
