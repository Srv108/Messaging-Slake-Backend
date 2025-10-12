# Frontend Migration Guide

## Overview

The backend socket system has been upgraded from **stateless** to **stateful** with **optimistic message delivery**. This guide helps you migrate your frontend to take advantage of the new real-time performance.

## Breaking Changes

### 1. New Event Flow

**Before:**
```javascript
// Old flow - single event
socket.on('roomMessageRecieved', (message) => {
    // Message already saved to DB
    addMessageToUI(message)
})
```

**After:**
```javascript
// New flow - optimistic + confirmation
socket.on('roomMessageRecieved', (message) => {
    // Message NOT yet in DB (optimistic)
    addMessageToUI(message)
})

socket.on('roomMessageConfirmed', (message) => {
    // Now saved to DB, replace temp ID with real ID
    updateMessageInUI(message.tempId, message)
})

socket.on('roomMessageFailed', ({ tempId, error }) => {
    // Failed to save, remove from UI
    removeMessageFromUI(tempId)
})
```

### 2. Temporary Message IDs

**Before:**
```javascript
message._id = "507f1f77bcf86cd799439011" // Real MongoDB ID
```

**After (Optimistic):**
```javascript
message._id = "temp_1234567890_abc123" // Temporary ID
message.isOptimistic = true
```

**After (Confirmed):**
```javascript
message._id = "507f1f77bcf86cd799439011" // Real MongoDB ID
message.tempId = "temp_1234567890_abc123" // Original temp ID
message.isConfirmed = true
```

### 3. Must Join Rooms/Channels

**Before:** Messages might work without explicitly joining

**After:** MUST explicitly join to receive messages
```javascript
socket.emit('joinRoom', { roomId: 'abc123' })
socket.emit('JOIN_CHANNEL', { channelId: 'xyz789' })
```

## Migration Steps

### Step 1: Update Socket Connection

```javascript
// Add new event listeners
const socket = io('http://localhost:3000', {
    auth: { token: yourAuthToken }
})

// One-to-One Chat
socket.on('roomMessageRecieved', handleOptimisticMessage)
socket.on('roomMessageSent', handleSenderConfirmation)
socket.on('roomMessageConfirmed', handleMessageConfirmed)
socket.on('roomMessageFailed', handleMessageFailed)

// Group/Channel Chat
socket.on('NEW_MESSAGE_RECEIVED_EVENT', handleOptimisticMessage)
socket.on('channelMessageSent', handleSenderConfirmation)
socket.on('channelMessageConfirmed', handleMessageConfirmed)
socket.on('channelMessageFailed', handleMessageFailed)
```

### Step 2: Implement Message State Management

```javascript
// Track message states
const MESSAGE_STATES = {
    SENDING: 'sending',      // Optimistic, not yet confirmed
    SENT: 'sent',            // Confirmed by DB
    FAILED: 'failed'         // Failed to save
}

// Store messages with state
const messages = new Map()

function addMessage(message) {
    messages.set(message._id, {
        ...message,
        state: message.isOptimistic ? MESSAGE_STATES.SENDING : MESSAGE_STATES.SENT
    })
}

function updateMessage(tempId, confirmedMessage) {
    messages.delete(tempId)
    messages.set(confirmedMessage._id, {
        ...confirmedMessage,
        state: MESSAGE_STATES.SENT
    })
}

function markMessageFailed(tempId) {
    const message = messages.get(tempId)
    if (message) {
        message.state = MESSAGE_STATES.FAILED
    }
}
```

### Step 3: Update UI Components

#### React Example

```jsx
import { useState, useEffect } from 'react'
import io from 'socket.io-client'

function ChatRoom({ roomId, userId, token }) {
    const [messages, setMessages] = useState([])
    const [socket, setSocket] = useState(null)

    useEffect(() => {
        const newSocket = io('http://localhost:3000', {
            auth: { token }
        })

        // Join room
        newSocket.emit('joinRoom', { roomId }, (response) => {
            console.log(`Joined room with ${response.data.connectedUsers} users`)
        })

        // Handle optimistic messages
        newSocket.on('roomMessageRecieved', (message) => {
            setMessages(prev => [...prev, {
                ...message,
                state: 'sending'
            }])
        })

        // Handle confirmations
        newSocket.on('roomMessageConfirmed', (message) => {
            setMessages(prev => prev.map(msg => 
                msg._id === message.tempId 
                    ? { ...message, state: 'sent' }
                    : msg
            ))
        })

        // Handle failures
        newSocket.on('roomMessageFailed', ({ tempId, error }) => {
            setMessages(prev => prev.map(msg =>
                msg._id === tempId
                    ? { ...msg, state: 'failed', error }
                    : msg
            ))
        })

        setSocket(newSocket)

        return () => {
            newSocket.emit('leaveRoom', { roomId })
            newSocket.close()
        }
    }, [roomId, token])

    const sendMessage = (body) => {
        if (!socket) return

        socket.emit('roomMessage', {
            roomId,
            senderId: userId,
            body
        })
    }

    return (
        <div className="chat-room">
            <div className="messages">
                {messages.map(msg => (
                    <Message 
                        key={msg._id} 
                        message={msg}
                        onRetry={() => sendMessage(msg.body)}
                    />
                ))}
            </div>
            <MessageInput onSend={sendMessage} />
        </div>
    )
}

function Message({ message, onRetry }) {
    return (
        <div className={`message ${message.state}`}>
            <p>{message.body}</p>
            <div className="message-status">
                {message.state === 'sending' && (
                    <span className="sending">⏳ Sending...</span>
                )}
                {message.state === 'sent' && (
                    <span className="sent">✓ Sent</span>
                )}
                {message.state === 'failed' && (
                    <div className="failed">
                        <span>❌ Failed</span>
                        <button onClick={onRetry}>Retry</button>
                    </div>
                )}
            </div>
        </div>
    )
}
```

