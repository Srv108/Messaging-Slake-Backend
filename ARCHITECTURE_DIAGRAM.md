# Socket Architecture - Visual Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Browser  │  │ Browser  │  │ Browser  │  │  Mobile  │       │
│  │  Tab 1   │  │  Tab 2   │  │  Tab 3   │  │   App    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        │ WebSocket   │ WebSocket   │ WebSocket   │ WebSocket
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼──────────────┐
│                      Socket.IO Server                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Connection Handler (index.js)                │ │
│  │  • Authentication (isAuthenticatedSocket)                 │ │
│  │  • User Registration (socketManager.addUser)              │ │
│  │  • Event Routing                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            SocketManager (Stateful Core)                  │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  users: Map<userId, {socketId, user, rooms}>        │ │ │
│  │  │  socketToUser: Map<socketId, userId>                │ │ │
│  │  │  rooms: Map<roomId, Set<userId>>                    │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  Methods:                                                   │ │
│  │  • addUser(socketId, user)                                 │ │
│  │  • removeUser(socketId)                                    │ │
│  │  • joinRoom(userId, roomId)                                │ │
│  │  • getUsersInRoom(roomId) → [{userId, socketId, user}]    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  Message Handlers                         │ │
│  │  ┌──────────────────┐  ┌──────────────────┐             │ │
│  │  │ One-to-One Chat  │  │ Group/Channel    │             │ │
│  │  │ (message2Socket) │  │ (messageSocket)  │             │ │
│  │  └──────────────────┘  └──────────────────┘             │ │
│  │  ┌──────────────────┐  ┌──────────────────┐             │ │
│  │  │ Room Management  │  │ Channel Mgmt     │             │ │
│  │  │ (roomSocket)     │  │ (channelSocket)  │             │ │
│  │  └──────────────────┘  └──────────────────┘             │ │
│  └───────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ Async DB Operations
                           ▼
                    ┌─────────────┐
                    │   MongoDB   │
                    │  • Messages │
                    │  • Users    │
                    │  • Rooms    │
                    └─────────────┘
```

## Message Flow - Optimistic Delivery

### One-to-One Chat Flow

```
User A (Browser)                Server                    User B (Browser)
     │                            │                             │
     │ 1. Send Message            │                             │
     ├──roomMessage──────────────>│                             │
     │   {roomId, body}           │                             │
     │                            │                             │
     │                            │ 2. Create Optimistic Msg    │
     │                            │    _id: temp_123_abc        │
     │                            │    isOptimistic: true       │
     │                            │                             │
     │                            │ 3. Get Users in Room        │
     │                            │    socketManager            │
     │                            │    .getUsersInRoom(roomId)  │
     │                            │    → [userA, userB]         │
     │                            │                             │
     │ 4. Sender Confirmation     │ 5. Emit to Receiver         │
     │<──roomMessageSent──────────┼──roomMessageRecieved──────>│
     │   (optimistic msg)         │   (optimistic msg)          │
     │   ⏱️ < 5ms                  │   ⏱️ < 5ms                   │
     │                            │                             │
     │ 6. Display in UI ✨        │                             │ 7. Display in UI ✨
     │    (with loading icon)     │                             │    (with loading icon)
     │                            │                             │
     │                            │ 8. Save to DB (Async)       │
     │                            │    createMessageService()   │
     │                            │    ⏱️ 50-200ms              │
     │                            │                             │
     │                            ▼                             │
     │                      ┌─────────────┐                    │
     │                      │   MongoDB   │                    │
     │                      │   (Saved)   │                    │
     │                      └──────┬──────┘                    │
     │                            │                             │
     │                            │ 9. DB Save Complete         │
     │                            │    realMessage with         │
     │                            │    _id: 507f1f77...         │
     │                            │                             │
     │ 10. Update UI              │ 11. Update UI               │
     │<──roomMessageConfirmed─────┼──roomMessageConfirmed─────>│
     │    {tempId, _id}           │    {tempId, _id}            │
     │    Replace temp with real  │    Replace temp with real   │
     │    Show checkmark ✓        │    Show checkmark ✓         │
     │                            │                             │
