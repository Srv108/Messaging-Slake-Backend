import mongoose from 'mongoose';

const message2Schema = new mongoose.Schema(
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
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'channel id is required']
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender id is required']
        }
    },
    { timestamps: true }
);

const Message2 = mongoose.model('Message2', message2Schema);

export default Message2;
