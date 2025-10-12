# Socket System Testing Guide

## Quick Start Testing

### 1. Start the Server

```bash
npm start
# or
node src/index.js
```

Watch for these logs:
```
Server is running on port 3000
[SocketManager] User added: user@example.com (userId) with socket socketId
[SocketManager] Stats: { totalUsers: 1, totalRooms: 0, totalSockets: 1 }
```

### 2. Test with Multiple Clients

Open multiple browser tabs or use a tool like [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/)

## Manual Testing Scenarios

### Scenario 1: One-to-One Chat

**Setup:**
- Open 2 browser tabs (User A and User B)
- Both users connect and join the same room

**User A:**
```javascript
const socket = io('http://localhost:3000', {
    auth: { token: 'user-a-token' }
})

socket.emit('joinRoom', { roomId: 'room123' })

socket.on('roomMessageRecieved', (msg) => {
    console.log('Received:', msg)
})

socket.on('roomMessageConfirmed', (msg) => {
    console.log('Confirmed:', msg)
})
```

**User B:**
```javascript
const socket = io('http://localhost:3000', {
    auth: { token: 'user-b-token' }
})

socket.emit('joinRoom', { roomId: 'room123' })

// Send message
socket.emit('roomMessage', {
    roomId: 'room123',
    senderId: 'userB-id',
    body: 'Hello User A!'
})
```

**Expected Results:**
1. User A receives message in < 5ms (check console logs)
2. User B receives confirmation
3. Server logs show:
   ```
   [RoomMessage] Message emitted in 2ms
   [RoomMessage] Message saved to DB in 87ms
   ```

### Scenario 2: Group Chat

**Setup:**
- Open 3+ browser tabs
- All users join the same channel

**User 1:**
```javascript
socket.emit('JOIN_CHANNEL', { channelId: 'channel123' })

socket.emit('NewMessage', {
    channelId: 'channel123',
    workspaceId: 'workspace123',
    senderId: 'user1-id',
    body: 'Hello everyone!'
})
```

**Expected Results:**
1. All other users receive message instantly
2. Message appears in UI before DB save completes
3. All users receive confirmation event

### Scenario 3: Optimistic Updates

**Test optimistic message handling:**

```javascript
let tempMessages = new Map()

socket.on('roomMessageSent', (msg) => {
    console.log('Optimistic message sent:', msg._id)
    tempMessages.set(msg._id, msg)
})

socket.on('roomMessageConfirmed', (msg) => {
    console.log('Replacing temp ID:', msg.tempId, 'with real ID:', msg._id)
    tempMessages.delete(msg.tempId)
    // Update UI with real message
})

socket.on('roomMessageFailed', ({ tempId, error }) => {
    console.error('Message failed:', tempId, error)
    tempMessages.delete(tempId)
    // Remove from UI and show error
})
```

### Scenario 4: Connection/Disconnection

**Test state cleanup:**

```javascript
// Connect
const socket = io('http://localhost:3000', { auth: { token } })
socket.emit('joinRoom', { roomId: 'room123' })

// Disconnect
socket.disconnect()
```

**Check server logs:**
```
[SocketManager] User added: user@example.com
[JoinRoom] User user@example.com joined room room123
User disconnected: socketId
[SocketManager] User removed: user@example.com
[SocketManager] Stats after disconnect: { totalUsers: 0, totalRooms: 0 }
```

### Scenario 5: Multiple Rooms

**Test user in multiple rooms:**

```javascript
socket.emit('joinRoom', { roomId: 'room1' })
socket.emit('joinRoom', { roomId: 'room2' })
socket.emit('JOIN_CHANNEL', { channelId: 'channel1' })

// Send to different rooms
socket.emit('roomMessage', { roomId: 'room1', senderId: 'userId', body: 'To room 1' })
socket.emit('roomMessage', { roomId: 'room2', senderId: 'userId', body: 'To room 2' })
socket.emit('NewMessage', { channelId: 'channel1', senderId: 'userId', body: 'To channel' })
```

**Verify:**
- Messages only go to users in respective rooms
- No cross-contamination between rooms

## Performance Testing

### Test 1: Message Latency

**Measure time from send to receive:**

```javascript
const startTime = Date.now()

socket.emit('roomMessage', {
    roomId: 'room123',
    senderId: 'userId',
    body: 'Test message'
})

socket.on('roomMessageRecieved', (msg) => {
    const latency = Date.now() - startTime
    console.log(`Message received in ${latency}ms`)
    // Should be < 10ms
})
```