```

### Group/Channel Chat Flow

```
User 1          User 2          Server          User 3          User 4
  │               │               │               │               │
  │ Send Message  │               │               │               │
  ├─NEW_MESSAGE──────────────────>│               │               │
  │               │               │               │               │
  │               │               │ Create Optimistic             │
  │               │               │ Get All Users in Channel      │
  │               │               │ → [user1, user2, user3, user4]│
  │               │               │                               │
  │<──channelMessageSent──────────┤               │               │
  │               │               │               │               │
  │               │<──NEW_MESSAGE_RECEIVED────────┤               │
  │               │               │               │               │
  │               │               ├──NEW_MESSAGE_RECEIVED────────>│
  │               │               │               │               │
  │               │               ├──NEW_MESSAGE_RECEIVED────────────────>│
  │               │               │               │               │
  │               │               │ ⏱️ All emits < 5ms total      │
  │               │               │               │               │
  │ Display ✨    │ Display ✨    │               │ Display ✨    │ Display ✨
  │               │               │               │               │
  │               │               │ Save to DB    │               │
  │               │               │ (Async)       │               │
  │               │               ▼               │               │
  │               │         ┌─────────┐           │               │
  │               │         │ MongoDB │           │               │
  │               │         └────┬────┘           │               │
  │               │               │               │               │
  │<──channelMessageConfirmed─────┤               │               │
  │               │<──────────────┤               │               │
  │               │               ├──────────────>│               │
  │               │               ├──────────────────────────────>│
  │               │               │               │               │
  │ Update ✓      │ Update ✓      │               │ Update ✓      │ Update ✓
```

## SocketManager State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SocketManager State                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  users: Map {                                               │
│    "user123" → {                                            │
│      socketId: "socket_abc",                                │
│      user: { id, username, email },                         │
│      rooms: Set ["room1", "room2", "channel1"]              │
│    },                                                        │
│    "user456" → {                                            │
│      socketId: "socket_def",                                │
│      user: { id, username, email },                         │
│      rooms: Set ["room1", "channel1", "channel2"]           │
│    }                                                         │
│  }                                                           │
│                                                              │
│  socketToUser: Map {                                        │
│    "socket_abc" → "user123",                                │
│    "socket_def" → "user456"                                 │
│  }                                                           │
│                                                              │
│  rooms: Map {                                               │
│    "room1" → Set ["user123", "user456"],                    │
│    "room2" → Set ["user123"],                               │
│    "channel1" → Set ["user123", "user456"],                 │
│    "channel2" → Set ["user456"]                             │
│  }                                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Connection Lifecycle

```
┌──────────────┐
│ User Connects│
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Authentication Middleware       │
│ (isAuthenticatedSocket)         │
│ • Verify JWT token              │
│ • Attach user to socket         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Connection Handler              │
│ • socket.join(user-room)        │
│ • socketManager.addUser()       │
│ • Initialize event handlers     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ User Active                     │
│ • Send/receive messages         │
│ • Join/leave rooms              │
│ • Real-time interactions        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ User Disconnects                │
│ • socket.on('disconnect')       │
│ • socketManager.removeUser()    │
│ • Clean up all rooms            │
│ • Log statistics                │
└─────────────────────────────────┘
```

## Room Join Flow

```
Client                          Server                      SocketManager
  │                               │                               │
  │ 1. Join Room Request          │                               │
  ├──joinRoom({roomId})──────────>│                               │
  │                               │                               │
  │                               │ 2. Socket.IO Join             │
  │                               │    socket.join(roomId)        │
  │                               │                               │
  │                               │ 3. Register in State          │
  │                               ├──joinRoom(userId, roomId)────>│
  │                               │                               │
  │                               │                               │ Update State:
  │                               │                               │ • Add roomId to user.rooms
  │                               │                               │ • Add userId to room users
  │                               │                               │
  │                               │ 4. Get Connected Users        │
  │                               │<──getUsersInRoom(roomId)──────┤
  │                               │   Returns: [{userId, socketId}]
  │                               │                               │
  │ 5. Join Confirmation          │                               │
  │<──{success, connectedUsers}───┤                               │
  │                               │                               │
  │ 6. Ready to Receive Messages  │                               │
  │                               │                               │
```

## Message State Transitions

```
┌─────────────┐
│   Client    │
│ Sends Msg   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  OPTIMISTIC STATE           │
│  • _id: temp_123_abc        │
│  • isOptimistic: true       │
│  • UI: Loading indicator ⏳ │
└──────┬──────────────────────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  CONFIRMED  │ │   FAILED    │ │  TIMEOUT    │
│  STATE      │ │   STATE     │ │   STATE     │
│             │ │             │ │             │
│ • _id: real │ │ • Error msg │ │ • Retry?    │
│ • tempId    │ │ • Retry btn │ │             │
│ • UI: ✓     │ │ • UI: ❌    │ │ • UI: ⚠️    │
└─────────────┘ └─────────────┘ └─────────────┘
```

## Performance Comparison

### Before (Stateless)
```
Client                    Server                     Database
  │                         │                           │
  │ Send Message            │                           │
  ├────────────────────────>│                           │
  │                         │ Save to DB                │
  │                         ├──────────────────────────>│
  │                         │                           │ Write
  │                         │                           │ ⏱️ 50-100ms
  │                         │<──────────────────────────┤
  │                         │                           │
  │                         │ Fetch Message Details     │
  │                         ├──────────────────────────>│
  │                         │                           │ Read + Populate
  │                         │                           │ ⏱️ 20-50ms
  │                         │<──────────────────────────┤
  │                         │                           │
  │                         │ Emit to Room              │
  │                         │ (Socket.IO lookup)        │
  │                         │ ⏱️ 5-10ms                  │
  │                         │                           │
  │ Receive Message         │                           │
  │<────────────────────────┤                           │
  │                         │                           │
  │ ⏱️ TOTAL: 75-160ms      │                           │
