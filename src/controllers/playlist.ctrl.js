import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    //TODO: create playlist
    if (name && description === "") {
        throw new ApiError(400, "name and description are both required");
    }
    const alreadyCreatedPlaylist = await Playlist.findOne({
        name,
    });
    if (alreadyCreatedPlaylist) {
        throw new ApiError(409, "you cannot create playlist with same name ");
    }
    try {
        const createdPlayList = await Playlist.create({
            name,
            description,
            owner: req.user._id,
        });

        res
            .status(200)
            .json(
                new ApiResponse(200, createdPlayList, "playlist has been created ")
            );
    } catch (error) {
        throw new ApiError(
            500,
            error,
            "unable to create an Playlist please try again "
        );
    }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400, "userId is required");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "user id is not valid ");
    }

    const userPlayList = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
    ]);
    if (!userPlayList?.length) {
        throw new ApiError(400, "this user haven't created any playlists yet ");
    }
    res
        .status(200)
        .json(
            new ApiResponse(200, userPlayList, "Playlist of specified user fetched ")
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id

    if (!playlistId) {
        throw new ApiError(400, "the playlist id is required");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "this PlayList doesN't exists");
    }
    try {
        const playListDetails = await Playlist.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "user_details",
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
                        $first: "$user_details",
                    },
                },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "Video details",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "Video_Owner",
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
                                VideoOwnerDetails: {
                                    $first: "$Video_Owner",
                                },
                            },
                        },
                    ],
                },
            },
        ]);
        res
            .status(200)
            .json(new ApiResponse(200, playListDetails, "PlayList details fetched "));
    } catch (error) {
        throw new ApiError(
            500,
            error,
            "something went wrong while fetching the user details "
        );
    }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(
            400,
            "The playlist ID is not valid or the playlistId doesn't exist."
        );
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(
            400,
            "The playlist ID is not valid or the VideoId  doesn't exist."
        );
    }

    const findPlayList = await Playlist.findById(playlistId);
    const findVideo = await Video.findById(videoId);

    if (!findPlayList) {
        throw new ApiError(404, "This playlist doesn't exists");
    }
    if (!findVideo) {
        throw new ApiError(404, "this video doesn't exists");
    }
    if (req.user._id.toString() != findPlaylist.owner.toString()) {
        throw new ApiError(400, "You cannot make updates in this playlist");
    }
    const matchedVideo = findPlaylist.videos.find((video) =>
        video.equals(videoId)
    );
    if (matchedVideo) {
        throw new ApiError(409, "this video already exists in this playlist ");
    }
    try {
        const UpdatedPlayList = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $push: { videos: videoId },
            },
            { new: true }
        );

        res
            .status(200)
            .json(new ApiResponse(200, UpdatedPlayList, "video Added  to Playlist "));
    } catch (error) {
        throw new ApiError(
            500,
            error,
            "Something went wrong while updating the video in playlist "
        );
    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!playlistId && !videoId) {
        throw new ApiError(400, "Video and playlist id is important ");
    }
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Playlist or Video Id is not valid ");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "this playlist doesn't exist or it may be deleted");
    }
    if (Playlist.owner.toString() != req.user._id.toString()) {
        throw new ApiError(
            400,
            "You cannot delete videos from this playlist because this is not created by you "
        );
    }

    const matchedVideo = Playlist.videos.find((video) => video.equals(videoId));
    if (!matchedVideo) {
        throw new ApiError(400, "this video doesn't  exists in the playlist");
    }
    try {
        const UpdatedPlayList = await Playlist.findByIdAndUpdate(
            playlist,
            {
                $pull: { videos: videoId },
            },
            { new: true }
        );
        res
            .status(200)
            .json(new ApiResponse(200, UpdatedPlayList, "video deleted "));
    } catch (error) {
        throw new ApiError(
            400,
            "Some thing went wrong while  deleting the video from the playlist "
        );
    }
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!playlistId) {
        throw new ApiError(400, "PlayListId is required ");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "it is not valid playListId");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "this play list Doesn't exists");
    }
    if (req.user._id.toString() != Playlist.owner.toString()) {
        throw new ApiError(
            400,
            "you cannot change this Playlist because this is not created by you "
        );
    }

    try {
        await Playlist.findByIdAndDelete(playlistId);
        res.status(200).json(new ApiResponse(200, {}, "playlist deleted"));
    } catch (error) {
        throw new ApiError(
            500,
            error,
            "Something went wrong while deleting the playlist"
        );
    }
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
    if (!playlistId) {
        throw new ApiError(400, "playlist Id is required");
    }
    if (!name || !description) {
        throw new ApiError(400, "name and description is required");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "the playlist id is not valid");
    }
    const playList = await Playlist.findById(playlistId);
    if (!playList) {
        throw new ApiError(400, "this playlist doesn't exists");
    }
    if (req.user._id.toString() != Playlist.owner.toString()) {
        throw new ApiError(
            400,
            "You cannot make changes in this playlist because this is not created by you "
        );
    }
    try {
        const updatedPlayList = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description,
                },
            },
            { new: true }
        );
        res
            .status(200)
            .json(new ApiResponse(200, updatedPlayList, "Playlist Updated "));
    } catch (error) {
        throw new ApiError(
            500,
            error,
            "Something went wrong while updating the playlist "
        );
    }
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};