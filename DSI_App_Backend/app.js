import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config({ path: '../.env' });
import express from "express";
import cors from 'cors';
import childDataRoutes from './routes/childData.route.js';
import multer from 'multer';
import path from 'path';


const app = express();
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public'));
app.use(cookieParser())
app.use(cors({ origin: '*' }))
app.use(express.json());

// This method is a built-in middleware in
//  Express that parses incoming requests with JSON payloads.
app.use(express.json({ limit: '1mb' }));
try {
    console.log('Server started');
} catch (error) {
    app.on('error', (error) => {
        console.error(`Error: ${error.message}`);
    });
}

//routes 
import userRoutes from './routes/users.router.js';
import reportRoutes from './routes/reports.router.js';
import organizationRoutes from './routes/organizations.router.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/child-data', childDataRoutes);


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save to uploads/ directory
  },
  filename: function (req, file, cb) {
    // Unique filename: timestamp-originalname
    cb(null, Date.now() + '-' + file.originalname);
  }
});

export const upload = multer({ storage });

app.use('/uploads', express.static('uploads')); // Serve files at /uploads/filename.jpg

// Global error handler (must be last)
app.use(globalErrorHandler);

// module.exports = app;
export default app;

