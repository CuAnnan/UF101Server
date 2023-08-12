import UserController from '../Controllers/UserController.js';
import express from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage:storage });
const router = express.Router();
const controller = new UserController();

router.post('/register', upload.none(), (req, res, next)=>{controller.registerUser(req, res).catch(next);});

//http://localhost/users/verifyAccount/YW01P-56_rRyA_Z8cW_QI
router.get('/verifyAccount/:verificationKey', (req, res, next)=>{controller.validateUser(req, res).catch(next);});

router.post('/requestLoginTokens', upload.none(), (req, res, next)=>{controller.requestLoginTokens(req, res).catch(next);});

router.post('/login', upload.none(), (req, res, next)=>{controller.login(req, res).catch(next);});




export default router;