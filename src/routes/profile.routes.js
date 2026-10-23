import { Router } from 'express';
import validator from 'validator';
import bcrypt from 'bcrypt';
import { validateEditProfileData } from '../utils/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.get('/view', async (req, res) => {
    try {
        const user = req.user;
        sendSuccess(res, 200, 'Profile fetched successfully', user);
    } catch (error) {
        console.log(error);
        sendError(res, 500, 'Error getting user profile: ' + error.message);
    }
});

router.patch('/edit', async (req, res) => {
    try {
        if (!validateEditProfileData(req)) {
            return sendError(res, 400, 'Error editing user profile: Invalid edit profile data');
        }
        const user = req.user;
        Object.keys(req.body).forEach((key) => {
            user[key] = req.body[key];
        });
        await user.save();
        sendSuccess(res, 200, 'User profile updated successfully', user);
    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            return sendError(res, 400, 'Error editing user profile: ' + error.message);
        }
        sendError(res, 500, 'Error editing user profile: ' + error.message);
    }
});

router.patch('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return sendError(res, 400, 'currentPassword and newPassword are required');
    }

    try {
        const user = req.user;
        const isPasswordValid = await user.validatePassword(currentPassword);
        if (!isPasswordValid) {
            return sendError(res, 401, 'Error changing password: Invalid Current Password');
        }
        if (!validator.isStrongPassword(newPassword)) {
            return sendError(res, 400, 'Error changing password: Invalid New Password');
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        sendSuccess(res, 200, 'Password changed successfully');
    } catch (error) {
        console.log(error);
        sendError(res, 500, 'Error changing password: ' + error.message);
    }
});

export { router as profileRouter };