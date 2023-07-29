const mongoose = require('mongoose');
const shortid = require('shortid');

const userSchema = new mongoose.Schema({
    shortid:{type:String, default:shortid.generate},
    email:{type:String,unique:true,required:true,trim:true},
    username:{type:String,unique:true,required:true,trim:true},
    passwordHash:{type:String, required:true, trim:true},
    passwordSalt:{type:String, required:true, trim:true},
    openCategoryNumber:{type:String, required:false},
    stsCertificateNumber:{type:String, required:false}
});
const User = mongoose.model('User', userSchema);
module.exports = User;