#### Vue Example

```vue
<template>
  <div class="chat-room">
    <div class="messages">
      <div 
        v-for="msg in messages" 
        :key="msg._id"
        :class="['message', msg.state]"
      >
        <p>{{ msg.body }}</p>
        <span v-if="msg.state === 'sending'">⏳</span>
        <span v-if="msg.state === 'sent'">✓</span>
        <button v-if="msg.state === 'failed'" @click="retryMessage(msg)">
          Retry
        </button>
      </div>
    </div>
    <input v-model="newMessage" @keyup.enter="sendMessage" />
  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  props: ['roomId', 'userId', 'token'],
  data() {
    return {
      messages: [],
      socket: null,
      newMessage: ''
    }
  },
  mounted() {
    this.socket = io('http://localhost:3000', {
      auth: { token: this.token }
    })

    this.socket.emit('joinRoom', { roomId: this.roomId })

    this.socket.on('roomMessageRecieved', (message) => {
      this.messages.push({ ...message, state: 'sending' })
    })

    this.socket.on('roomMessageConfirmed', (message) => {
      const index = this.messages.findIndex(m => m._id === message.tempId)
      if (index !== -1) {
        this.messages.splice(index, 1, { ...message, state: 'sent' })
      }
    })

    this.socket.on('roomMessageFailed', ({ tempId, error }) => {
      const msg = this.messages.find(m => m._id === tempId)
      if (msg) {
        msg.state = 'failed'
        msg.error = error
      }
    })
  },
  methods: {
    sendMessage() {
      if (!this.newMessage.trim()) return

      this.socket.emit('roomMessage', {
        roomId: this.roomId,
        senderId: this.userId,
        body: this.newMessage
      })

      this.newMessage = ''
    },
    retryMessage(msg) {
      this.sendMessage(msg.body)
    }
  },
  beforeUnmount() {
    this.socket.emit('leaveRoom', { roomId: this.roomId })
    this.socket.close()
  }
}
</script>
```

#### Angular Example

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import { io, Socket } from 'socket.io-client'

interface Message {
  _id: string
  body: string
  state: 'sending' | 'sent' | 'failed'
  error?: string
}

