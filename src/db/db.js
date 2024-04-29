import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDb = async () => {
    try {
        const db = await mongoose.connect(`${process.env.URI}/${DB_Name}`, {
            
        });
        console.log(`\n MongoDB Connected! `);
    } catch (error) {
        console.log("MONGODB CONNECTION ERROR", error);
        process.exit(1);
    }
}

export default connectDb;
