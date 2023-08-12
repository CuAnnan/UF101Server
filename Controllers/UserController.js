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
    NO_USER_FOUND:'No verified user was found matching that email'
};


function getTwoFactorAuthenticationCode(secret = process.env.totp_secret, period=process.env.totp_period) {
    console.log(secret);
    const otpConf = {
        issuer:     process.env.totp_issuer,
        label:      process.env.totp_label,
        algorithm:  process.env.totp_algorithm,
        digits:     parseInt(process.env.totp_digits),
        period:     parseInt(period),
        secret:     OTPAuth.Secret.fromBase32(secret)
    };
    console.log(otpConf);
    return new OTPAuth.TOTP(otpConf);
}

function generateSecret()
{
    return encode(crypto.randomBytes(16));
}

class UserController extends Controller
{
    async testLogin(req, res)
    {
        let user = await User.findOne({email: 'eamonn.kearns@so-4pt.net', verified: true});
        let totp = getTwoFactorAuthenticationCode(user.otp_mail_secret);
        let currentToken = totp.generate();
        let test = totp.validate({token:currentToken});
        res.json({token:currentToken, test:test});
    }

    async login(req, res)
    {
        let user = await User.findOne({email: req.body.email, verified: true});
        if(user)
        {
            let emailOTP = getTwoFactorAuthenticationCode(user.otp_mail_secret);
            let authOTP = getTwoFactorAuthenticationCode(user.otp_2fa_secret);

            const emailDelta = emailOTP.validate({token:req.body.emailKey});
            const authDelta = authOTP.validate({token:req.body.authKey});
            if(emailDelta === null || authDelta === null)
            {
                res.json({
                    success:false,
                    message:'OTP Validation Failed'
                });
            }
            else
            {
                res.json({
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
            let otp = getTwoFactorAuthenticationCode(user.otp_mail_secret);
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
            const totpUrl = getTwoFactorAuthenticationCode(secret2).toString();
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
                console.log(error);
                res.json({
                    success:false
                });
            });

    }
}

export default UserController;