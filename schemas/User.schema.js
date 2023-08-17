import mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 * @type {module:mongoose.Schema<any, Model<any, any, any, any>, {}, {}, {}, {}, DefaultSchemaOptions, {firstname: {trim: boolean, type: StringConstructor, required: boolean}, stsCertificateNumber: {trim: boolean, unique: boolean, type: StringConstructor, required: boolean}, verified: {default: boolean, type: BooleanConstructor}, primaryPhoneNumber: {type: StringConstructor}, uasOperatorRegistrationNumber: {trim: boolean, type: StringConstructor, required: boolean}, verificationKey: {type: StringConstructor}, secondaryPhoneNumber: {type: StringConstructor}, passwordHash: {trim: boolean, type: StringConstructor, required: boolean}, lastname: {trim: boolean, type: StringConstructor, required: boolean}, otp_2fa_secret: {type: StringConstructor}, UF101s: [{ref: string, type: ObjectId}], operationAuthorisationApprovalNumber: {trim: boolean, unique: boolean, type: StringConstructor, required: boolean}, otp_mail_secret: {type: StringConstructor}, wrappedEncryptionKey: {trim: boolean, type: StringConstructor, required: boolean}, email: {trim: boolean, unique: boolean, type: StringConstructor, required: boolean}}, HydratedDocument<{firstname: {trim: boolean, type: StringConstructor, required: boolean}, stsCertificateNumber: {trim: boolean, unique: boolean, type: StringConstructor, required: boolean}, verified: {default: boolean, type: BooleanConstructor}, primaryPhoneNumber: {type: StringConstructor}, uasOperatorRegistrationNumber: {trim: boolean, type: StringConstructor, required: boolean}, verificationKey: {type: StringConstructor}, secondaryPhoneNumber: {type: StringConstructor}, passwordHash: {trim: boolean, type: StringConstructor, required: boolean}, lastname: {trim: boolean, type: StringConstructor, required: boolean}, otp_2fa_secret: {type: StringConstructor}, UF101s: [{ref: string, type: ObjectId}], operationAuthorisationApprovalNumber: {trim: boolean, unique: boolean, type: StringConstructor, required: boolean}, otp_mail_secret: {type: StringConstructor}, wrappedEncryptionKey: {trim: boolean, type: StringConstructor, required: boolean}, email: {trim: boolean, unique: boolean, type: StringConstructor, required: boolean}}, {}>>}
 */
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
    verificationKey:{type:String},
    primaryPhoneNumber:{type:String},
    secondaryPhoneNumber:{type:String},
    UF101s:[{ type: Schema.Types.ObjectId, ref: 'UF101' }]
});
const User = mongoose.model('User', userSchema);
export default User;