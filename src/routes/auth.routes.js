import { Router } from 'express';
import { validateSignUpData } from '../utils/validation.js';
import { User } from '../models/user.js';
import bcrypt from 'bcrypt';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.post('/signup', async (req, res) => {
    try {
        validateSignUpData(req);
        const { firstName, lastName, emailId, password } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({ firstName, lastName, emailId, password: passwordHash });
        await user.save();
        sendSuccess(res, 201, 'User saved successfully', user);
    } catch (error) {
        console.log(error);
        if (error.code === 11000) {
            return sendError(res, 409, 'Error saving user: Email already exists');
        }
        if (
            error.name === 'ValidationError' ||
            error.message.includes('required') ||
            error.message.includes('Invalid') ||
            error.message.includes('strong')
        ) {
            return sendError(res, 400, 'Error saving user: ' + error.message);
        }
        sendError(res, 500, 'Error saving user: ' + error.message);
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { emailId, password } = req.body;
        if (!emailId || !password) {
            return sendError(res, 400, 'Error signing in user: Email and password are required');
        }
        const user = await User.findOne({ emailId: emailId.toLowerCase() });
        if (!user) {
            return sendError(res, 401, 'Error signing in user: Invalid Credentials');
        }
        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return sendError(res, 401, 'Error signing in user: Invalid Credentials');
        }
        const token = user.getJWT();
        res.cookie('token', token);
        sendSuccess(res, 200, 'User signed in successfully', user);
    } catch (error) {
        console.log(error);
        sendError(res, 500, 'Error signing in user: ' + error.message);
    }
});

router.post('/signout', async (req, res) => {
    res.cookie('token', null, { expires: new Date(Date.now()) });
    sendSuccess(res, 200, 'Signed out successfully');
});

export { router as authRouter };