### Test 2: Concurrent Users

**Simulate 50 users:**

```javascript
const sockets = []

for (let i = 0; i < 50; i++) {
    const socket = io('http://localhost:3000', {
        auth: { token: `user-${i}-token` }
    })
    
    socket.emit('joinRoom', { roomId: 'stress-test' })
    sockets.push(socket)
}

// Send message from one user
sockets[0].emit('roomMessage', {
    roomId: 'stress-test',
    senderId: 'user-0',
    body: 'Stress test message'
})

// All 49 other users should receive it instantly
```

**Check server logs:**
```
[RoomMessage] Emitting to 50 users in room stress-test
[RoomMessage] Message emitted in 5ms  // Should still be < 10ms
```

### Test 3: Message Throughput

**Send 100 messages rapidly:**

```javascript
for (let i = 0; i < 100; i++) {
    socket.emit('roomMessage', {
        roomId: 'room123',
        senderId: 'userId',
        body: `Message ${i}`
    })
}
```

**Monitor:**
- All messages delivered
- No messages lost
- DB saves complete (check database)

### Test 4: Network Conditions

**Throttle network in Chrome DevTools:**
1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Send messages

**Expected:**
- Optimistic messages still appear instantly in UI
- DB confirmations arrive later
- No UI blocking

## Automated Testing

### Unit Tests (Example with Jest)

```javascript
// tests/socketManager.test.js
import socketManager from '../src/utils/socketManager'

describe('SocketManager', () => {
    beforeEach(() => {
        // Reset state
        socketManager.users.clear()
        socketManager.socketToUser.clear()
        socketManager.rooms.clear()
    })

    test('should add user', () => {
        socketManager.addUser('socket1', { id: 'user1', email: 'test@test.com' })
        expect(socketManager.users.size).toBe(1)
        expect(socketManager.getSocketId('user1')).toBe('socket1')
    })

    test('should join room', () => {
        socketManager.addUser('socket1', { id: 'user1', email: 'test@test.com' })
        socketManager.joinRoom('user1', 'room1')
        
        const users = socketManager.getUsersInRoom('room1')
        expect(users.length).toBe(1)
        expect(users[0].userId).toBe('user1')
    })

    test('should remove user on disconnect', () => {
        socketManager.addUser('socket1', { id: 'user1', email: 'test@test.com' })
        socketManager.joinRoom('user1', 'room1')
        socketManager.removeUser('socket1')
        
        expect(socketManager.users.size).toBe(0)
        expect(socketManager.rooms.size).toBe(0)
    })
})
```

### Integration Tests

```javascript
// tests/socket.integration.test.js
import { io as Client } from 'socket.io-client'
import { createServer } from 'http'
import { Server } from 'socket.io'

describe('Socket Integration', () => {
    let io, serverSocket, clientSocket

    beforeAll((done) => {
        const httpServer = createServer()
        io = new Server(httpServer)
        httpServer.listen(() => {
            const port = httpServer.address().port
            clientSocket = Client(`http://localhost:${port}`)
            io.on('connection', (socket) => {
                serverSocket = socket
            })
            clientSocket.on('connect', done)
        })
    })

    afterAll(() => {
        io.close()
        clientSocket.close()
    })

    test('should receive message instantly', (done) => {
        clientSocket.emit('joinRoom', { roomId: 'test' })
        
        clientSocket.on('roomMessageRecieved', (msg) => {
            expect(msg.body).toBe('Test message')
            expect(msg.isOptimistic).toBe(true)
            done()
        })

        clientSocket.emit('roomMessage', {
            roomId: 'test',
            senderId: 'user1',
            body: 'Test message'
        })
    })
})
```

## Debugging Tools

### 1. SocketManager State Inspector

Add to your code temporarily:

```javascript
// In index.js, add this endpoint
app.get('/debug/sockets', (req, res) => {
    const stats = socketManager.getStats()
    const users = Array.from(socketManager.users.entries()).map(([userId, data]) => ({
        userId,
        email: data.user.email,
        socketId: data.socketId,
        rooms: Array.from(data.rooms)
    }))
    
    const rooms = Array.from(socketManager.rooms.entries()).map(([roomId, userIds]) => ({
        roomId,
        userCount: userIds.size,
        users: Array.from(userIds)
    }))
    
    res.json({ stats, users, rooms })
})
```

Access: `http://localhost:3000/debug/sockets`

