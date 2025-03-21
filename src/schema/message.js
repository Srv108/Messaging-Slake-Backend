import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        body: {
            type: String,
            required: [true, 'Message is required']
        },
        image: {
            type: String
        },
        status: { 
            type: String, 
            enum: ['read', 'unread'], 
            default: 'unread' 
        },
        channelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
            required: [true, 'channel id is required']
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender id is required']
        },
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WorkSpace',
            required: [true, 'Workspace id is required']
        }
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
