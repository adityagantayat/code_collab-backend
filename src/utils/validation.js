import validator from 'validator';

export const validateSignUpData = (req) => {
    const { firstName, lastName, emailId, password, age, gender } = req.body;
    if (!firstName || !emailId || !password) {
        throw new Error('Missing required fields');
    }
    else if (!validator.isEmail(emailId)) {
        throw new Error('Invalid email address');
    }
    else if (!validator.isStrongPassword(password)) {
        throw new Error('Password is not strong');
    }
};

export const validateEditProfileData = (req) => {
    const allowedEditFields = ['firstName', 'lastName', 'age', 'gender', 'about', 'skills', 'photoUrl'];
    return Object.keys(req.body).every((key) => {
        return allowedEditFields.includes(key);
    });
};