### 2. Socket.IO Admin UI

Install and configure:

```bash
npm install @socket.io/admin-ui
```

```javascript
import { instrument } from '@socket.io/admin-ui'

instrument(io, {
    auth: false // Set to true in production
})
```

Access: `https://admin.socket.io`

### 3. Custom Logging

Enable detailed logging:

```javascript
// In index.js
io.on('connection', (socket) => {
    socket.onAny((event, ...args) => {
        console.log(`[Event] ${event}`, args)
    })
})
```

## Common Issues & Solutions

### Issue 1: Messages not delivered

**Debug:**
```javascript
// Check if user is in room
const isInRoom = socketManager.isUserInRoom(userId, roomId)
console.log('User in room?', isInRoom)

// Check room users
const users = socketManager.getUsersInRoom(roomId)
console.log('Users in room:', users)
```

**Solution:**
- Ensure user called `joinRoom` or `JOIN_CHANNEL`
- Check authentication token is valid

### Issue 2: Duplicate messages

**Debug:**
```javascript
// Track message IDs
const seenIds = new Set()

socket.on('roomMessageRecieved', (msg) => {
    if (seenIds.has(msg._id)) {
        console.warn('Duplicate message:', msg._id)
        return
    }
    seenIds.add(msg._id)
})
```

**Solution:**
- Implement message deduplication on client
- Check for multiple socket connections

### Issue 3: Memory leaks

**Debug:**
```javascript
// Monitor stats over time
setInterval(() => {
    console.log('Stats:', socketManager.getStats())
}, 10000)
```

**Solution:**
- Ensure `disconnect` handler is called
- Check for orphaned rooms
- Verify users are removed from SocketManager

### Issue 4: Slow DB saves

**Debug:**
```javascript
// In message handlers, check timing
console.log('[Timing] Emit:', emitTime, 'ms')
console.log('[Timing] DB:', dbTime, 'ms')
```

**Solution:**
- Add database indexes
- Optimize message population queries
- Consider message queue for high load

## Load Testing

### Using Artillery

Create `artillery.yml`:

```yaml
config:
  target: 'http://localhost:3000'
  socketio:
    transports: ['websocket']
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "Send messages"
    engine: socketio
    flow:
      - emit:
          channel: "joinRoom"
          data:
            roomId: "load-test"
      - think: 1
      - emit:
          channel: "roomMessage"
          data:
            roomId: "load-test"
            senderId: "{{ $randomString() }}"
            body: "Load test message"
      - think: 2
```

Run:
```bash
npm install -g artillery
artillery run artillery.yml
```

### Using k6 (WebSocket)

```javascript
import ws from 'k6/ws'
import { check } from 'k6'

export default function () {
    const url = 'ws://localhost:3000/socket.io/?EIO=4&transport=websocket'
    
    ws.connect(url, function (socket) {
        socket.on('open', () => {
            socket.send('42["joinRoom",{"roomId":"k6-test"}]')
            socket.send('42["roomMessage",{"roomId":"k6-test","senderId":"k6","body":"Test"}]')
        })
        
        socket.on('message', (data) => {
            check(data, { 'received message': (d) => d.includes('roomMessageRecieved') })
        })
        
        socket.setTimeout(() => {
            socket.close()
        }, 10000)
    })
}
```

## Monitoring in Production

### Metrics to Track

1. **Message Latency**
   - Time from emit to delivery
   - Target: < 10ms

2. **DB Save Time**
   - Time to save message
   - Target: < 200ms

3. **Connected Users**
   - `socketManager.getStats().totalUsers`

4. **Active Rooms**
   - `socketManager.getStats().totalRooms`

5. **Message Throughput**
   - Messages per second

### Health Check Endpoint

```javascript
app.get('/health/sockets', (req, res) => {
    const stats = socketManager.getStats()
    const healthy = stats.totalUsers === stats.totalSockets
    
    res.status(healthy ? 200 : 500).json({
        healthy,
        stats,
        timestamp: new Date().toISOString()
    })
})
```

## Success Criteria

✅ **Message delivery < 10ms**  
✅ **No message loss**  
✅ **Proper cleanup on disconnect**  
✅ **No memory leaks**  
✅ **Handles 100+ concurrent users**  
✅ **Graceful error handling**  
✅ **Optimistic updates work correctly**  

## Next Steps

After testing:
1. Deploy to staging environment
2. Test with real users
3. Monitor performance metrics
4. Optimize based on data
5. Roll out to production
