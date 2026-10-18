import { Schema, model } from 'mongoose';

const connectionRequestSchema = new Schema({
    fromUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ['ignored', 'accepted', 'rejected', 'interested'],
            message: '{VALUE} is not a valid status type',
        },
    }
}, { timestamps: true });

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });
export const ConnectionRequest = model('ConnectionRequest', connectionRequestSchema);