 import { asyncHandler } from "../utils/asyncHandler.js";
 import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
 import {User} from "../models/user.model.js"
 import { uploadONCloudinary } from "../utils/cloudinary.js";


const registerUser = asyncHandler(async (req, res) => {
    const {fullname,email,username,password}= req.body
    
    if (
        [fullname,email,username,password].some((field)=>
        field?.trim()==="")
    ) {
        throw new ApiError(400,"All fields are required")
        
    }
    const existedUser=await User.findOne({
        $or:[{email} , {username}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }
    const avtarLocalpath=req.files?.avatar[0]?.path;
    const coverLocalpath=req.files?.coverImage[0]?.path;
    
    if(!avtarLocalpath){
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar= await uploadONCloudinary(avtarLocalpath)
    const coverImage= await uploadONCloudinary(coverLocalpath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")

    }
    const user= await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()

    })
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registerig the user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created successfully")
    )

    
});



 export {registerUser}