```

### After (Stateful)
```
Client                    Server                     SocketManager
  │                         │                           │
  │ Send Message            │                           │
  ├────────────────────────>│                           │
  │                         │ Get Users in Room         │
  │                         ├──────────────────────────>│
  │                         │                           │ In-memory lookup
  │                         │<──────────────────────────┤ ⏱️ < 1ms
  │                         │                           │
  │                         │ Emit to All Users         │
  │                         │ ⏱️ 2-4ms                   │
  │                         │                           │
  │ Receive Message ✨      │                           │
  │<────────────────────────┤                           │
  │                         │                           │
  │ ⏱️ TOTAL: < 5ms         │                           │
  │                         │                           │
  │                         │ Save to DB (Async)        │
  │                         │ ⏱️ 50-200ms (background)   │
  │                         │                           │
  │ Receive Confirmation    │                           │
  │<────────────────────────┤                           │
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              UI Components                           │  │
│  │  • Message List (with optimistic updates)            │  │
│  │  • Message Input                                     │  │
│  │  • Loading States                                    │  │
│  │  • Error Handling                                    │  │
│  └────────────┬─────────────────────────────────────────┘  │
└───────────────┼────────────────────────────────────────────┘
                │
                │ Socket.IO Events
                │
┌───────────────▼────────────────────────────────────────────┐
│                    Backend (Node.js)                       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Socket.IO Server Layer                     │ │
│  │  • Connection Management                             │ │
│  │  • Event Routing                                     │ │
│  │  • Authentication                                    │ │
│  └────────────┬─────────────────────────────────────────┘ │
│               │                                            │
│  ┌────────────▼─────────────────────────────────────────┐ │
│  │         SocketManager (In-Memory State)              │ │
│  │  • User Tracking                                     │ │
│  │  • Room Membership                                   │ │
│  │  • Fast Lookups                                      │ │
│  └────────────┬─────────────────────────────────────────┘ │
│               │                                            │
│  ┌────────────▼─────────────────────────────────────────┐ │
│  │          Message Controllers                         │ │
│  │  • Optimistic Message Creation                       │ │
│  │  • Immediate Emit                                    │ │
│  │  • Async DB Save                                     │ │
│  └────────────┬─────────────────────────────────────────┘ │
└───────────────┼────────────────────────────────────────────┘
                │
                │ Mongoose
                │
┌───────────────▼────────────────────────────────────────────┐
│                       MongoDB                              │
│  • Messages Collection                                     │
│  • Users Collection                                        │
│  • Rooms Collection                                        │
│  • Channels Collection                                     │
└────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current Architecture (Single Server)
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Client 1 │────>│          │<────│ Client 2 │
└──────────┘     │  Node.js │     └──────────┘
┌──────────┐     │  Server  │     ┌──────────┐
│ Client 3 │────>│    +     │<────│ Client 4 │
└──────────┘     │ Socket   │     └──────────┘
                 │ Manager  │
                 └────┬─────┘
                      │
                 ┌────▼─────┐
                 │ MongoDB  │
                 └──────────┘

✅ Works great for single server
❌ Won't scale to multiple servers
```

### Future Architecture (Multi-Server with Redis)
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Client 1 │────>│ Server 1 │     │ Client 3 │
└──────────┘     └────┬─────┘     └─────┬────┘
                      │                 │
┌──────────┐     ┌────▼─────┐     ┌────▼─────┐
│ Client 2 │────>│  Redis   │<────│ Server 2 │
└──────────┘     │  Adapter │     └────┬─────┘
                 └────┬─────┘          │
                      │           ┌────▼─────┐
                 ┌────▼─────┐    │ Client 4 │
                 │ MongoDB  │    └──────────┘
                 └──────────┘

✅ Scales horizontally
✅ State shared across servers
✅ Load balancing
```

---

**Note:** All diagrams use ASCII art for maximum compatibility. For production documentation, consider using tools like Mermaid, PlantUML, or Draw.io for more sophisticated diagrams.
