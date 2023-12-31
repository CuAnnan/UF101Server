import UserController from '../Controllers/UserController.js';
import express from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage:storage });
const router = express.Router();
const controller = new UserController();

router.post('/account', upload.none(), (req, res, next)=>{
    if(req.body.submit_to === 'register')
    {
        controller.registerUser(req, res).catch(next);
    }
    else if(req.body.submit_to === 'update')
    {
        controller.updateUserAccount(req, res).catch(next);
    }
    else
    {
        next();
    }
});

//http://localhost/users/verifyAccount/YW01P-56_rRyA_Z8cW_QI
router.get('/verifyAccount/:verificationKey', (req, res, next)=>{controller.validateUser(req, res).catch(next);});

router.post('/requestLoginTokens', upload.none(), (req, res, next)=>{controller.requestLoginTokens(req, res).catch(next);});

router.post('/login', upload.none(), (req, res, next)=>{controller.login(req, res).catch(next);});

router.post('/logout', upload.none(), (req, res, next)=>{controller.logout(req, res).catch(next);});

router.post('/checkLoginStatus', upload.none(), (req, res, next)=>{controller.checkLoginStatus(req, res).catch(next);});

export default router;