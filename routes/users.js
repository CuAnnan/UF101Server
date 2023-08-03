const path = require('path');
const controllerPath = path.resolve(__dirname, '..', 'Controllers', 'UserController.js');
const UserController = require(controllerPath);
const express = require('express');
const router = express.Router();
const controller = new UserController();

const multer  = require('multer')
const storage = multer.memoryStorage();
const upload = multer({ storage:storage });


router.get('/', (req, res, next)=>{
    controller.indexAction(req, res).catch(next);
});

router.get('/register', (req, res, next)=>{
    controller.registerUserAction(req,res).catch(next);
});

router.post('/register', upload.single('mapImage'), function(req, res, next){
    console.log(req.file);
    console.log(req.body);
    res.json({
        form:'handled',
        response:true
    });
})



module.exports = router;