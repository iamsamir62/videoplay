import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";


const toggleVideoLike=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    try {
        
        if (!isValidObjectId(videoId)) {
            throw new ApiError(404, "Video Id is required");
        }
        const video =await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404, "video id doesn't exists");  
        }
        const loggedInUser=req.user?._id;
        const existingLike= await Like.findOne({
            likedBy:loggedInUser,
            video:video._id
        });
        console.log(existingLike)
        if(existingLike){
            await Like.findByIdAndDelete(existingLike.id);
            res.status(200).json(new ApiResponse(200, "removed Like"));
        }
        else {
            const LikedVideo = await Like.create({
                video: videoId,
                likedBy: loggedInUser,
            });
            res
                .status(200)
                .json(new ApiResponse(200, LikedVideo, "video added to Like "));
        }
    } catch (error) {
        throw new ApiError(500, error, "something went wrong");
    }
});

const toggleCommentLike=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    
        
        if (!isValidObjectId(videoId)) {
            throw new ApiError(404, "Object id is not valid");
        }
        const comment= await Comment.findById(commentId)
        if (!comment) {
            throw new ApiError("This comment doesn't exists");  
        }
        const loggedInUser=req.user?._id;
        const existingLike=await Like.findOne({
            likedBy:loggedInUser,
            comment:comment._id
        });
        try {
            if (existingLike) {
                await Like.findByIdAndDelete(existingLike._id);
                res.status(200).json(new ApiResponse(200, "Like from comment removed "));
        } else {
            const addedCommentLike = await Like.create({
                comment: commentId,
                likedBy: loggedInUser,
            });
            res
                .status(200)
                .json(
                    new ApiResponse(200, addedCommentLike, "Like in the comments added ")
                );
        }
    } catch (error) {
        throw new ApiError(500, error, "Something went wrong ");
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    let likedVideoData = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true },
            },
        },
        {
            $lookup: {
                // Left joining of Video file in Like through referenced videoId.
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            // Left joining for Video owner details.
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        // Filtering owner details specifically.
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
                            // Here, we'll be getting owner as an array, extracting first array element.
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                    {
                        $project: {
                            // Filtering video fields.
                            title: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                // Here, we'll be getting video as an array, extracting first array element.
                video: {
                    $first: "$video",
                },
            },
        },
        {
            $facet: {
                metadata: [
                    {
                        $count: "totalVideos", // Total document count is total video.
                    },
                    {
                        $addFields: {
                            pageNumber: page,
                            totalPages: { $ceil: { $divide: ["$totalVideos", limit] } },
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

    likedVideoData = likedVideoData[0];

    //TODO: get all liked videos
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { videos: likedVideoData },
                "Fetched liked videos successfully."
            )
        );
});


export {toggleVideoLike,
        toggleCommentLike,
        getLikedVideos,



}