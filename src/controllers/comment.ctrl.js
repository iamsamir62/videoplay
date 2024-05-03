import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import fs from "fs";
import { Like } from "../models/like.model.js";
import { registerUser } from "./user.ctrl.js";

// Validating Owner for further actions:
const isCommentOwner = async (userId, commentId) => {
    const commentData = await Comment.findById(commentId);
    if (commentData?.owner.toString() === userId.toString()) {
        return true;
    } else {
        return false;
    }
};

const getVideoComments= asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (!isValidObjectId(videoId)) {
        return res.status(400).json(new ApiResponse(400, {}, "Invalid object Id."));
    }
    let comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId), // Extracted all comments on the Video.
            },
        },
        {
            $lookup: {
                // Left joining of User information to comment.
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    // Used pipeline to filter out specific fields.
                    {
                        $project: {
                            fullName: 1,
                            email: 1,
                            avatarImage: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                owner: {
                    // Extracted Owner object from array field.
                    $first: "$owner",
                },
            },
        },
        {
            $sort: {
                createdAt: -1, // Sorted all comments
            },
        },
        {
            $facet: {
                metadata: [
                    // Added pagination.
                    {
                        $count: "totalComments",
                    },
                    {
                        $addFields: {
                            pageNumber: page,
                            totalPages: { $ceil: { $divide: ["$totalComments", limit] } },
                        },
                    },
                ],
                data: [
                    {
                        $skip: (page - 1) * limit,
                    },
                    {
                        $limit: limit,
                    },
                ],
            },
        },
    ]);

    comments = comments[0];
    comments.metadata = { ...comments.metadata[0] };

    return res
        .status(200)
        .json(new ApiResponse(200, { comments }, "Comments fetched successfully."));
});

//Add comment to video
const addComment= asyncHandler(async(req,res)=>{
    const {content}= req.body;
    if (!content.length>0) {
        throw new ApiError(400,"Comment cannot be empty")  
    }
    const {videoId}=req.params;
    if (!videoId) {

        throw new ApiError(400, "videoId is not valid")    
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is not valid ");
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400,"Video is not available ")  
    }
    const comment = await Comment.create({
        content,
        video:video?._id,
        owner:req.user?._id
    }); 
    return res
        .status(200)
        .json(new ApiResponse(200, comment , "Commented successfully."));
});


//update comment:
const updateComment=asyncHandler(async(req,res)=>{
    const {content}=req.body;
    if (!content.length > 0) {
        throw new ApiError(400, "Comment cannot be empty")
    }
    const {commentId}=req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment id is not valid ");
    }
    const isValidCommentOwer=await isCommentOwner(req.user?._id,commentId);
    if (!isValidCommentOwer) {
        throw new ApiError(400,"Not authorized")
        
    }
    const updatedComment= await Comment.findByIdAndUpdate(
        commentId,
        {
            content,
        },
        {new:true}
    );
    return res
    .status(200)
        .json(new ApiResponse(200, updateComment, "Comment updated successfully."))
})

const deleteComment=asyncHandler(async(req,res)=>{
    const {commentId}= req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(401,"comment id is not valid ")
    }
    const isValidCommentOwer=await isCommentOwner(req.user?._id,commentId)
    if (!isValidCommentOwer) {
        throw new ApiError(400,"Not authorized to perform this operation.")
        
    }
    await Comment.findByIdAndDelete(commentId);
    const deleteLikesOfThisComment= await Like.deleteMany({
        comment:commentId
    });
    return res
    .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully."));

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
}





