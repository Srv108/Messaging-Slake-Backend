import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true,'AdminId is required '],
        },
        participants: [
            {
                memberId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                status: {
                    type: String,
                    enum: ['active', 'blocked', 'muted'],
                    default: 'active'
                },
                workspaceId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Workspace',
                }
            }
        ],
    },
    { timestamps: true }
);

const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);

export default DirectMessage;
