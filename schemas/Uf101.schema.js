import mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 * @type {module:mongoose.Schema<any, Model<any, any, any, any>, {}, {}, {}, {}, DefaultSchemaOptions, {sail: {type: NumberConstructor}, agl: {type: NumberConstructor}, eIdentification: {type: BooleanConstructor}, amsl: {type: NumberConstructor}, dates: {type: DateConstructor}, operator: {ref: string, type: ObjectId}, duration: {type: StringConstructor}, descriptionOfArea: {type: StringConstructor}, vhf: {type: BooleanConstructor}, uasModel: {type: StringConstructor}, remotePilotNames: {type: StringConstructor}, controlledAirspaceLocation: {type: StringConstructor}, radius: {type: NumberConstructor}, latLng: {type: StringConstructor}}, HydratedDocument<{sail: {type: NumberConstructor}, agl: {type: NumberConstructor}, eIdentification: {type: BooleanConstructor}, amsl: {type: NumberConstructor}, dates: {type: DateConstructor}, operator: {ref: string, type: ObjectId}, duration: {type: StringConstructor}, descriptionOfArea: {type: StringConstructor}, vhf: {type: BooleanConstructor}, uasModel: {type: StringConstructor}, remotePilotNames: {type: StringConstructor}, controlledAirspaceLocation: {type: StringConstructor}, radius: {type: NumberConstructor}, latLng: {type: StringConstructor}}, {}>>}
 */
const Uf101Schema=new mongoose.Schema({
    operationTitle:{type:string},
    created:{type:date, default:Date.now()},
    operator:{type: Schema.Types.ObjectId, ref: 'User' },
    uasModel:{type:String},
    remotePilots:[{type: Schema.Types.ObjectId, ref: 'User' }],
    controlledAirspaceLocation:{type:String},
    latLng:{type:String},
    radius:{type:Number},
    descriptionOfArea:{type:String},
    amsl:{type:Number},
    agl:{type:Number},
    sail:{type:Number},
    vhf:{type:Boolean},
    eIdentification:{type:Boolean},
    dates:[{type:Date}],
    duration:{type:String}
});

const model = mongoose.Model('Uf101', Uf101Schema);
export default model;