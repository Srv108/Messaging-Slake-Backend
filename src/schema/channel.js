import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Channel name is required'],
            // unique: true
        },
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WorkSpace',
            required: [true, 'workspace id is required']
        }
    },
    { timestamps: true }
);

const Channel = mongoose.model('Channel', channelSchema);

export default Channel;
