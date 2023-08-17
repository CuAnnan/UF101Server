import express from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage:storage });
const router = express.Router();

export default router;