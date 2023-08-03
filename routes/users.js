const path = require('path');
const controllerPath = path.resolve(__dirname, '..', 'Controllers', 'UserController.js');
const UserController = require(controllerPath);
const express = require('express');
const router = express.Router();
const controller = new UserController();

const multer  = require('multer')
const storage = multer.memoryStorage();
const upload = multer({ storage:storage });

router.post('/register', upload.none(), function(req, res, next){
    res.json({
        form:'handled',
        response:true,
        body:req.body
    });
})



module.exports = router;