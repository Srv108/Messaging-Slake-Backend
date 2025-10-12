// Channel/Group Chat Events
export const NEW_MESSAGE_EVENT = 'NewMessage';
export const NEW_MESSAGE_RECEIVED_EVENT = 'NewMessageReceived';
export const CHANNEL_MESSAGE_SENT = 'channelMessageSent';
export const CHANNEL_MESSAGE_CONFIRMED = 'channelMessageConfirmed';
export const CHANNEL_MESSAGE_FAILED = 'channelMessageFailed';

// Channel Management Events
export const JOIN_CHANNEL = 'JoinChannel';
export const LEAVE_CHANNEL = 'LeaveChannel';

// One-to-One Chat Events
export const ROOM_MESSAGE = 'roomMessage';
export const ROOM_MESSAGE_RECEIVED = 'roomMessageRecieved';
export const ROOM_MESSAGE_SENT = 'roomMessageSent';
export const ROOM_MESSAGE_CONFIRMED = 'roomMessageConfirmed';
export const ROOM_MESSAGE_FAILED = 'roomMessageFailed';

// Room Management Events
export const JOIN_ROOM = 'joinRoom';
export const LEAVE_ROOM = 'leaveRoom';

// WebRTC Events
export const OFFER = 'offer';
export const ANSWER = 'answer';
export const ICE_CANDIDATE = 'ice-candidate';
export const INCOMING_CALL_NOTIFICATION = 'IncomingCallNotification';
export const NEW_ANSWER = 'newAnswer';
export const NEW_ICE_CANDIDATE = 'newIce-candidate';

// Connection Events
export const CONNECT = 'connection';
export const DISCONNECT = 'disconnect';
export const RECONNECTED = 'reconnected';