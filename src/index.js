import express from "express"
import connectDb from "./db/db.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
    path:'./env'
})

connectDb()
.then(()=>{
    app.listen(process.env.PORT||5001,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Db connection failed !",err)
})


