import Mongoose from 'mongoose';

const dbURI = `mongodb://${process.env.db_user}:${process.env.db_pwd}@${process.env.db_address?process.env.db_address:'127.0.0.1'}:${process.env.db_port?process.env.db_port:'27017'}/${process.env.db_name}?authSource=${process.env.db_authSource?process.env.db_authSource:'admin'}`;

const mongo = {
    connect:()=>{
        console.log('Trying to connect to Mongo instandce');
        let dbPromise = Mongoose.connect(
            dbURI,
            {
                useNewUrlParser:true,
                useUnifiedTopology:true
            }
        );
        console.log('Promise created');
        return dbPromise;
    }
};

export default mongo;