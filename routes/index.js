import express from 'express';
const router = express.Router();
import Controller from '../Controllers/Controller.js';

const controller = new Controller();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/test', (req, res, next)=>{
  res.json({
    url:controller.getBaseURL(req)
  })
});

export default router;