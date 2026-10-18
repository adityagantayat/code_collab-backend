import mongoose from 'mongoose';

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://aditya:Dravid270@cluster0.vnn3yll.mongodb.net/code_collab');
};
