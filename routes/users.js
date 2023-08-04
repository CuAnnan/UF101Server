import UserController from '../Controllers/UserController.js';
import express from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage:storage });
const router = express.Router();
const controller = new UserController();

router.post('/register', upload.none(), (req, res, next)=>{controller.registerUser(req, res).catch(next);});



export default router;