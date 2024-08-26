import mongoose from 'mongoose';
import config from 'config';
const db=config.get("mongoConnectionString");

const connectDB = async()=>{
    try{
        await mongoose.connect(db);
        console.log('Connected to MongoDB sucessfully');
    }catch(error){
       
        process.exit(1);
    }
   
};

export default connectDB;