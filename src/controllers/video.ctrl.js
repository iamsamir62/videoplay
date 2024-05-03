import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import fs from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination
    const sortTypeNum = Number(sortType) || -1;
    const limitNum = Number(limit);
    const pageNumber = Number(page);
    await Video.createIndexes({ title: "text", description: "text" });
    if (userId && !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    try {
        const fetchAllVideos = await Video.aggregate([
            {
                $match: {
                    isPublished: true,
                },
            },

            {
                $addFields: {
                    sortField: {
                        $toString: "$" + (sortBy || "createdAt"),
                    },
                },
            },
            {
                $facet: {
                    videos: [
                        {
                            $sort: { sortField: sortTypeNum },
                        },
                        {
                            $skip: (pageNumber - 1) * limitNum,
                        },
                        {
                            $limit: limitNum,
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner_details",
                                pipeline: [
                                    {
                                        $project: {
                                            username: 1,
                                            fullName: 1,
                                            avatar: 1,
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner_details",
                                },
                            },
                        },
                    ],
                    CountNumberOfVideo: [{ $count: "videos" }],
                },
            },
        ]);
        if (!fetchAllVideos[0]?.videos?.length) {
            throw new ApiError(402, "You should try lower page number");
        }

        // if (!fetchAllVideos[0]?.matchedVideosCount?.length) {
        //   throw new ApiError(403, "no video for this query");
        // }
        res
            .status(200)
            .json(new ApiResponse(200, fetchAllVideos, "videos fetched"));
    } catch (error) {
        throw new ApiError(500, error, "Can't get video ");
    }
});

const publishAVideo=asyncHandler(async(req,res)=>{
    let videoLocalPath;
    let thumbnailLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.videoFile) &&
        Array.isArray(req.files.thumbnailFile) &&
        req.files.videoFile.length > 0 &&
        req.files.thumbnailFile.length > 0
    ) {
        videoLocalPath = req.files.videoFile[0].path;
        thumbnailLocalPath = req.files.thumbnailFile[0].path;
    }
    console.log(req.files.videoFile);

    // const videoLocalPath = req.files?.videoFile[0]?.path
    // const thumbnailLocalPath = req.files?.thumbnailFile[0]?.path

    if (!(videoLocalPath && thumbnailLocalPath)) {
        // If any of the files are missing, we'll cancel the operation and delete received files.
        if (videoLocalPath) {
            fs.unlinkSync(videoLocalPath);
        }
        if (thumbnailLocalPath) {
            fs.unlinkSync(thumbnailLocalPath);
        }
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "All fields are required."));
    }

    let { title, description, isPublished = "true" } = req.body;

    const videoURI = await uploadOnCloudinary(videoLocalPath);
    const thumbnailURI = await uploadOnCloudinary(thumbnailLocalPath);

    let vidDurSec = Number(videoURI.duration);
    let vidDuration = Math.round(vidDurSec);
    const video = await Video.create({
        title,
        description,
        videoFile: videoURI.url,
        thumbnail: thumbnailURI.url,
        duration: vidDuration,
        owner: req.user?._id,
        isPublished: isPublished === "true" ? true : false,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { video }, "Video uploaded successfully"));
});

