import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
    {   
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true,'AdminId is required '],
        },
        recieverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'reciever is required '],
        },
        status: {
            type: String,
            enum: ['active', 'blocked', 'muted'],
            default: 'active'
        },
    },
    { 
        timestamps: true,
    }
);

roomSchema.index({ senderId: 1, recieverId: 1},{ unique: true});

roomSchema.pre('save',function (next){
    if(this.senderId > this.recieverId){
        const temp = this.senderId;
        this.senderId = this.recieverId;
        this.recieverId = temp;
    }
    next();
})
const Room = mongoose.model('Room', roomSchema);

export default Room;
