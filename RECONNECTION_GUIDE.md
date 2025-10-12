# Socket Reconnection & Connection Management Guide

## Overview

The socket system now handles reconnections intelligently to prevent duplicate connections and maintain consistent state across network interruptions.

## Key Features

### 1. **Automatic Duplicate Connection Prevention**
- Detects when a user tries to connect with multiple sockets
- Automatically disconnects old socket when new connection is established
- Preserves room memberships across reconnections

### 2. **State Preservation**
- Room memberships are preserved during reconnection
- User automatically rejoins all previous rooms
- No need for client to manually rejoin rooms

### 3. **Duplicate Join Prevention**
- Checks if user is already in a room before joining
- Returns success response without duplicate join
- Prevents state inconsistencies

## How It Works

### Connection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Connects                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Check: Is user already connected?                          │
│  socketManager.getExistingConnection(userId)                │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
        YES  │                       │  NO
             ▼                       ▼
┌─────────────────────────┐  ┌──────────────────────────────┐
│  RECONNECTION           │  │  NEW CONNECTION              │
│  • Disconnect old socket│  │  • Register new user         │
│  • Update socket ID     │  │  • Initialize empty rooms    │
│  • Preserve rooms       │  │  • Set up handlers           │
│  • Auto-rejoin rooms    │  │                              │
│  • Emit 'reconnected'   │  │                              │
└─────────────────────────┘  └──────────────────────────────┘
```

### Reconnection Process

1. **User connects** (network restored, page refresh, etc.)
2. **Server checks** if user already has an active connection
3. **If existing connection found:**
   - Disconnect old socket
   - Update SocketManager with new socket ID
   - Preserve all room memberships
   - Auto-rejoin all Socket.IO rooms
   - Emit `reconnected` event to client
4. **If new connection:**
   - Register user normally
   - Initialize empty room list

### Room Join Flow

```
┌─────────────────────────────────────────────────────────────┐
│                User Joins Room/Channel                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Check: Is user already in this room?                       │
│  socketManager.isUserInRoom(userId, roomId)                 │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
        YES  │                       │  NO
             ▼                       ▼
┌─────────────────────────┐  ┌──────────────────────────────┐
│  ALREADY IN ROOM        │  │  JOIN ROOM                   │
│  • Skip join            │  │  • socket.join(roomId)       │
│  • Return success       │  │  • socketManager.joinRoom()  │
│  • alreadyJoined: true  │  │  • alreadyJoined: false      │
└─────────────────────────┘  └──────────────────────────────┘
```

## Server Implementation

### Connection Handler (index.js)

```javascript
io.on('connection', (socket) => {
    const user = socket?.user;
    const userId = user?.id;

    // Check if user is already connected
    const existingConnection = socketManager.getExistingConnection(userId);
    
    if (existingConnection && existingConnection.socketId !== socket.id) {
        // User is reconnecting - disconnect old socket
        const oldSocket = io.sockets.sockets.get(existingConnection.socketId);
        if (oldSocket) {
            oldSocket.disconnect(true);
        }
    }

    // Register user (handles both new and reconnection)
    const connectionInfo = socketManager.addUser(socket.id, user);

    // If reconnection, auto-rejoin all rooms
    if (connectionInfo.isReconnection && connectionInfo.rooms.length > 0) {
        connectionInfo.rooms.forEach(roomId => {
            socket.join(roomId);
        });
        
        // Notify client about reconnection
        socket.emit('reconnected', {
            message: 'Successfully reconnected',
            rooms: connectionInfo.rooms,
            previousSocketId: connectionInfo.previousSocketId
        });
    }
});
```

### SocketManager Methods

```javascript
// Check if user is connected
socketManager.isUserConnected(userId)
// Returns: true/false

// Get existing connection
socketManager.getExistingConnection(userId)
// Returns: { socketId, user, rooms } or null

// Add user (handles reconnection)
socketManager.addUser(socketId, user)
// Returns: { isReconnection, previousSocketId, rooms }

// Check if user in room
socketManager.isUserInRoom(userId, roomId)
// Returns: true/false
```

## Client Implementation

### Handling Reconnection

```javascript
const socket = io('http://localhost:3000', {
    auth: { token: yourToken }
})

// Listen for reconnection event
socket.on('reconnected', ({ rooms, previousSocketId }) => {
    console.log('Reconnected! Auto-rejoined rooms:', rooms)
    
    // Update UI to show reconnection
    showNotification('Reconnected successfully')
    
    // Rooms are already rejoined on server
    // No need to manually rejoin
    
    // Optional: Refresh message history for each room
    rooms.forEach(roomId => {
        loadRecentMessages(roomId)
    })
})

