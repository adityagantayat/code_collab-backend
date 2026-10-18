import express from 'express';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { userAuth } from './middlewares/auth.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { requestRouter } from './routes/request.routes.js';
import { userRouter } from './routes/user.routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

//healthcheck route
app.get('/healthcheck', (req, res) => {
    res.send('OK');
});

app.use('/auth', authRouter);

app.use('/profile', userAuth, profileRouter);
app.use('/requests', userAuth, requestRouter);
app.use('/user', userAuth, userRouter);
connectDB()
    .then(() => {
        console.log('MongoDb connected');
        app.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    })
    .catch((err) => {
        console.log('Error connecting to MongoDB: ', err);
        process.exit(1);
    });