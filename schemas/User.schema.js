import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email:{type:String,unique:true,required:true,trim:true},
    passwordHash:{type:String, required:true, trim:true},
    firstname:{type:String, required:true, trim:true},
    lastname:{type:String, required:true, trim:true},
    uasOperatorRegistrationNumber:{type:String, required:false, trim:true},
    stsCertificateNumber:{type:String, required:false, trim:true, unique:true},
    operationAuthorisationApprovalNumber:{type:String, required:false, trim:true, unique:true},
    wrappedEncryptionKey:{type:String, required:true, trim:true},
    otp_mail_secret:{type:String},
    otp_2fa_secret:{type:String},
    verified:{type:Boolean, default:false},
    verificationKey:{type:String}
});
const User = mongoose.model('User', userSchema);
export default User;