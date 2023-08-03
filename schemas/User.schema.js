const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email:{type:String,unique:true,required:true,trim:true},
    passwordHash:{type:String, required:true, trim:true},
    firstName:{type:String, required:true, trim:true},
    lastName:{type:String, required:true, trim:true},
    openCategoryNumber:{type:String, required:false, trim:true},
    stsCertificateNumber:{type:String, required:false, trim:true},
    wrappedEncryptionKey:{type:String, required:true, trim:true}
});
const User = mongoose.model('User', userSchema);
module.exports = User;