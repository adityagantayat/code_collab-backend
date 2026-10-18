import { Router } from 'express';
import { User } from '../models/user.js';
import { ConnectionRequest } from '../models/connectionRequest.js';
import validator from 'validator';
import { STATUS } from '../utils/constants.js';

const router = Router();

router.post('/send/:status/:toUserId', async (req, res) => {
    try {
        const toUserId = req.params.toUserId;
        const fromUserId = req.user._id;
        const status = req.params.status;
        const allowedStatus = [STATUS.INTERESTED, STATUS.IGNORED];
        if (!toUserId || !status) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        if (!validator.isMongoId(toUserId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        const targetUser = await User.findById(toUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (toUserId === fromUserId.toString()) {
            return res.status(400).json({ message: 'You cannot send a connection request to yourself' });
        }
        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId },
            ],
        });
        if (existingConnectionRequest) {
            return res.status(409).json({ message: 'Connection request already exists' });
        }
        const connectionRequest = new ConnectionRequest({ fromUserId, toUserId, status });
        const data = await connectionRequest.save();
        res.status(200).json({ message: 'Connection request sent successfully', data });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error sending connection request: ' + error.message });
    }
});

router.patch('/review/:status/:requestId', async (req, res) => {
    try {
        const { requestId, status } = req.params;
        const loggedInUserId = req.user._id;
        const allowedStatus = [STATUS.ACCEPTED, STATUS.REJECTED];

        if (!requestId || !status) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (!validator.isMongoId(requestId)) {
            return res.status(400).json({ message: 'Invalid Request ID' });
        }
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: 'Invalid status for review' });
        }
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUserId,
            status: STATUS.INTERESTED,
        });
        if (!connectionRequest) {
            return res.status(404).json({ message: 'Invalid Connection Request' });
        }

        connectionRequest.status = status;
        const data = await connectionRequest.save();
        res.status(200).json({ message: 'Connection request ' + status.toLowerCase() + ' successfully', data });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error reviewing connection request: ' + error.message });
    }
});

export { router as requestRouter };