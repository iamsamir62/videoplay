import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
const toggleSubscription= asyncHandler(async(req,res)=>{
    const { channelId }=req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400,"Invalid object Id") 
    };
    let result=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(req.user?.id),
            },
        },
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            },
        },
    ]);
    if(result.length>0){
        await Subscription.findByIdAndDelete(result[0]._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed successfully."));
    }
    else{
        await Subscription.create({
            channel:channelId,
            subscriber:req.user?._id,
        })
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Subscribed successfully."));



})

// get subscriber list of channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    console.log(subscriberId);
    if (!subscriberId) {
        throw new ApiError(400, "channel Id is required ");
    }
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "the Channel Id is not valid");
    }

    if (req.user._id.toString() != subscriberId.toString()) {
        throw new ApiError(
            400,
            "You are not the owner of this channel to get subscribers list"
        );
    }

    try {
        const getSubscribedChannelsByOwner = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(subscriberId),
                },
            },
            {
                $facet: {
                    subscribers: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "subscriber",
                                foreignField: "_id",
                                as: "subscribers",
                                pipeline: [
                                    {
                                        $project: {
                                            username: 1,
                                            fullName: 1,
                                            avatar: 1,
                                            createdAt: 1,
                                            updatedAt: 1,
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            $addFields: {
                                subscriber: {
                                    $first: "$subscribers",
                                },
                            },
                        },
                    ],
                    subscriberCount: [
                        {
                            $count: "subscribers",
                        },
                    ],
                },
            },
        ]);

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    getSubscribedChannelsByOwner[0],
                    "subscriber fetched"
                )
            );
    } catch (error) {
        throw new ApiError(500, "Something went wrong while getting information ");
    }
});
// get channel list to which user has subscriber
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        return res.status(400).json(new ApiResponse(400, {}, "Invalid object Id."));
    }

    const fetchedSubscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $count: "subscribedTo",
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribedTo: fetchedSubscribedTo[0]?.subscribedTo },
                "Subscribed to fetched successfully."
            )
        );
});


export {toggleSubscription,
        getUserChannelSubscribers,
        getSubscribedChannels,
}