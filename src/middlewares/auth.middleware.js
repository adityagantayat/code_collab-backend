import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';


export const userAuth = (async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            throw new Error('Invalid Token');
        }
        const { _id } = jwt.verify(token, 'secret');
        const user = await User.findById(_id);
        if (!user) {
            throw new Error('User not found');
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send('Error authenticating user: ' + error.message);
    }
});