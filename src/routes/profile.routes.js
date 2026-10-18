import { Router } from 'express';
import validator from 'validator';
import bcrypt from 'bcrypt';
import { validateEditProfileData } from '../utils/validation.js';

const router = Router();

router.get('/view', async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).send('Error getting user profile: ' + error.message);
    }
});

router.patch('/edit', async (req, res) => {
    try {
        if (!validateEditProfileData(req)) {
            return res.status(400).send('Error editing user profile: Invalid edit profile data');
        }
        const user = req.user;
        Object.keys(req.body).forEach((key) => {
            user[key] = req.body[key];
        });
        await user.save();
        res.status(200).send('User profile updated successfully');
    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            return res.status(400).send('Error editing user profile: ' + error.message);
        }
        res.status(500).send('Error editing user profile: ' + error.message);
    }
});

router.patch('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).send('currentPassword and newPassword are required');
    }

    try {
        const user = req.user;
        const isPasswordValid = await user.validatePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).send('Error changing password: Invalid Current Password');
        }
        if (!validator.isStrongPassword(newPassword)) {
            return res.status(400).send('Error changing password: Invalid New Password');
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.status(200).send('Password changed successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error changing password: ' + error.message);
    }
});

export { router as profileRouter };