import express from "express"
import connectDb from "./db/db.js";
import dotenv from "dotenv";

dotenv.config({
    path:'./env'
})


connectDb()


