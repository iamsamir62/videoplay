import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
    
} from "../controllers/video.ctrl.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();
router.route("/upload-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnailFile",
            maxCount: 1,
        },
    ]),
    verifyJWT,
    publishAVideo
);

router.route("/").get(verifyJWT, getAllVideos);
router.route("/:videoId").get(verifyJWT, getVideoById);
router
    .route("/update-video/:videoId")
    .patch(verifyJWT, upload.single("thumbnailFile"), updateVideo);
router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);
router.route("/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router;