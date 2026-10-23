import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { userAuth } from './middlewares/auth.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { requestRouter } from './routes/request.routes.js';
import { userRouter } from './routes/user.routes.js';
import { sendSuccess, sendError } from './utils/response.js';

const app = express();

app.use(cors(
    {
        origin: 'http://localhost:5173',
        credentials: true,
    }
));
app.use(express.json());
app.use(cookieParser());

//healthcheck route
app.get('/healthcheck', (req, res) => {
    sendSuccess(res, 200, 'OK');
});

app.use('/auth', authRouter);

app.use('/profile', userAuth, profileRouter);
app.use('/requests', userAuth, requestRouter);
app.use('/user', userAuth, userRouter);

// Fallback 404 handler
app.use((req, res) => {
    sendError(res, 404, 'Route not found');
});

// Global error handler
 
app.use((err, req, res, next) => {
    console.error(err);
    sendError(res, 500, 'Internal server error: ' + (err.message || 'Unknown error'));
});

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