// Handle connection
socket.on('connect', () => {
    console.log('Connected with socket ID:', socket.id)
})

// Handle disconnection
socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason)
    showNotification('Connection lost. Reconnecting...')
})
```

### React Example

```jsx
import { useEffect, useState } from 'react'
import io from 'socket.io-client'

function ChatApp() {
    const [socket, setSocket] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isReconnecting, setIsReconnecting] = useState(false)
    const [autoRejoinedRooms, setAutoRejoinedRooms] = useState([])

    useEffect(() => {
        const newSocket = io('http://localhost:3000', {
            auth: { token: localStorage.getItem('token') }
        })

        newSocket.on('connect', () => {
            console.log('Connected')
            setIsConnected(true)
            setIsReconnecting(false)
        })

        newSocket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason)
            setIsConnected(false)
            
            if (reason === 'io server disconnect') {
                // Server disconnected us (probably due to reconnection)
                console.log('Server initiated disconnect')
            } else {
                // Network issue
                setIsReconnecting(true)
            }
        })

        newSocket.on('reconnected', ({ rooms, previousSocketId }) => {
            console.log('Reconnected! Previous socket:', previousSocketId)
            console.log('Auto-rejoined rooms:', rooms)
            
            setAutoRejoinedRooms(rooms)
            setIsReconnecting(false)
            
            // Show success notification
            showNotification('Reconnected successfully')
            
            // Optional: Refresh data for rejoined rooms
            rooms.forEach(roomId => {
                fetchLatestMessages(roomId)
            })
        })

        setSocket(newSocket)

        return () => newSocket.close()
    }, [])

    return (
        <div>
            {isReconnecting && (
                <div className="reconnecting-banner">
                    Reconnecting...
                </div>
            )}
            {isConnected && (
                <div className="connected-indicator">
                    Connected ✓
                </div>
            )}
            {/* Your chat UI */}
        </div>
    )
}
```

### Handling Room Joins

```javascript
function joinRoom(roomId) {
    socket.emit('joinRoom', { roomId }, (response) => {
        if (response.success) {
            if (response.data.alreadyJoined) {
                console.log('Already in room, skipping join')
            } else {
                console.log('Joined room successfully')
            }
            
            console.log(`Room has ${response.data.connectedUsers} users`)
        }
    })
}

// Safe to call multiple times - server handles duplicates
joinRoom('room123')
joinRoom('room123') // Won't create duplicate join
```

## Scenarios & Solutions

### Scenario 1: User Refreshes Page

**What Happens:**
1. Old socket disconnects
2. New socket connects
3. Server detects reconnection
4. Old socket is force-disconnected
5. User auto-rejoins all previous rooms
6. Client receives `reconnected` event

**Client Action:**
- Listen for `reconnected` event
- Optionally refresh message history
- Update UI to show reconnection success

### Scenario 2: Network Interruption

**What Happens:**
1. Socket disconnects due to network
2. Socket.IO attempts automatic reconnection
3. When network restored, socket reconnects
4. Server detects reconnection
5. User auto-rejoins all rooms
6. Client receives `reconnected` event

**Client Action:**
- Show "reconnecting" indicator during disconnect
- Listen for `reconnected` event
- Refresh data if needed
- Hide reconnecting indicator

### Scenario 3: User Opens Multiple Tabs

**What Happens:**
1. Tab 1 connects (socket A)
2. Tab 2 connects (socket B)
3. Server detects duplicate connection
4. Socket A is force-disconnected
5. Only socket B remains active
6. Tab 1 shows disconnected
7. Tab 2 receives `reconnected` event

**Client Action:**
- Each tab maintains its own socket
- Show connection status in each tab
- Only active tab receives messages

### Scenario 4: User Joins Same Room Twice

**What Happens:**
1. User calls `joinRoom('room123')`
2. Server adds user to room
3. User calls `joinRoom('room123')` again
4. Server detects duplicate join
5. Returns success with `alreadyJoined: true`
6. No duplicate state created

**Client Action:**
- Safe to call join multiple times
- Check `alreadyJoined` flag if needed
- No error handling required

## Best Practices

### 1. Always Handle Reconnection Event

```javascript
socket.on('reconnected', ({ rooms }) => {
    // Refresh data for rejoined rooms
    rooms.forEach(roomId => {
        loadRecentMessages(roomId)
    })
})
```

### 2. Show Connection Status

```javascript
const [connectionStatus, setConnectionStatus] = useState('connecting')

