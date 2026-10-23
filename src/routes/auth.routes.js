import { Router } from 'express';
import { validateSignUpData } from '../utils/validation.js';
import { User } from '../models/user.js';
import bcrypt from 'bcrypt';

const router = Router();

router.post('/signup', async (req, res) => {
    try {
        validateSignUpData(req);
        const { firstName, lastName, emailId, password } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({ firstName, lastName, emailId, password: passwordHash });
        await user.save();
        res.status(201).json('User saved successfully');
    } catch (error) {
        console.log(error);
        if (error.code === 11000) {
            return res.status(409).json('Error saving user: Email already exists');
        }
        if (
            error.name === 'ValidationError' ||
            error.message.includes('required') ||
            error.message.includes('Invalid') ||
            error.message.includes('strong')
        ) {
            return res.status(400).json('Error saving user: ' + error.message);
        }
        res.status(500).json('Error saving user: ' + error.message);
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { emailId, password } = req.body;
        if (!emailId || !password) {
            return res.status(400).json('Error signing in user: Email and password are required');
        }
        const user = await User.findOne({ emailId: emailId.toLowerCase() });
        if (!user) {
            return res.status(401).json('Error signing in user: Invalid Credentials');
        }
        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json('Error signing in user: Invalid Credentials');
        }
        const token = user.getJWT();
        res.cookie('token', token);
        res.status(200).json({ message: 'User signed in successfully', user });
    } catch (error) {
        console.log(error);
        res.status(500).json('Error signing in user: ' + error.message);
    }
});

router.post('/signout', async (req, res) => {
    res.cookie('token', null, { expires: new Date(Date.now()) }).status(200).json('Signed out');
});

export { router as authRouter };