@Component({
  selector: 'app-chat-room',
  template: `
    <div class="chat-room">
      <div class="messages">
        <div *ngFor="let msg of messages" [ngClass]="['message', msg.state]">
          <p>{{ msg.body }}</p>
          <span *ngIf="msg.state === 'sending'">⏳</span>
          <span *ngIf="msg.state === 'sent'">✓</span>
          <button *ngIf="msg.state === 'failed'" (click)="retryMessage(msg)">
            Retry
          </button>
        </div>
      </div>
      <input [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" />
    </div>
  `
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  messages: Message[] = []
  socket: Socket
  newMessage = ''

  constructor(
    private roomId: string,
    private userId: string,
    private token: string
  ) {}

  ngOnInit() {
    this.socket = io('http://localhost:3000', {
      auth: { token: this.token }
    })

    this.socket.emit('joinRoom', { roomId: this.roomId })

    this.socket.on('roomMessageRecieved', (message: any) => {
      this.messages.push({ ...message, state: 'sending' })
    })

    this.socket.on('roomMessageConfirmed', (message: any) => {
      const index = this.messages.findIndex(m => m._id === message.tempId)
      if (index !== -1) {
        this.messages[index] = { ...message, state: 'sent' }
      }
    })

    this.socket.on('roomMessageFailed', ({ tempId, error }: any) => {
      const msg = this.messages.find(m => m._id === tempId)
      if (msg) {
        msg.state = 'failed'
        msg.error = error
      }
    })
  }

  sendMessage() {
    if (!this.newMessage.trim()) return

    this.socket.emit('roomMessage', {
      roomId: this.roomId,
      senderId: this.userId,
      body: this.newMessage
    })

    this.newMessage = ''
  }

  retryMessage(msg: Message) {
    this.sendMessage()
  }

  ngOnDestroy() {
    this.socket.emit('leaveRoom', { roomId: this.roomId })
    this.socket.close()
  }
}
```

### Step 4: Handle Edge Cases

#### Reconnection Logic

```javascript
socket.on('connect', () => {
    console.log('Connected')
    
    // Rejoin all active rooms
    activeRooms.forEach(roomId => {
        socket.emit('joinRoom', { roomId })
    })
})

socket.on('disconnect', () => {
    console.log('Disconnected')
    // Show offline indicator
})
```

#### Message Deduplication

```javascript
const seenMessageIds = new Set()

socket.on('roomMessageRecieved', (message) => {
    if (seenMessageIds.has(message._id)) {
        console.warn('Duplicate message ignored:', message._id)
        return
    }
    
    seenMessageIds.add(message._id)
    addMessageToUI(message)
})
```

#### Offline Queue

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

socket.on('connect', () => {
    // Send queued messages
    while (messageQueue.length > 0) {
        const data = messageQueue.shift()
        socket.emit('roomMessage', data)
    }
})
```

## Testing Checklist

- [ ] Messages appear instantly (< 100ms perceived)
- [ ] Optimistic messages show loading indicator
- [ ] Confirmed messages update with real ID
- [ ] Failed messages show error and retry option
- [ ] No duplicate messages in UI
- [ ] Reconnection rejoins rooms automatically
- [ ] Offline messages queue and send on reconnect
- [ ] Multiple tabs/windows sync correctly
- [ ] Memory doesn't leak (check DevTools)
- [ ] Works on slow network (throttle in DevTools)

## Performance Tips

### 1. Debounce Typing Indicators

```javascript
import { debounce } from 'lodash'

const emitTyping = debounce(() => {
    socket.emit('typing', { roomId, userId })
}, 300)
```

### 2. Virtual Scrolling for Large Message Lists

```javascript
// Use react-window or similar
import { FixedSizeList } from 'react-window'

<FixedSizeList
    height={600}
    itemCount={messages.length}
    itemSize={80}
>
    {({ index, style }) => (
        <div style={style}>
            <Message message={messages[index]} />
        </div>
    )}
</FixedSizeList>
```

### 3. Lazy Load Message History

```javascript
function loadMoreMessages() {
    const oldestMessage = messages[0]
    
    fetch(`/api/messages?roomId=${roomId}&before=${oldestMessage._id}`)
        .then(res => res.json())
        .then(olderMessages => {
            setMessages(prev => [...olderMessages, ...prev])
        })
}
```

### 4. Optimize Re-renders

```javascript
// React - use memo
const Message = React.memo(({ message }) => {
    return <div>{message.body}</div>
}, (prev, next) => {
    return prev.message._id === next.message._id &&
           prev.message.state === next.message.state
})
```

## Common Pitfalls

### ❌ Don't: Add optimistic message to UI manually

```javascript
// Wrong
function sendMessage(body) {
    const optimisticMsg = { _id: 'temp', body, state: 'sending' }
    setMessages(prev => [...prev, optimisticMsg]) // Don't do this
    
    socket.emit('roomMessage', { roomId, senderId, body })
}
```

### ✅ Do: Let the server send it back

```javascript
// Correct
function sendMessage(body) {
    socket.emit('roomMessage', { roomId, senderId, body })
    // Wait for 'roomMessageSent' event from server
}

socket.on('roomMessageSent', (message) => {
    setMessages(prev => [...prev, message])
})
```

### ❌ Don't: Forget to handle failures

```javascript
// Wrong - no error handling
socket.on('roomMessageRecieved', (msg) => {
    addMessage(msg)
})
```

### ✅ Do: Always handle all events

```javascript
// Correct
socket.on('roomMessageRecieved', handleOptimistic)
socket.on('roomMessageConfirmed', handleConfirmed)
socket.on('roomMessageFailed', handleFailed)
```

## Rollback Plan

If you need to rollback to old behavior temporarily:

```javascript
// Ignore optimistic updates, wait for confirmation
socket.on('roomMessageRecieved', () => {
    // Ignore optimistic message
})

socket.on('roomMessageConfirmed', (message) => {
    // Only add confirmed messages
    addMessageToUI(message)
})
```

## Support & Resources

- **Backend Docs**: See `SOCKET_ARCHITECTURE.md`
- **Event Reference**: See `SOCKET_EVENTS.md`
- **Testing Guide**: See `TESTING_GUIDE.md`

## Questions?

Common questions:

**Q: Why do I see duplicate messages?**  
A: Implement message deduplication using a Set of seen IDs.

**Q: Messages disappear after refresh?**  
A: Load message history from API on mount, socket only for real-time updates.

**Q: How to handle images?**  
A: Upload image first, then send message with image URL.

**Q: What about read receipts?**  
A: Implement separately with `markAsRead` event (not yet implemented).

**Q: Can I use REST API for sending messages?**  
A: Yes, but you won't get optimistic updates. Socket is recommended.
