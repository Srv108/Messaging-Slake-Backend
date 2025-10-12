import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'WorkSpace name is required'],
        },
        members: [
            {
                memberId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                role: {
                    type: String,
                    enum: ['admin', 'member'],
                    default: 'member'
                }
            }
        ],
        description: {
            type: String
        },
        image: {
            type: String
        },
        joinCode: {
            type: String,
            required: [true, 'code is required to join server']
        },
        channels: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Channel'
            }
        ]
    },
    { timestamps: true }
);

const WorkSpace = mongoose.model('WorkSpace', workspaceSchema);

export default WorkSpace;
