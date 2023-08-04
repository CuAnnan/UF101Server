import Mongoose from 'mongoose';
import conf from './conf.js';
const db = conf.db;

const dbURI = `mongodb://${db.user}:${db.pwd}@${db.address?db.address:'127.0.0.1'}:${db.port?db.port:'27017'}/${db.name}?authSource=${db.authSource?db.authSource:'admin'}`;



const mongo = {
    connect:()=>{
        console.log('Trying to connect');
        let dbPromise = Mongoose.connect(
            dbURI,
            {
                useNewUrlParser:true,
                useUnifiedTopology:true
            }
        );
        console.log('Promise created')
        return dbPromise;
    }
};

export default mongo;