socket.on('connect', () => setConnectionStatus('connected'))
socket.on('disconnect', () => setConnectionStatus('disconnected'))
socket.on('reconnected', () => setConnectionStatus('reconnected'))

// UI
{connectionStatus === 'disconnected' && <Banner>Reconnecting...</Banner>}
{connectionStatus === 'reconnected' && <Banner>Reconnected ✓</Banner>}
```

### 3. Don't Manually Rejoin Rooms After Reconnection

```javascript
// ❌ Wrong - rooms are auto-rejoined
socket.on('reconnected', ({ rooms }) => {
    rooms.forEach(roomId => {
        socket.emit('joinRoom', { roomId }) // Unnecessary!
    })
})

// ✅ Correct - just refresh data
socket.on('reconnected', ({ rooms }) => {
    rooms.forEach(roomId => {
        loadRecentMessages(roomId) // Just refresh data
    })
})
```

### 4. Handle Disconnect Gracefully

```javascript
socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
        // Server disconnected us (reconnection happening)
        console.log('Reconnecting from another tab/device')
    } else if (reason === 'transport close') {
        // Network issue
        showReconnectingIndicator()
    }
})
```

### 5. Queue Messages During Disconnect

```javascript
const messageQueue = []

function sendMessage(data) {
    if (!socket.connected) {
        messageQueue.push(data)
        showOfflineNotification()
        return
    }
    
    socket.emit('roomMessage', data)
}

socket.on('reconnected', () => {
    // Send queued messages
    while (messageQueue.length > 0) {
        const data = messageQueue.shift()
        socket.emit('roomMessage', data)
    }
})
```

## Debugging

### Check Connection Status

```javascript
// Server-side
app.get('/debug/connections', (req, res) => {
    const stats = socketManager.getStats()
    const users = Array.from(socketManager.users.entries()).map(([userId, data]) => ({
        userId,
        email: data.user.email,
        socketId: data.socketId,
        rooms: Array.from(data.rooms)
    }))
    
    res.json({ stats, users })
})
```

### Client-side Debugging

```javascript
// Log all socket events
socket.onAny((event, ...args) => {
    console.log(`[Socket Event] ${event}`, args)
})

// Check if in room
socket.emit('joinRoom', { roomId }, (response) => {
    console.log('Join response:', response)
    console.log('Already joined?', response.data.alreadyJoined)
})
```

### Server Logs

```
[Connection] User user@example.com reconnecting from different socket
[Connection] Disconnecting old socket: socket_abc
[SocketManager] User reconnecting: user@example.com (user123)
[SocketManager] Old socket: socket_abc, New socket: socket_def
[SocketManager] Preserving 3 room memberships
[Reconnection] Auto-rejoining 3 rooms for user@example.com
[Reconnection] Rejoined room: room1
[Reconnection] Rejoined room: room2
[Reconnection] Rejoined room: channel1
```

## Testing

### Test Reconnection

```javascript
// 1. Connect
const socket = io('http://localhost:3000', { auth: { token } })

// 2. Join rooms
socket.emit('joinRoom', { roomId: 'room1' })
socket.emit('joinRoom', { roomId: 'room2' })

// 3. Simulate disconnect
socket.disconnect()

// 4. Reconnect
socket.connect()

// 5. Check reconnected event
socket.on('reconnected', ({ rooms }) => {
    console.log('Auto-rejoined:', rooms)
    // Should show ['room1', 'room2']
})
```

### Test Duplicate Join

```javascript
// Join same room multiple times
socket.emit('joinRoom', { roomId: 'room1' }, (res1) => {
    console.log('First join:', res1.data.alreadyJoined) // false
    
    socket.emit('joinRoom', { roomId: 'room1' }, (res2) => {
        console.log('Second join:', res2.data.alreadyJoined) // true
    })
})
```

## Summary

✅ **Automatic duplicate connection prevention**  
✅ **State preservation across reconnections**  
✅ **Auto-rejoin rooms on reconnect**  
✅ **Duplicate join prevention**  
✅ **Clean disconnect of old sockets**  
✅ **Client notification of reconnection**  

The system now handles all reconnection scenarios gracefully, ensuring consistent state and preventing duplicate connections!