const getVideoById=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    if (!videoId) {
        throw new ApiError(400, "VideoId is required");  
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is not valid ");
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"This video doesn't exists")    
    }
    await Video.findByIdAndUpdate(videoId,{
        $inc:{views:1},
    });
    try {
        const getCommentLikeAndSubscriptionFortheRequestedVideo=await Video.aggregate([
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(videoId),
                    isPublished:true,
                },
            },
            {
                $facet:{
                    getVideoDetails:[
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner_details",
                                pipeline:[
                                    {
                                        $project:{
                                            username:1,
                                            fullName:1,
                                            avatar:1,
                                            createdAt:1,
                                            updatedAt:1
                                        },
                                    },
                                ]
                            },
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first:"$owner_details"
                                },
                            },
                        },
                    ],
                    getLikeCommentAndSubscription:[{
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"video",
                            as:"likes"
                        },
                    },
                    {
                        $addFields:{
                            likedByUser:{
                                $in:[req.user?._id,"$likes.likedBy"],
                            }
                        }
                    },
                    {
                        $lookup:{
                            from:"comments",
                            localField:"_id",
                            foreignField:"video",
                            as:"comments",
                        },
                    },
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"owner",
                            foreignField:"channel",
                            as:"subscribers",

                        },
                    },
                    {
                        $addFields:{
                            isSubscribedTo:{
                                $in: [req.user?._id,"$subscribers.subscriber"],
                            },
                        },
                    },
                    {$group:{
                        _id:null,
                        totalLikesOnTheVideo:{
                            $sum:{$size:"$likes"},

                        },
                        totalCommentOnTheVideo:{
                            $sum:{$size:"$comments"},
                        },
                        TotalNumberOfSubscriber:{
                            $sum: { $size:"$subscribers"}
                        },
                        isSubscribedTo: { $first: "$isSubscribedTo" },
                        likedByUser: { $first: "$likedByUser" },



                    }
                    }
                
                
                ],

                }
            }
        ]);
        if (
            !getCommentLikeAndSubscriptionFortheRequestedVideo[0].getVideoDetails
                .length
        ) {
            throw new ApiError(404, "Video does not exist");
        }
        const user = await User.findById(req.user?._id);
        const matchedVideoInWatchHistory = user.watchHistory.find((video) =>
            video.equals(videoId)
        );
        if (!matchedVideoInWatchHistory) {
            const throwVideoToWatchHistory = await User.findByIdAndUpdate(
                req.user?._id,
                {
                    $push: { watchHistory: videoId },
                },
                {
                    new: true,
                }
            );
        }

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    getCommentLikeAndSubscriptionFortheRequestedVideo,
                    "details fetched"
                )
            );
    } catch (error) {
        throw new ApiError(
            500,
            error,
            "Something went wrong while fetching the video "
        );
    }
});

const updateVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const {title,description}= req.body;
    const thumbnail=req.files?.path;
    try {
        if (!videoId) {
            throw new ApiError(400, "Video id is required");
            
        }
        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "the Video id is not valid");
        }
        const video = await Video.findById(videoId);
        if(video.owner.toString()!= req.user._id.toString())
        {
            throw new ApiError(400, "you are not allowed to update this video ");
        }
        await deleteFromCloudinary(video.thumbnail);
        const updatedImage=await uploadOnCloudinary(thumbnail);
        const updatesDetails = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    thumbnail:updatedImage?.url,
                    title,
                    description,
                },
            },
            {new:true}
            
        );
        res
            .status(200)
            .json(new ApiResponse(200, "the data has been updated", updatesDetails));
    } catch (error) {
        throw new ApiError(400, error, "error from update video ");
        
    }
})
const deleteVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    
    try {
        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "the Video id is not valid");
        }
        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(400, "Video  doesnot exist");
        }
        const videoFile=video.videoFile;
        const thumbnail=video.thumbnail;
        if(video.owner.toString() != req.user._id.toString()){
            throw new ApiError(400, "you are not allowed to delte this video ");
        }
        await deleteFromCloudinary(videoFile);
        await deleteFromCloudinary(thumbnail);
        await Comment.deleteMany({video:videoId})
        await Like.deleteMany({video:videoId})
        await Video.findByIdAndDelete(videoId);
        res.status(200).json(new ApiResponse(200, "Video Successfully  deleted "));
    } catch (error) {
        throw new ApiError(400, error);
        
    }

});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new APIError(400, "videoId is required");
    }
    if (!isValidObjectId(videoId)) {
        throw new APIError(400, "Vidoe id is not valid");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIError(404, "this video doesn't exists");
    }
    try {
        if (video.owner.toString() != req.user._id) {
            throw new APIError(
                400,
                "you can not change the publish status of this video"
            );
        } else {
            const updatedStatus = await Video.findByIdAndUpdate(
                videoId,
                {
                    $set: {
                        isPublished: !video.isPublished,
                    },
                },
                { new: true }
            );
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        updatedStatus,
                        "video published status changed successfully"
                    )
                );
        }
    } catch (error) {
        throw new APIError(
            500,
            error,
            "something went wrong while changing status "
        );
    }
});

export {
    publishAVideo,
        updateVideo,
        deleteVideo,
        getVideoById,
        getAllVideos,
        togglePublishStatus


};