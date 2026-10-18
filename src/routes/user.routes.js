import { Router } from 'express';
import { ConnectionRequest } from '../models/connectionRequest.js';
import { STATUS, SAFE_DATA } from '../utils/constants.js';
import { User } from '../models/user.js';
const router = Router();
router.get('/requests/received', async (req, res) => {
    try {
        const { _id } = req.user;
        const requests = await ConnectionRequest.find({
            toUserId: _id,
            status: STATUS.INTERESTED
        }).populate('fromUserId', SAFE_DATA);
        res.status(200).json(requests);
    } catch (error) {
        console.log(error);
        res.status(500).send('Error getting user requests: ' + error.message);
    }
});

router.get('/connections', async (req, res) => {
    try {
        const { _id } = req.user;
        const requests = await ConnectionRequest.find({
            $or: [
                { fromUserId: _id, status: STATUS.ACCEPTED },
                { toUserId: _id, status: STATUS.ACCEPTED }
            ]
        })
            .populate('toUserId', SAFE_DATA)
            .populate('fromUserId', SAFE_DATA);
        const data = requests
            .filter((request) => request.fromUserId && request.toUserId)
            .map((request) => {
                if (request.fromUserId._id.equals(_id)) {
                    return request.toUserId;
                }
                return request.fromUserId;
            });

        res.status(200).json({ data });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error getting user connections: ' + error.message);
    }
});

router.get('/feed', async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        let limit = parseInt(req.query.limit) || 10;
        limit = Math.min(Math.max(1, limit), 50);
        const skip = (page - 1) * limit;
        const connections = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUserId },
                { toUserId: loggedInUserId }
            ]
        }).select('fromUserId toUserId');

        const hideUsersFromFeed = new Set();
        connections.map((conn) => {
            hideUsersFromFeed.add(conn.fromUserId.toString());
            hideUsersFromFeed.add(conn.toUserId.toString());
        });
        const users = await User.find({
            $and: [{
                _id: {
                    $nin: Array.from(hideUsersFromFeed)
                }
            }, {
                _id: { $ne: loggedInUserId }
            }]
        }).select(SAFE_DATA).skip(skip).limit(limit);
        res.status(200).json({ data: users });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error getting user feed: ' + error.message);
    }
});
export { router as userRouter };
