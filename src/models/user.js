import { Schema, model } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    firstName: { type: String, required: true, minLength: 3, maxLength: 10 },
    lastName: { type: String, minLength: 3, maxLength: 30 },
    emailId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minLength: 8, maxLength: 80 },
    age: { type: Number },
    gender: {
        type: String,
        enum: {
            values: ['male', 'female', 'other'],
            message: '{VALUE} is not a valid gender',
        },
    },
    about: { type: String },
    skills: { type: [String] },
    photoUrl: { type: String },
}, { timestamps: true });

userSchema.methods.validatePassword = async function (passwordInput) {
    return await bcrypt.compare(passwordInput, this.password);
};
userSchema.methods.getJWT = function () {
    return jwt.sign({ _id: this._id }, 'secret', { expiresIn: '1d' });
};
userSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.password;
        return ret;
    },
});
export const User = model('User', userSchema);

