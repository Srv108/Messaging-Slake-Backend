import mongoose from "mongoose";

const userStatusSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true,'Email is required']
    },
    status: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: null
    }
},{ timestamps: true});

const UserStatus = mongoose.model('UserStatus',userStatusSchema);

export default UserStatus;
