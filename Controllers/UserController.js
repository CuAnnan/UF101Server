import Controller from './Controller.js';
import User from '../schemas/User.schema.js';
import {nanoid} from 'nanoid/async';
import sendMail from '../mailWrapper.js';
import ejs from 'ejs';
import path from 'path';
import * as OTPAuth from "otpauth";
import crypto from 'crypto';
import pkg from 'hi-base32';
import {get} from "mongoose";
const {encode} = pkg;

const MESSAGES = {
    NO_USER_FOUND:'No verified user was found matching that email.',
    NO_USER_LOGGED_IN:'No user logged in.',
};



function getTwoFactorAuthenticationCode(secret, period) {
    const otpConf = {
        issuer:     process.env.totp_issuer,
        label:      process.env.totp_label,
        algorithm:  process.env.totp_algorithm,
        digits:     parseInt(process.env.totp_digits),
        period:     parseInt(period),
        secret:     OTPAuth.Secret.fromBase32(secret)
    };
    return new OTPAuth.TOTP(otpConf);
}

function generateSecret()
{
    return encode(crypto.randomBytes(16));
}

class UserController extends Controller
{
    /**
     *
     * @param userFormObject This will be a formdata object sent via fetch
     * @returns {Promise<boolean>}
     */
    async validateUserFormObject(userFormObject)
    {
        /**
         * Stripped down schema object.
         */
        const userAccountSimplified = {
            email:{type:String},
            passwordHash:{type:String},
            firstname:{type:String},
            lastname:{type:String},
            uasOperatorRegistrationNumber:{type:String},
            stsCertificateNumber:{type:String},
            operationAuthorisationApprovalNumber:{type:String},
            wrappedEncryptionKey:{type:String}
        };
        const userFields = Object.keys(userAccountSimplified);
        const formFields = Object.keys(userFormObject);
        const difference = (arr1, arr2)=>arr1
            .filter(x => !arr2.includes(x))
            .concat(arr2.filter(x => !arr1.includes(x)));
        return difference(formFields,userFields).length >0;
    }

    async updateUserAccount(req, res)
    {
        let user = await User.findOne({email: req.session._id});
        if(user)
        {
            const data = req.body;
            let dataValid = this.validateUserFormObject(data);
            if(!dataValid)
            {
                throw(new Error('Form data contained invalid keys'));
            }
            await User.updateOne({id:user._id}, data);
            res.json({
                success:true
            });
        }
        else
        {
            res.json({
                success:false,
                message:MESSAGES.NO_USER_LOGGED_IN
            });
        }
    }

    async login(req, res)
    {
        let user = await User.findOne({email: req.body.email, verified: true});
        if(user)
        {
            let emailOTP = getTwoFactorAuthenticationCode(user.otp_mail_secret, process.env.totp_mail_period);
            let authOTP = getTwoFactorAuthenticationCode(user.otp_2fa_secret, process.env.totp_auth_period);

            const emailDelta = emailOTP.validate({token:req.body.emailKey});
            const authDelta = authOTP.validate({token:req.body.authKey});
            if(emailDelta === null || authDelta === null)
            {
                console.log(emailDelta, authDelta);
                console.log(user.otp_mail_secret, user.otp_2fa_secret);
                res.json({
                    success:false,
                    message:'OTP Validation Failed'
                });
            }
            else
            {
                req.session.user = user;
                res.json({
                    user:{
                        email:req.body.email.toLowerCase()
                    },
                    success:true
                });
            }
        }
        else
        {
            res.json({
                success: false,
                message: MESSAGES.NO_USER_FOUND
            });
        }
    }

    async requestLoginTokens(req, res) {
        let user = await User.findOne({email: req.body.email, verified: true});
        if (user)
        {
            const templatePath = path.resolve('views', 'emails', 'sign-in-email.ejs');
            let otp = getTwoFactorAuthenticationCode(user.otp_mail_secret, process.env.totp_mail_period);
            ejs.renderFile(templatePath, {user:user, ip_address:req.socket.remoteAddress, sign_in_key:otp.generate()}, {}, function(err, html){
                sendMail({
                    to: user.email,
                    subject: 'MOAP login',
                    html: html
                }).then(()=>{
                    res.json({
                        success:true
                    });
                });
            });
        }
        else
        {
            res.json({
                success: false,
                message: MESSAGES.NO_USER_FOUND
            });
        }
    }

    async validateUser(req, res)
    {
        let user = await User.findOne({'verificationKey':req.params.verificationKey, 'verified':false});
        if(user)
        {
            user.verified = true;
            user.verificationKey = undefined;
            const secret1 = generateSecret();
            const secret2 = generateSecret();
            const totpUrl = getTwoFactorAuthenticationCode(secret2, process.env.totp_auth_period).toString();
            user.otp_mail_secret = secret1;
            user.otp_2fa_secret = secret2;
            await user.save();
            res.render('registrationComplete', {firstname:user.firstname, totp:totpUrl});
        }
        else
        {
            res.render('registrationFailed');
        }
    }

    async registerUser(req, res)
    {
        const data = req.body;
        let dataValid = this.validateUserFormObject(data);
        if(!dataValid)
        {
            throw(new Error('Form data contained invalid keys'));
        }

        nanoid()
            .then((verificationKey)=>{
                data.verificationKey = verificationKey;
                return data;
            })
            .then((data)=>{
                return User.create(data);
            })
            .then((user)=>{
                return new Promise((resolve, reject)=> {
                    // console.log(req.protocol, req.hostname);
                    const templatePath = path.resolve('views', 'emails', 'registration.ejs');
                    ejs.renderFile(templatePath, {user:user, verificationLink:`${this.getBaseURL(req)}users/verifyAccount/${user.verificationKey}`}, {}, function(err, html){
                        if(err)
                        {
                            reject(err);
                        }
                        else
                        {
                            sendMail({
                                to: user.email,
                                subject: 'MOAP Account Registration',
                                html: html
                            }).then(()=>{
                                resolve(user);
                            });
                        }
                    });

                });
            })
            .then((user)=>{
                res.json({
                    success:true
                });
            })
            .catch((error)=>{
                res.json({
                    success:false,
                    error:error
                });
            });

    }
}

export default UserController;