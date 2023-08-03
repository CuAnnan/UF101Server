const Mongoose = require('mongoose');
const {db} = require('./conf.js');
const dbURI = `mongodb://${db.user}:${db.pwd}@${db.address?db.address:'127.0.0.1'}:${db.port?db.port:'27017'}/${db.name}?authSource=${db.authSource?db.authSource:'admin'}`;
console.log(dbURI);

const connectDB = {
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

module.exports = connectDB;