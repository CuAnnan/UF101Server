import Controller from './Controller.js';
import User from '../schemas/User.schema.js';
import {nanoid} from 'nanoid/async';

class UserController extends Controller
{
    async logUserInFunction(req, res, next)
    {

    }

    async registerUser(req, res, next)
    {
        const data = req.body;
        nanoid()
            .then((verificationKey)=>{
                data.verificationKey = verificationKey;
                return data;
            })
            .then((data)=>{
                User.create(data);
            })
            .then((user)=>{
                res.json({
                    success:true,
                    user:user
                });
            }).catch((error)=>{
                res.json({
                    success:false,
                    error:error
                })
        });

    }
}

export default UserController;