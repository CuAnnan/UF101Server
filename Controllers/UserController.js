const Controller = require('./Controller');
const path = require('path');
const userModel = require(path.resolve(__dirname, '..', 'schemas', 'User.schema.js'));
const schema = userModel.schema;

class UserController extends Controller
{
    async indexAction(req, res, next)
    {
        let session = req.session;
    }

    async logUserInFunction(req, res, next)
    {

    }

    async registerUserAction(req, res, next)
    {
        res.render('users/register', {styles:[{url:'/css/userRegistration.css'}],scripts:[{src:'/js/cryptoConfig.js'},{src:'/js/hashPassword.js'}, {src:'/js/cryptoStuff.js'}, {src:'/js/userRegistration.js'}]});
    }

    async registerUser(req, res, next)
    {

    }
}

module.exports = UserController;