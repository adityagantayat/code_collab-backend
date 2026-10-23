import { Router } from 'express';
import { User } from '../models/user.js';
import { ConnectionRequest } from '../models/connectionRequest.js';
import validator from 'validator';
import { STATUS } from '../utils/constants.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.post('/send/:status/:toUserId', async (req, res) => {
    try {
        const toUserId = req.params.toUserId;
        const fromUserId = req.user._id;
        const status = req.params.status;
        const allowedStatus = [STATUS.INTERESTED, STATUS.IGNORED];
        if (!toUserId || !status) {
            return sendError(res, 400, 'Missing required fields');
        }
        if (!allowedStatus.includes(status)) {
            return sendError(res, 400, 'Invalid status');
        }
        if (!validator.isMongoId(toUserId)) {
            return sendError(res, 400, 'Invalid user ID format');
        }
        const targetUser = await User.findById(toUserId);
        if (!targetUser) {
            return sendError(res, 404, 'User not found');
        }
        if (toUserId === fromUserId.toString()) {
            return sendError(res, 400, 'You cannot send a connection request to yourself');
        }
        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId },
            ],
        });
        if (existingConnectionRequest) {
            return sendError(res, 409, 'Connection request already exists');
        }
        const connectionRequest = new ConnectionRequest({ fromUserId, toUserId, status });
        const data = await connectionRequest.save();
        sendSuccess(res, 200, 'Connection request sent successfully', data);
    } catch (error) {
        console.log(error);
        sendError(res, 500, 'Error sending connection request: ' + error.message);
    }
});

router.patch('/review/:status/:requestId', async (req, res) => {
    try {
        const { requestId, status } = req.params;
        const loggedInUserId = req.user._id;
        const allowedStatus = [STATUS.ACCEPTED, STATUS.REJECTED];

        if (!requestId || !status) {
            return sendError(res, 400, 'Missing required fields');
        }
        if (!validator.isMongoId(requestId)) {
            return sendError(res, 400, 'Invalid Request ID');
        }
        if (!allowedStatus.includes(status)) {
            return sendError(res, 400, 'Invalid status for review');
        }
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUserId,
            status: STATUS.INTERESTED,
        });
        if (!connectionRequest) {
            return sendError(res, 404, 'Invalid Connection Request');
        }

        connectionRequest.status = status;
        const data = await connectionRequest.save();
        sendSuccess(res, 200, 'Connection request ' + status.toLowerCase() + ' successfully', data);
    } catch (error) {
        console.log(error);
        sendError(res, 500, 'Error reviewing connection request: ' + error.message);
    }
});

export { router as requestRouter };